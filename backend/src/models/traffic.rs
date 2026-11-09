use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TrafficRecord {
    pub id: Uuid,
    pub record_number: String,
    pub traffic_type: String,
    pub category: String,
    pub item_name: String,
    pub quantity: f64,
    pub unit: String,
    pub origin: String,
    pub destination: String,
    pub transport_type: String,
    pub applicant_name: String,
    pub health_certificate_no: Option<String>,
    pub inspection_status: String,
    pub notes: Option<String>,
    pub recorded_by: Option<Uuid>,
    pub traffic_date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTrafficRequest {
    pub record_number: String,
    pub traffic_type: String,
    pub category: String,
    pub item_name: String,
    pub quantity: f64,
    pub unit: String,
    pub origin: String,
    pub destination: String,
    pub transport_type: String,
    pub applicant_name: String,
    pub health_certificate_no: Option<String>,
    pub inspection_status: Option<String>,
    pub notes: Option<String>,
    pub traffic_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTrafficRequest {
    pub record_number: Option<String>,
    pub traffic_type: Option<String>,
    pub category: Option<String>,
    pub item_name: Option<String>,
    pub quantity: Option<f64>,
    pub unit: Option<String>,
    pub origin: Option<String>,
    pub destination: Option<String>,
    pub transport_type: Option<String>,
    pub applicant_name: Option<String>,
    pub health_certificate_no: Option<String>,
    pub inspection_status: Option<String>,
    pub notes: Option<String>,
    pub traffic_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInspectionRequest {
    pub inspection_status: String,
    pub health_certificate_no: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TrafficSummaryItem {
    pub item_name: String,
    pub category: String,
    pub unit: String,
    pub total_import: f64,
    pub total_export: f64,
    pub total_volume: f64,
    pub current_storage: f64,
    pub record_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TrafficRouteSummaryItem {
    pub traffic_type: String,
    pub origin: String,
    pub destination: String,
    pub item_name: String,
    pub category: String,
    pub unit: String,
    pub transport_type: String,
    pub total_quantity: f64,
    pub record_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct TrafficFilterParams {
    pub search: Option<String>,
    pub category: Option<String>,
    pub traffic_type: Option<String>,
    pub inspection_status: Option<String>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}
