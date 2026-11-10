use std::collections::HashMap;
use std::path::PathBuf;
use tokio::io::AsyncWriteExt;

use axum::{
    body::Body,
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    appstate::AppState,
    db,
    models::traffic::{
        CreateTrafficRequest, TrafficAttachment, TrafficFilterParams, TrafficRecord,
        TrafficRouteSummaryItem, TrafficSummaryItem, UpdateTrafficRequest,
    },
    services::{
        audit::record_audit_log,
        auth::{extract_claims_from_headers, verify_jwt},
    },
};

const SUMMARY_CACHE_KEY: &str = "silantas:cache:traffic_summary";
const UPLOADS_DIR: &str = "./uploads/traffic_attachments";

pub fn get_uploads_dir() -> PathBuf {
    let dir = std::env::var("TRAFFIC_ATTACHMENT_DIR").unwrap_or_else(|_| UPLOADS_DIR.to_string());
    let path = PathBuf::from(dir);
    if !path.exists() {
        let _ = std::fs::create_dir_all(&path);
    }
    path
}

async fn invalidate_summary_cache(state: &AppState) {
    if let Some(ref redis) = state.redis {
        if let Err(e) = redis.del(SUMMARY_CACHE_KEY).await {
            tracing::warn!("Failed to invalidate summary cache: {e}");
        }
    }
}

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
        .route(
            "/{id}/attachments",
            post(upload_attachments_handler)
                .layer(DefaultBodyLimit::max(100 * 1024 * 1024))
                .get(list_attachments_handler),
        )
        .route("/attachments/{id}", get(get_attachment_file_handler).delete(delete_attachment_handler))
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
        "SELECT id, record_number, traffic_type, category, item_name, quantity::double precision AS quantity, unit, origin, destination,
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
        Ok(mut items) => {
            let record_ids: Vec<Uuid> = items.iter().map(|r| r.id).collect();
            if !record_ids.is_empty() {
                if let Ok(attachments) = db::query_as::<sqlx::Postgres, TrafficAttachment>(
                    "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
                     FROM silantas.traffic_attachments WHERE traffic_id = ANY($1) ORDER BY created_at ASC;"
                )
                .bind(&record_ids)
                .fetch_all(&state.pool)
                .await
                {
                    let mut att_map: HashMap<Uuid, Vec<TrafficAttachment>> = HashMap::new();
                    for att in attachments {
                        att_map.entry(att.traffic_id).or_default().push(att);
                    }
                    for item in &mut items {
                        if let Some(atts) = att_map.remove(&item.id) {
                            item.attachments = atts;
                        }
                    }
                }
            }

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

    // Try reading from in-node mini-redis cache first
    if let Some(ref redis) = state.redis {
        if let Ok(Some(cached_json)) = redis.get_json::<serde_json::Value>(SUMMARY_CACHE_KEY).await {
            return (StatusCode::OK, Json(cached_json));
        }
    }

    let summary_items = db::query_as::<sqlx::Postgres, TrafficSummaryItem>(
        "SELECT 
            item_name, 
            category, 
            unit,
            COALESCE(SUM(CASE WHEN traffic_type = 'IMPORT' THEN quantity ELSE 0 END), 0)::double precision AS total_import,
            COALESCE(SUM(CASE WHEN traffic_type = 'EXPORT' THEN quantity ELSE 0 END), 0)::double precision AS total_export,
            COALESCE(SUM(quantity), 0)::double precision AS total_volume,
            COALESCE(SUM(CASE WHEN traffic_type = 'IMPORT' THEN quantity ELSE 0 END) - SUM(CASE WHEN traffic_type = 'EXPORT' THEN quantity ELSE 0 END), 0)::double precision AS current_storage,
            COUNT(*) AS record_count
        FROM silantas.traffic_records
        WHERE inspection_status = 'INSPECTED_PASS'
        GROUP BY item_name, category, unit
        ORDER BY category, item_name;"
    )
    .fetch_all(&state.pool)
    .await;

    let route_items = db::query_as::<sqlx::Postgres, TrafficRouteSummaryItem>(
        "SELECT 
            traffic_type,
            origin,
            destination,
            item_name,
            category,
            unit,
            transport_type,
            COALESCE(SUM(quantity), 0)::double precision AS total_quantity,
            COUNT(*) AS record_count
        FROM silantas.traffic_records
        WHERE inspection_status = 'INSPECTED_PASS'
        GROUP BY traffic_type, origin, destination, item_name, category, unit, transport_type
        ORDER BY total_quantity DESC, record_count DESC;"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let overall = db::query_as::<sqlx::Postgres, (i64, Option<f64>, Option<f64>, i64, i64)>(
        "SELECT 
            COUNT(*) FILTER (WHERE inspection_status = 'INSPECTED_PASS'),
            SUM(CASE WHEN traffic_type = 'IMPORT' AND inspection_status = 'INSPECTED_PASS' THEN quantity ELSE 0 END)::double precision,
            SUM(CASE WHEN traffic_type = 'EXPORT' AND inspection_status = 'INSPECTED_PASS' THEN quantity ELSE 0 END)::double precision,
            COUNT(*) FILTER (WHERE inspection_status = 'PENDING'),
            COUNT(*) FILTER (WHERE inspection_status = 'INSPECTED_REJECT')
         FROM silantas.traffic_records;"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0), 0, 0));

    let import_qty = overall.1.unwrap_or(0.0);
    let export_qty = overall.2.unwrap_or(0.0);

    match summary_items {
        Ok(items) => {
            let response_payload = json!({
                "items": items,
                "routes": route_items,
                "overall": {
                    "totalRecords": overall.0,
                    "totalImportQty": import_qty,
                    "totalExportQty": export_qty,
                    "totalCombinedQty": import_qty + export_qty,
                    "totalStorageQty": import_qty - export_qty,
                    "pendingRecords": overall.3,
                    "rejectedRecords": overall.4
                }
            });

            if let Some(ref redis) = state.redis {
                if let Err(e) = redis.set_json_ex(SUMMARY_CACHE_KEY, &response_payload, 300).await {
                    tracing::warn!("Failed to cache traffic summary in Redis: {e}");
                }
            }

            (StatusCode::OK, Json(response_payload))
        }
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
        "SELECT id, record_number, traffic_type, category, item_name, quantity::double precision AS quantity, unit, origin, destination,
                transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, 
                traffic_date, created_at, updated_at 
         FROM silantas.traffic_records WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    match record {
        Ok(Some(mut r)) => {
            let attachments = db::query_as::<sqlx::Postgres, TrafficAttachment>(
                "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
                 FROM silantas.traffic_attachments WHERE traffic_id = $1 ORDER BY created_at ASC;"
            )
            .bind(r.id)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();

            r.attachments = attachments;
            (StatusCode::OK, Json(json!(r)))
        }
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
        VALUES ($1, $2, $3, $4, $5, $6::numeric, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);"
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
        attachments: vec![],
    };

    invalidate_summary_cache(&state).await;

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
        "SELECT id, record_number, traffic_type, category, item_name, quantity::double precision AS quantity, unit, origin, destination,
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
        SET record_number = $1, traffic_type = $2, category = $3, item_name = $4, quantity = $5::numeric, unit = $6,
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

    let attachments = db::query_as::<sqlx::Postgres, TrafficAttachment>(
        "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.traffic_attachments WHERE traffic_id = $1 ORDER BY created_at ASC;"
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

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
        attachments,
    };

    invalidate_summary_cache(&state).await;

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

    // Fetch attachments so we can delete their physical files from disk
    let attachments = db::query_as::<sqlx::Postgres, TrafficAttachment>(
        "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.traffic_attachments WHERE traffic_id = $1;"
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let del_res = db::query("DELETE FROM silantas.traffic_records WHERE id = $1;")
        .bind(id)
        .execute(&state.pool)
        .await;

    match del_res {
        Ok(res) if res.rows_affected() > 0 => {
            let uploads_dir = get_uploads_dir();
            for att in attachments {
                if let Some(file_name) = std::path::Path::new(&att.file_path).file_name() {
                    let full_path = uploads_dir.join(file_name);
                    let _ = tokio::fs::remove_file(full_path).await;
                }
            }

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

            invalidate_summary_cache(&state).await;

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

pub async fn upload_attachments_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(traffic_id): Path<Uuid>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            )
                .into_response();
        }
    };

    if claims.role == "pimpinan" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Pimpinan memiliki akses baca-saja", "code": "FORBIDDEN" })),
        )
            .into_response();
    }

    // Check if traffic record exists
    let record_exists = db::query_scalar::<sqlx::Postgres, i64>(
        "SELECT COUNT(*) FROM silantas.traffic_records WHERE id = $1;"
    )
    .bind(traffic_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    if record_exists == 0 {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Data lalu lintas tidak ditemukan", "code": "NOT_FOUND" })),
        )
            .into_response();
    }

    let uploads_dir = get_uploads_dir();
    let mut saved_attachments: Vec<TrafficAttachment> = Vec::new();
    let user_id = Uuid::parse_str(&claims.sub).ok();

    // 10MB per file limit
    const MAX_FILE_SIZE: usize = 10 * 1024 * 1024;

    while let Some(mut field) = match multipart.next_field().await {
        Ok(f) => f,
        Err(e) => {
            tracing::error!("Failed to parse multipart field: {e}");
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "message": format!("Gagal memproses form berkas: {e}"),
                    "code": "MULTIPART_ERROR"
                })),
            )
                .into_response();
        }
    } {
        let field_name = field.name().unwrap_or_default().to_string();
        if field_name != "files" && field_name != "attachments" && field_name != "file" {
            continue;
        }

        let raw_filename = field.file_name().unwrap_or("document").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();

        let ext = match content_type.as_str() {
            "application/pdf" => "pdf",
            "image/jpeg" | "image/jpg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            _ => {
                let lower = raw_filename.to_lowercase();
                if lower.ends_with(".pdf") {
                    "pdf"
                } else if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
                    "jpg"
                } else if lower.ends_with(".png") {
                    "png"
                } else if lower.ends_with(".webp") {
                    "webp"
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(json!({
                            "message": format!("Tipe berkas tidak didukung: {raw_filename}. Hanya PDF dan Gambar (JPG/PNG/WEBP) yang diperbolehkan."),
                            "code": "INVALID_FILE_TYPE"
                        })),
                    )
                        .into_response();
                }
            }
        };

        let mime = match ext {
            "pdf" => "application/pdf",
            "jpg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            _ => "application/octet-stream",
        };

        let attachment_id = Uuid::new_v4();
        let stored_filename = format!("{}.{}", attachment_id, ext);
        let dest_path = uploads_dir.join(&stored_filename);

        let mut file = match tokio::fs::File::create(&dest_path).await {
            Ok(f) => f,
            Err(e) => {
                tracing::error!("Failed to create destination file {}: {e}", dest_path.display());
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "message": "Gagal mempersiapkan berkas di server", "code": "IO_ERROR" })),
                )
                    .into_response();
            }
        };

        let mut file_size: i64 = 0;
        let mut stream_err: Option<String> = None;

        loop {
            match field.chunk().await {
                Ok(Some(chunk)) => {
                    file_size += chunk.len() as i64;
                    if file_size > MAX_FILE_SIZE as i64 {
                        stream_err = Some(format!("Ukuran berkas {} melebihi batas 10MB", raw_filename));
                        break;
                    }
                    if let Err(e) = file.write_all(&chunk).await {
                        tracing::error!("Failed to write chunk: {e}");
                        stream_err = Some("Gagal menulis data berkas ke penyimpanan server".to_string());
                        break;
                    }
                }
                Ok(None) => break,
                Err(e) => {
                    tracing::error!("Failed to stream multipart chunk: {e}");
                    stream_err = Some(format!("Gagal membaca konten berkas: {e}"));
                    break;
                }
            }
        }

        if let Some(err_msg) = stream_err {
            let _ = tokio::fs::remove_file(&dest_path).await;
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "message": err_msg, "code": "UPLOAD_ERROR" })),
            )
                .into_response();
        }

        if let Err(e) = file.flush().await {
            tracing::error!("Failed to flush file: {e}");
            let _ = tokio::fs::remove_file(&dest_path).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal menyimpan berkas ke server", "code": "IO_ERROR" })),
            )
                .into_response();
        }

        if file_size == 0 {
            let _ = tokio::fs::remove_file(&dest_path).await;
            continue;
        }

        let now = chrono::Utc::now();
        let relative_path = format!("uploads/traffic_attachments/{}", stored_filename);

        let insert_res = db::query(
            "INSERT INTO silantas.traffic_attachments (id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8);"
        )
        .bind(attachment_id)
        .bind(traffic_id)
        .bind(&raw_filename)
        .bind(&relative_path)
        .bind(mime)
        .bind(file_size)
        .bind(user_id)
        .bind(now)
        .execute(&state.pool)
        .await;

        if let Err(e) = insert_res {
            tracing::error!("Failed to save attachment metadata: {e}");
            let _ = tokio::fs::remove_file(&dest_path).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal menyimpan metadata lampiran ke database", "code": "DB_ERROR" })),
            )
                .into_response();
        }

        saved_attachments.push(TrafficAttachment {
            id: attachment_id,
            traffic_id,
            file_name: raw_filename,
            file_path: relative_path,
            mime_type: mime.to_string(),
            file_size,
            uploaded_by: user_id,
            created_at: now,
        });
    }

    if !saved_attachments.is_empty() {
        record_audit_log(
            &state.pool,
            user_id,
            &claims.sub,
            &claims.role,
            "UPLOAD",
            "TRAFFIC_ATTACHMENT",
            Some(&traffic_id.to_string()),
            &format!("Mengunggah {} berkas lampiran pendukung", saved_attachments.len()),
            Some(json!({ "trafficId": traffic_id, "count": saved_attachments.len() })),
        )
        .await;
    }

    (StatusCode::CREATED, Json(json!(saved_attachments))).into_response()
}

pub async fn list_attachments_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(traffic_id): Path<Uuid>,
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

    let attachments = db::query_as::<sqlx::Postgres, TrafficAttachment>(
        "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.traffic_attachments WHERE traffic_id = $1 ORDER BY created_at ASC;"
    )
    .bind(traffic_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(json!(attachments)))
}

#[derive(Debug, Deserialize)]
pub struct AttachmentQuery {
    pub download: Option<bool>,
    pub token: Option<String>,
}

pub async fn get_attachment_file_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Query(query): Query<AttachmentQuery>,
) -> Response {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => Ok(c),
        Err(e) => {
            if let Some(tok) = &query.token {
                verify_jwt(tok, &state.config.jwt_secret).map_err(|_| e)
            } else {
                Err(e)
            }
        }
    };

    if claims.is_err() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "message": "Otorisasi tidak valid", "code": "UNAUTHORIZED" })),
        )
            .into_response();
    }

    let attachment = db::query_as::<sqlx::Postgres, TrafficAttachment>(
        "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.traffic_attachments WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    let att = match attachment {
        Ok(Some(a)) => a,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Berkas lampiran tidak ditemukan", "code": "NOT_FOUND" })),
            )
                .into_response();
        }
        Err(e) => {
            tracing::error!("Fetch attachment error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan database", "code": "DB_ERROR" })),
            )
                .into_response();
        }
    };

    let file_part = std::path::Path::new(&att.file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default();

    let full_path = get_uploads_dir().join(file_part);

    let content = match tokio::fs::read(&full_path).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Attachment file not found on disk {}: {e}", full_path.display());
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Berkas fisik tidak ditemukan di server", "code": "FILE_NOT_FOUND" })),
            )
                .into_response();
        }
    };

    let file_size = content.len();
    let body = Body::from(content);

    let disposition_type = if query.download.unwrap_or(false) {
        "attachment"
    } else {
        "inline"
    };
    let clean_filename = att.file_name.replace('"', "").replace('\n', "").replace('\r', "");

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, att.mime_type)
        .header(
            header::CONTENT_DISPOSITION,
            format!("{disposition_type}; filename=\"{clean_filename}\""),
        )
        .header(header::CONTENT_LENGTH, file_size.to_string())
        .body(body)
        .unwrap_or_else(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error generating download response",
            )
                .into_response()
        })
}

pub async fn delete_attachment_handler(
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

    if claims.role == "pimpinan" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Pimpinan memiliki akses baca-saja", "code": "FORBIDDEN" })),
        );
    }

    let attachment = db::query_as::<sqlx::Postgres, TrafficAttachment>(
        "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.traffic_attachments WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    let att = match attachment {
        Ok(Some(a)) => a,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Berkas lampiran tidak ditemukan", "code": "NOT_FOUND" })),
            );
        }
        Err(e) => {
            tracing::error!("Fetch attachment error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan database", "code": "DB_ERROR" })),
            );
        }
    };

    let del_res = db::query("DELETE FROM silantas.traffic_attachments WHERE id = $1;")
        .bind(id)
        .execute(&state.pool)
        .await;

    if let Err(e) = del_res {
        tracing::error!("Delete attachment error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal menghapus lampiran dari database", "code": "DB_ERROR" })),
        );
    }

    // Delete physical file
    if let Some(file_part) = std::path::Path::new(&att.file_path).file_name() {
        let full_path = get_uploads_dir().join(file_part);
        let _ = tokio::fs::remove_file(full_path).await;
    }

    record_audit_log(
        &state.pool,
        Uuid::parse_str(&claims.sub).ok(),
        &claims.sub,
        &claims.role,
        "DELETE",
        "TRAFFIC_ATTACHMENT",
        Some(&id.to_string()),
        &format!("Menghapus lampiran: {}", att.file_name),
        Some(json!({ "trafficId": att.traffic_id, "attachmentId": id, "fileName": att.file_name })),
    )
    .await;

    (
        StatusCode::OK,
        Json(json!({ "message": "Lampiran berhasil dihapus" })),
    )
}
