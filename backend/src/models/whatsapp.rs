use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct WhatsappRecap {
    pub id: Uuid,
    pub ticket_id: Option<String>,
    pub reporter_name: String,
    pub reporter_phone: Option<String>,
    pub address: String,
    pub service_type: String,
    pub description: String,
    pub status: String,
    pub recorded_by: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(skip)]
    #[serde(default)]
    pub attachments: Vec<WhatsappAttachment>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct WhatsappAttachment {
    pub id: Uuid,
    pub recap_id: Option<Uuid>,
    pub file_name: String,
    pub file_path: String,
    pub mime_type: String,
    pub file_size: i64,
    pub uploaded_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWhatsappRecapRequest {
    pub id: Option<Uuid>,
    pub ticket_id: Option<String>,
    pub reporter_name: String,
    pub reporter_phone: Option<String>,
    pub address: String,
    pub service_type: String,
    pub description: String,
    pub status: Option<String>,
    pub recorded_by: Option<String>,
    pub notes: Option<String>,
    pub attachment_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWhatsappRecapRequest {
    pub ticket_id: Option<String>,
    pub reporter_name: Option<String>,
    pub reporter_phone: Option<String>,
    pub address: Option<String>,
    pub service_type: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct WhatsappFilterParams {
    pub search: Option<String>,
    pub service_type: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AttachmentQuery {
    pub download: Option<bool>,
    pub token: Option<String>,
}
