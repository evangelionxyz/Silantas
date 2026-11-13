use std::path::PathBuf;

use axum::{
    body::Body,
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

use crate::{
    appstate::AppState,
    db,
    models::whatsapp::{
        AttachmentQuery, CreateWhatsappRecapRequest, UpdateWhatsappRecapRequest,
        WhatsappAttachment, WhatsappFilterParams, WhatsappRecap,
    },
    services::{
        audit::record_audit_log,
        auth::{extract_claims_from_headers, verify_jwt},
    },
};

const UPLOADS_DIR: &str = "./uploads/whatsapp_attachments";

pub fn get_uploads_dir() -> PathBuf {
    let dir = std::env::var("WHATSAPP_ATTACHMENT_DIR").unwrap_or_else(|_| UPLOADS_DIR.to_string());
    let path = PathBuf::from(dir);
    if !path.exists() {
        let _ = std::fs::create_dir_all(&path);
    }
    path
}

pub fn whatsapp_routes() -> Router<AppState> {
    Router::new()
        .route("/recaps", get(list_recaps_handler).post(create_recap_handler))
        .route(
            "/recaps/{id}",
            get(get_recap_handler)
                .put(update_recap_handler)
                .delete(delete_recap_handler),
        )
        .route(
            "/attachments",
            post(upload_attachments_handler).layer(DefaultBodyLimit::max(50 * 1024 * 1024)),
        )
        .route(
            "/attachments/{id}",
            get(get_attachment_file_handler).delete(delete_attachment_handler),
        )
}

pub async fn list_recaps_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<WhatsappFilterParams>,
) -> impl IntoResponse {
    let _claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            )
                .into_response();
        }
    };

    let mut query_str = String::from(
        "SELECT id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at
         FROM silantas.whatsapp_recaps WHERE 1=1"
    );

    let mut conditions = Vec::new();
    let mut param_idx = 1;

    let search = params.search.unwrap_or_default().trim().to_string();
    if !search.is_empty() {
        conditions.push(format!(
            "(reporter_name ILIKE ${param_idx} OR address ILIKE ${param_idx} OR reporter_phone ILIKE ${param_idx} OR description ILIKE ${param_idx})"
        ));
        param_idx += 1;
    }

    let service_type = params.service_type.unwrap_or_default().trim().to_string();
    if !service_type.is_empty() && service_type != "ALL" {
        conditions.push(format!("service_type = ${param_idx}"));
        param_idx += 1;
    }

    let status = params.status.unwrap_or_default().trim().to_string();
    if !status.is_empty() && status != "ALL" {
        conditions.push(format!("status = ${param_idx}"));
    }

    for cond in conditions {
        query_str.push_str(" AND ");
        query_str.push_str(&cond);
    }

    query_str.push_str(" ORDER BY created_at DESC;");

    let mut query = db::query_as::<sqlx::Postgres, WhatsappRecap>(&query_str);

    if !search.is_empty() {
        query = query.bind(format!("%{search}%"));
    }
    if !service_type.is_empty() && service_type != "ALL" {
        query = query.bind(service_type);
    }
    if !status.is_empty() && status != "ALL" {
        query = query.bind(status);
    }

    let recaps = match query.fetch_all(&state.pool).await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!("Fetch whatsapp recaps error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal mengambil data rekapan", "code": "DB_ERROR" })),
            )
                .into_response();
        }
    };

    if recaps.is_empty() {
        return (StatusCode::OK, Json(json!({ "data": [] }))).into_response();
    }

    let ids: Vec<Uuid> = recaps.iter().map(|r| r.id).collect();
    let attachments = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.whatsapp_attachments WHERE recap_id = ANY($1) ORDER BY created_at ASC;"
    )
    .bind(&ids)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut populated = recaps;
    for recap in &mut populated {
        recap.attachments = attachments
            .iter()
            .filter(|a| a.recap_id == Some(recap.id))
            .cloned()
            .collect();
    }

    (StatusCode::OK, Json(json!({ "data": populated }))).into_response()
}

pub async fn get_recap_handler(
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

    let recap = db::query_as::<sqlx::Postgres, WhatsappRecap>(
        "SELECT id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at
         FROM silantas.whatsapp_recaps WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    match recap {
        Ok(Some(mut r)) => {
            let attachments = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
                "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
                 FROM silantas.whatsapp_attachments WHERE recap_id = $1 ORDER BY created_at ASC;"
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
            Json(json!({ "message": "Data rekapan tidak ditemukan", "code": "NOT_FOUND" })),
        ),
        Err(e) => {
            tracing::error!("Fetch recap error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan database", "code": "DB_ERROR" })),
            )
        }
    }
}

pub async fn create_recap_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateWhatsappRecapRequest>,
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

    let user_id = Uuid::parse_str(&claims.sub).ok();
    let recap_id = payload.id.unwrap_or_else(Uuid::new_v4);
    let now = chrono::Utc::now();
    let status = payload.status.unwrap_or_else(|| "BARU".to_string());
    let recorded_by = payload.recorded_by.or_else(|| Some(claims.sub.clone()));

    let insert_res = db::query(
        "INSERT INTO silantas.whatsapp_recaps
         (id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);"
    )
    .bind(recap_id)
    .bind(&payload.reporter_name)
    .bind(&payload.reporter_phone)
    .bind(&payload.address)
    .bind(&payload.service_type)
    .bind(&payload.description)
    .bind(&status)
    .bind(&recorded_by)
    .bind(&payload.notes)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await;

    if let Err(e) = insert_res {
        tracing::error!("Create whatsapp recap error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal menyimpan rekapan WhatsApp", "code": "DB_ERROR" })),
        );
    }

    if let Some(att_ids) = payload.attachment_ids {
        if !att_ids.is_empty() {
            let _ = db::query(
                "UPDATE silantas.whatsapp_attachments SET recap_id = $1 WHERE id = ANY($2);"
            )
            .bind(recap_id)
            .bind(&att_ids)
            .execute(&state.pool)
            .await;
        }
    }

    record_audit_log(
        &state.pool,
        user_id,
        &claims.sub,
        &claims.role,
        "CREATE",
        "WHATSAPP_RECAP",
        Some(&recap_id.to_string()),
        &format!("Mencatat aduan WhatsApp dari: {}", payload.reporter_name),
        Some(json!({
            "serviceType": payload.service_type,
            "reporter": payload.reporter_name
        })),
    )
    .await;

    let attachments = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.whatsapp_attachments WHERE recap_id = $1 ORDER BY created_at ASC;"
    )
    .bind(recap_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let created = WhatsappRecap {
        id: recap_id,
        reporter_name: payload.reporter_name,
        reporter_phone: payload.reporter_phone,
        address: payload.address,
        service_type: payload.service_type,
        description: payload.description,
        status,
        recorded_by,
        notes: payload.notes,
        created_at: now,
        updated_at: now,
        attachments,
    };

    (StatusCode::CREATED, Json(json!(created)))
}

pub async fn update_recap_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateWhatsappRecapRequest>,
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

    let user_id = Uuid::parse_str(&claims.sub).ok();
    let current = db::query_as::<sqlx::Postgres, WhatsappRecap>(
        "SELECT id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at
         FROM silantas.whatsapp_recaps WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    let curr = match current {
        Ok(Some(c)) => c,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Data rekapan tidak ditemukan", "code": "NOT_FOUND" })),
            );
        }
        Err(e) => {
            tracing::error!("Fetch recap error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Kesalahan database", "code": "DB_ERROR" })),
            );
        }
    };

    let reporter_name = payload.reporter_name.unwrap_or(curr.reporter_name);
    let reporter_phone = payload.reporter_phone.or(curr.reporter_phone);
    let address = payload.address.unwrap_or(curr.address);
    let service_type = payload.service_type.unwrap_or(curr.service_type);
    let description = payload.description.unwrap_or(curr.description);
    let status = payload.status.unwrap_or(curr.status);
    let notes = payload.notes.or(curr.notes);
    let now = chrono::Utc::now();

    let update_res = db::query(
        "UPDATE silantas.whatsapp_recaps
         SET reporter_name = $1, reporter_phone = $2, address = $3, service_type = $4, description = $5,
             status = $6, notes = $7, updated_at = $8
         WHERE id = $9;"
    )
    .bind(&reporter_name)
    .bind(&reporter_phone)
    .bind(&address)
    .bind(&service_type)
    .bind(&description)
    .bind(&status)
    .bind(&notes)
    .bind(now)
    .bind(id)
    .execute(&state.pool)
    .await;

    if let Err(e) = update_res {
        tracing::error!("Update whatsapp recap error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal memperbarui rekapan", "code": "DB_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        user_id,
        &claims.sub,
        &claims.role,
        "UPDATE",
        "WHATSAPP_RECAP",
        Some(&id.to_string()),
        &format!("Memperbarui status rekapan WhatsApp #{id} menjadi: {status}"),
        Some(json!({ "status": status })),
    )
    .await;

    let attachments = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.whatsapp_attachments WHERE recap_id = $1 ORDER BY created_at ASC;"
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let updated = WhatsappRecap {
        id,
        reporter_name,
        reporter_phone,
        address,
        service_type,
        description,
        status,
        recorded_by: curr.recorded_by,
        notes,
        created_at: curr.created_at,
        updated_at: now,
        attachments,
    };

    (StatusCode::OK, Json(json!(updated)))
}

pub async fn delete_recap_handler(
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

    let user_id = Uuid::parse_str(&claims.sub).ok();

    // Find attachments to clean up physical files
    let attachments = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.whatsapp_attachments WHERE recap_id = $1;"
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let uploads_dir = get_uploads_dir();
    for att in attachments {
        let file_part = std::path::Path::new(&att.file_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default();
        let full_path = uploads_dir.join(file_part);
        let _ = tokio::fs::remove_file(&full_path).await;
    }

    let del_res = db::query("DELETE FROM silantas.whatsapp_recaps WHERE id = $1;")
        .bind(id)
        .execute(&state.pool)
        .await;

    if let Err(e) = del_res {
        tracing::error!("Delete whatsapp recap error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal menghapus rekapan", "code": "DB_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        user_id,
        &claims.sub,
        &claims.role,
        "DELETE",
        "WHATSAPP_RECAP",
        Some(&id.to_string()),
        &format!("Menghapus data rekapan WhatsApp #{id}"),
        None,
    )
    .await;

    (
        StatusCode::OK,
        Json(json!({ "message": "Rekapan WhatsApp berhasil dihapus" })),
    )
}

// -------------------------------------------------------------
// WhatsApp File Attachment Handlers (Upload, Stream, Delete)
// -------------------------------------------------------------

pub async fn upload_attachments_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Response {
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

    let user_id = Uuid::parse_str(&claims.sub).ok();
    let uploads_dir = get_uploads_dir();
    let mut saved_attachments = Vec::new();

    const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB

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
        if field_name != "files" && field_name != "file" && field_name != "screenshot" && field_name != "attachments" {
            continue;
        }

        let raw_filename = field.file_name().unwrap_or("screenshot").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();

        let ext = match content_type.as_str() {
            "image/jpeg" | "image/jpg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            "application/pdf" => "pdf",
            _ => {
                let lower = raw_filename.to_lowercase();
                if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
                    "jpg"
                } else if lower.ends_with(".png") {
                    "png"
                } else if lower.ends_with(".webp") {
                    "webp"
                } else if lower.ends_with(".pdf") {
                    "pdf"
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(json!({
                            "message": format!("Tipe berkas tidak didukung: {raw_filename}. Harap unggah Gambar (JPG, PNG, WEBP) atau PDF."),
                            "code": "INVALID_FILE_TYPE"
                        })),
                    )
                        .into_response();
                }
            }
        };

        let mime = match ext {
            "jpg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            "pdf" => "application/pdf",
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
        let relative_path = format!("uploads/whatsapp_attachments/{}", stored_filename);

        let insert_res = db::query(
            "INSERT INTO silantas.whatsapp_attachments (id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8);"
        )
        .bind(attachment_id)
        .bind(None::<Uuid>)
        .bind(&raw_filename)
        .bind(&relative_path)
        .bind(mime)
        .bind(file_size)
        .bind(user_id)
        .bind(now)
        .execute(&state.pool)
        .await;

        if let Err(e) = insert_res {
            tracing::error!("Failed to save whatsapp attachment metadata: {e}");
            let _ = tokio::fs::remove_file(&dest_path).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal menyimpan metadata lampiran ke database", "code": "DB_ERROR" })),
            )
                .into_response();
        }

        saved_attachments.push(WhatsappAttachment {
            id: attachment_id,
            recap_id: None,
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
            "WHATSAPP_ATTACHMENT",
            None,
            &format!("Mengunggah {} lampiran screenshot WhatsApp", saved_attachments.len()),
            Some(json!({ "count": saved_attachments.len() })),
        )
        .await;
    }

    (StatusCode::CREATED, Json(json!(saved_attachments))).into_response()
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

    let attachment = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.whatsapp_attachments WHERE id = $1;"
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
            tracing::error!("Fetch whatsapp attachment error: {e}");
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
            tracing::error!("WhatsApp attachment file not found on disk {}: {e}", full_path.display());
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
                "Gagal membangun respons berkas",
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

    let user_id = Uuid::parse_str(&claims.sub).ok();

    let attachment = db::query_as::<sqlx::Postgres, WhatsappAttachment>(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
         FROM silantas.whatsapp_attachments WHERE id = $1;"
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
                Json(json!({ "message": "Kesalahan database", "code": "DB_ERROR" })),
            );
        }
    };

    let file_part = std::path::Path::new(&att.file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default();
    let full_path = get_uploads_dir().join(file_part);

    let _ = tokio::fs::remove_file(&full_path).await;

    let del_res = db::query("DELETE FROM silantas.whatsapp_attachments WHERE id = $1;")
        .bind(id)
        .execute(&state.pool)
        .await;

    if let Err(e) = del_res {
        tracing::error!("Delete whatsapp attachment error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal menghapus berkas lampiran", "code": "DB_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        user_id,
        &claims.sub,
        &claims.role,
        "DELETE",
        "WHATSAPP_ATTACHMENT",
        Some(&id.to_string()),
        &format!("Menghapus berkas lampiran screenshot WhatsApp: {}", att.file_name),
        None,
    )
    .await;

    (
        StatusCode::OK,
        Json(json!({ "message": "Berkas lampiran berhasil dihapus" })),
    )
}
