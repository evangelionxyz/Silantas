use chrono::Utc;
use silantas_api::models::traffic::{TrafficAttachment, TrafficRecord};
use uuid::Uuid;

#[test]
fn test_traffic_attachment_serialization_camel_case() {
    let id = Uuid::new_v4();
    let traffic_id = Uuid::new_v4();
    let now = Utc::now();

    let att = TrafficAttachment {
        id,
        traffic_id,
        file_name: "SKKH_Sapi_2026.pdf".to_string(),
        file_path: "uploads/traffic_attachments/test.pdf".to_string(),
        mime_type: "application/pdf".to_string(),
        file_size: 1048576,
        uploaded_by: None,
        created_at: now,
    };

    let json_val = serde_json::to_value(&att).expect("serialize TrafficAttachment");
    assert_eq!(json_val["id"], id.to_string());
    assert_eq!(json_val["trafficId"], traffic_id.to_string());
    assert_eq!(json_val["fileName"], "SKKH_Sapi_2026.pdf");
    assert_eq!(json_val["filePath"], "uploads/traffic_attachments/test.pdf");
    assert_eq!(json_val["mimeType"], "application/pdf");
    assert_eq!(json_val["fileSize"], 1048576);
}

#[test]
fn test_traffic_record_with_attachments_camel_case() {
    let rec_id = Uuid::new_v4();
    let att_id = Uuid::new_v4();
    let now = Utc::now();

    let record = TrafficRecord {
        id: rec_id,
        record_number: "TR-2026-001".to_string(),
        traffic_type: "IMPORT".to_string(),
        category: "HEWAN_HIDUP".to_string(),
        item_name: "Sapi Bali".to_string(),
        quantity: 50.0,
        unit: "ekor".to_string(),
        origin: "Surabaya".to_string(),
        destination: "Timika".to_string(),
        transport_type: "LAUT".to_string(),
        applicant_name: "CV Ternak Papua".to_string(),
        health_certificate_no: Some("SKKH/2026/01".to_string()),
        inspection_status: "INSPECTED_PASS".to_string(),
        notes: Some("Sehat dan terverifikasi".to_string()),
        recorded_by: None,
        traffic_date: chrono::NaiveDate::from_ymd_opt(2026, 11, 10).unwrap(),
        created_at: now,
        updated_at: now,
        attachments: vec![TrafficAttachment {
            id: att_id,
            traffic_id: rec_id,
            file_name: "foto_sapi.jpg".to_string(),
            file_path: "uploads/traffic_attachments/test.jpg".to_string(),
            mime_type: "image/jpeg".to_string(),
            file_size: 204800,
            uploaded_by: None,
            created_at: now,
        }],
    };

    let json_val = serde_json::to_value(&record).expect("serialize TrafficRecord");
    assert_eq!(json_val["recordNumber"], "TR-2026-001");
    let atts = json_val["attachments"].as_array().expect("attachments array");
    assert_eq!(atts.len(), 1);
    assert_eq!(atts[0]["fileName"], "foto_sapi.jpg");
    assert_eq!(atts[0]["mimeType"], "image/jpeg");
}
