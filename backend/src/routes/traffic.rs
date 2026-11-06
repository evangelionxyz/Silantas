use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    appstate::AppState,
    db,
    models::traffic::{
        CreateTrafficRequest, TrafficFilterParams, TrafficRecord, TrafficSummaryItem,
        UpdateTrafficRequest,
    },
    services::{audit::record_audit_log, auth::extract_claims_from_headers},
};

pub fn traffic_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_traffic_handler).post(create_traffic_handler))
        .route("/summary", get(get_traffic_summary_handler))
        .route(
            "/{id}",
            get(get_traffic_handler)
                .put(update_traffic_handler)
                .delete(delete_traffic_handler),
        )
}

pub async fn list_traffic_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<TrafficFilterParams>,
) -> impl IntoResponse {
    let _claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut query_builder = sqlx::QueryBuilder::new(
        "SELECT id, record_number, traffic_type, category, item_name, quantity, unit, origin, destination, 
                transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, 
                traffic_date, created_at, updated_at 
         FROM silantas.traffic_records WHERE 1=1"
    );

    if let Some(search) = params.search.as_deref() {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed);
            query_builder.push(" AND (item_name ILIKE ");
            query_builder.push_bind(pattern.clone());
            query_builder.push(" OR record_number ILIKE ");
            query_builder.push_bind(pattern.clone());
            query_builder.push(" OR applicant_name ILIKE ");
            query_builder.push_bind(pattern);
            query_builder.push(")");
        }
    }

    if let Some(cat) = params.category.as_deref() {
        let trimmed = cat.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            query_builder.push(" AND category = ");
            query_builder.push_bind(trimmed.to_string());
        }
    }

    if let Some(t_type) = params.traffic_type.as_deref() {
        let trimmed = t_type.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            query_builder.push(" AND traffic_type = ");
            query_builder.push_bind(trimmed.to_string());
        }
    }

    if let Some(status) = params.inspection_status.as_deref() {
        let trimmed = status.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            query_builder.push(" AND inspection_status = ");
            query_builder.push_bind(trimmed.to_string());
        }
    }

    if let Some(from_date) = params.from_date {
        query_builder.push(" AND traffic_date >= ");
        query_builder.push_bind(from_date);
    }

    if let Some(to_date) = params.to_date {
        query_builder.push(" AND traffic_date <= ");
        query_builder.push_bind(to_date);
    }

    query_builder.push(" ORDER BY traffic_date DESC, created_at DESC LIMIT ");
    query_builder.push_bind(per_page);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let records = query_builder
        .build_query_as::<TrafficRecord>()
        .fetch_all(&state.pool)
        .await;

    match records {
        Ok(items) => {
            let count_record = db::query_scalar::<sqlx::Postgres, i64>(
                "SELECT COUNT(*) FROM silantas.traffic_records;"
            )
            .fetch_one(&state.pool)
            .await
            .unwrap_or(0);

            (
                StatusCode::OK,
                Json(json!({
                    "data": items,
                    "meta": {
                        "page": page,
                        "perPage": per_page,
                        "total": count_record,
                        "totalPages": (count_record as f64 / per_page as f64).ceil() as i64
                    }
                })),
            )
        }
        Err(e) => {
            tracing::error!("Fetch traffic records error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal mengambil data lalu lintas", "code": "DB_ERROR" })),
            )
        }
    }
}

pub async fn get_traffic_summary_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    let summary_items = db::query_as::<sqlx::Postgres, TrafficSummaryItem>(
        "SELECT 
            item_name, 
            category, 
            unit,
            COALESCE(SUM(CASE WHEN traffic_type = 'IMPORT' THEN quantity ELSE 0 END), 0) AS total_import,
            COALESCE(SUM(CASE WHEN traffic_type = 'EXPORT' THEN quantity ELSE 0 END), 0) AS total_export,
            COALESCE(SUM(quantity), 0) AS total_volume,
            COALESCE(SUM(CASE WHEN traffic_type = 'IMPORT' THEN quantity ELSE 0 END) - SUM(CASE WHEN traffic_type = 'EXPORT' THEN quantity ELSE 0 END), 0) AS current_storage,
            COUNT(*) AS record_count
        FROM silantas.traffic_records
        GROUP BY item_name, category, unit
        ORDER BY category, item_name;"
    )
    .fetch_all(&state.pool)
    .await;

    let overall = db::query_as::<sqlx::Postgres, (i64, Option<f64>, Option<f64>)>(
        "SELECT 
            COUNT(*),
            SUM(CASE WHEN traffic_type = 'IMPORT' THEN quantity ELSE 0 END),
            SUM(CASE WHEN traffic_type = 'EXPORT' THEN quantity ELSE 0 END)
         FROM silantas.traffic_records;"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let import_qty = overall.1.unwrap_or(0.0);
    let export_qty = overall.2.unwrap_or(0.0);

    match summary_items {
        Ok(items) => (
            StatusCode::OK,
            Json(json!({
                "items": items,
                "overall": {
                    "totalRecords": overall.0,
                    "totalImportQty": import_qty,
                    "totalExportQty": export_qty,
                    "totalCombinedQty": import_qty + export_qty,
                    "totalStorageQty": import_qty - export_qty
                }
            })),
        ),
        Err(e) => {
            tracing::error!("Fetch summary error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal menghitung rekapitulasi data", "code": "DB_ERROR" })),
            )
        }
    }
}

pub async fn get_traffic_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let _claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    let record = db::query_as::<sqlx::Postgres, TrafficRecord>(
        "SELECT id, record_number, traffic_type, category, item_name, quantity, unit, origin, destination, 
                transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, 
                traffic_date, created_at, updated_at 
         FROM silantas.traffic_records WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    match record {
        Ok(Some(r)) => (StatusCode::OK, Json(json!(r))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Data tidak ditemukan", "code": "NOT_FOUND" })),
        ),
        Err(e) => {
            tracing::error!("Fetch record error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan pada database", "code": "DB_ERROR" })),
            )
        }
    }
}

pub async fn create_traffic_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateTrafficRequest>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" && claims.role != "petugas" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Hanya Petugas dan Administrator yang dapat menambahkan data", "code": "FORBIDDEN" })),
        );
    }

    let user_id = Uuid::parse_str(&claims.sub).ok();
    let new_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let traffic_date = payload.traffic_date.unwrap_or_else(|| chrono::Utc::now().date_naive());
    let inspection_status = payload.inspection_status.unwrap_or_else(|| "PENDING".to_string());

    let insert_res = db::query(
        "INSERT INTO silantas.traffic_records 
        (id, record_number, traffic_type, category, item_name, quantity, unit, origin, destination, 
         transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, 
         traffic_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);"
    )
    .bind(new_id)
    .bind(&payload.record_number)
    .bind(&payload.traffic_type)
    .bind(&payload.category)
    .bind(&payload.item_name)
    .bind(payload.quantity)
    .bind(&payload.unit)
    .bind(&payload.origin)
    .bind(&payload.destination)
    .bind(&payload.transport_type)
    .bind(&payload.applicant_name)
    .bind(&payload.health_certificate_no)
    .bind(&inspection_status)
    .bind(&payload.notes)
    .bind(user_id)
    .bind(traffic_date)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await;

    if let Err(e) = insert_res {
        tracing::error!("Create traffic record error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal menyimpan data lalu lintas", "code": "DB_INSERT_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        user_id,
        &claims.sub,
        &claims.role,
        "CREATE",
        "TRAFFIC_RECORD",
        Some(&new_id.to_string()),
        &format!(
            "Mencatat data {} {}: {} {} {} (No: {})",
            payload.traffic_type, payload.category, payload.quantity, payload.unit, payload.item_name, payload.record_number
        ),
        Some(json!({ "recordId": new_id, "itemName": payload.item_name, "quantity": payload.quantity, "unit": payload.unit })),
    )
    .await;

    let created = TrafficRecord {
        id: new_id,
        record_number: payload.record_number,
        traffic_type: payload.traffic_type,
        category: payload.category,
        item_name: payload.item_name,
        quantity: payload.quantity,
        unit: payload.unit,
        origin: payload.origin,
        destination: payload.destination,
        transport_type: payload.transport_type,
        applicant_name: payload.applicant_name,
        health_certificate_no: payload.health_certificate_no,
        inspection_status,
        notes: payload.notes,
        recorded_by: user_id,
        traffic_date,
        created_at: now,
        updated_at: now,
    };

    (StatusCode::CREATED, Json(json!(created)))
}

pub async fn update_traffic_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTrafficRequest>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role == "pimpinan" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Akses baca-saja. Tidak dapat mengubah data", "code": "FORBIDDEN" })),
        );
    }

    let existing = db::query_as::<sqlx::Postgres, TrafficRecord>(
        "SELECT id, record_number, traffic_type, category, item_name, quantity, unit, origin, destination, 
                transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, 
                traffic_date, created_at, updated_at 
         FROM silantas.traffic_records WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    let current = match existing {
        Ok(Some(r)) => r,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Data tidak ditemukan", "code": "NOT_FOUND" })),
            );
        }
        Err(e) => {
            tracing::error!("Fetch existing error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan pada database", "code": "DB_ERROR" })),
            );
        }
    };

    let is_inspector = claims.role == "dokter_hewan";
    let record_number = if is_inspector { current.record_number } else { payload.record_number.unwrap_or(current.record_number) };
    let traffic_type = if is_inspector { current.traffic_type } else { payload.traffic_type.unwrap_or(current.traffic_type) };
    let category = if is_inspector { current.category } else { payload.category.unwrap_or(current.category) };
    let item_name = if is_inspector { current.item_name } else { payload.item_name.unwrap_or(current.item_name) };
    let quantity = if is_inspector { current.quantity } else { payload.quantity.unwrap_or(current.quantity) };
    let unit = if is_inspector { current.unit } else { payload.unit.unwrap_or(current.unit) };
    let origin = if is_inspector { current.origin } else { payload.origin.unwrap_or(current.origin) };
    let destination = if is_inspector { current.destination } else { payload.destination.unwrap_or(current.destination) };
    let transport_type = if is_inspector { current.transport_type } else { payload.transport_type.unwrap_or(current.transport_type) };
    let applicant_name = if is_inspector { current.applicant_name } else { payload.applicant_name.unwrap_or(current.applicant_name) };
    let traffic_date = if is_inspector { current.traffic_date } else { payload.traffic_date.unwrap_or(current.traffic_date) };

    let health_certificate_no = payload.health_certificate_no.or(current.health_certificate_no);
    let inspection_status = payload.inspection_status.unwrap_or(current.inspection_status);
    let notes = payload.notes.or(current.notes);
    let now = chrono::Utc::now();

    let update_res = db::query(
        "UPDATE silantas.traffic_records 
        SET record_number = $1, traffic_type = $2, category = $3, item_name = $4, quantity = $5, unit = $6, 
            origin = $7, destination = $8, transport_type = $9, applicant_name = $10, health_certificate_no = $11, 
            inspection_status = $12, notes = $13, traffic_date = $14, updated_at = $15
        WHERE id = $16;"
    )
    .bind(&record_number)
    .bind(&traffic_type)
    .bind(&category)
    .bind(&item_name)
    .bind(quantity)
    .bind(&unit)
    .bind(&origin)
    .bind(&destination)
    .bind(&transport_type)
    .bind(&applicant_name)
    .bind(&health_certificate_no)
    .bind(&inspection_status)
    .bind(&notes)
    .bind(traffic_date)
    .bind(now)
    .bind(id)
    .execute(&state.pool)
    .await;

    if let Err(e) = update_res {
        tracing::error!("Update traffic record error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal memperbarui data", "code": "DB_UPDATE_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        Uuid::parse_str(&claims.sub).ok(),
        &claims.sub,
        &claims.role,
        "UPDATE",
        "TRAFFIC_RECORD",
        Some(&id.to_string()),
        &format!("Memperbarui data lalu lintas {} (Status: {})", record_number, inspection_status),
        Some(json!({ "recordId": id, "status": inspection_status })),
    )
    .await;

    let updated = TrafficRecord {
        id,
        record_number,
        traffic_type,
        category,
        item_name,
        quantity,
        unit,
        origin,
        destination,
        transport_type,
        applicant_name,
        health_certificate_no,
        inspection_status,
        notes,
        recorded_by: current.recorded_by,
        traffic_date,
        created_at: current.created_at,
        updated_at: now,
    };

    (StatusCode::OK, Json(json!(updated)))
}

pub async fn delete_traffic_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" && claims.role != "petugas" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Hanya Administrator dan Petugas yang dapat menghapus data", "code": "FORBIDDEN" })),
        );
    }

    let del_res = db::query("DELETE FROM silantas.traffic_records WHERE id = $1;")
        .bind(id)
        .execute(&state.pool)
        .await;

    match del_res {
        Ok(res) if res.rows_affected() > 0 => {
            record_audit_log(
                &state.pool,
                Uuid::parse_str(&claims.sub).ok(),
                &claims.sub,
                &claims.role,
                "DELETE",
                "TRAFFIC_RECORD",
                Some(&id.to_string()),
                &format!("Menghapus data lalu lintas dengan ID: {}", id),
                None,
            )
            .await;

            (StatusCode::OK, Json(json!({ "message": "Data berhasil dihapus" })))
        }
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Data tidak ditemukan", "code": "NOT_FOUND" })),
        ),
        Err(e) => {
            tracing::error!("Delete record error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal menghapus data", "code": "DB_ERROR" })),
            )
        }
    }
}
