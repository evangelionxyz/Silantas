use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all="camelCase")]
pub struct User {
    pub id: Uuid,
    pub full_name: String,
    pub username: String,
    pub email: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub fn from_db(
        id: Uuid,
        full_name: String,
        username: String,
        email: String,
        role: String,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    ) -> Self {
        Self {
            id,
            full_name,
            username,
            email,
            role,
            created_at,
            updated_at,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct UserWithPassword {
    pub id: Uuid,
    pub full_name: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub full_name: String,
    pub username: String,
    pub email: String,
    pub password: String,
    pub role: Option<String>,
}


#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub identifier: String, // email or username (for short)
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}