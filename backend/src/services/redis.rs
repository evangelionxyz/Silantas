use reqwest::Client;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct UpstashRedisService {
    client: Client,
    rest_url: String,
    rest_token: String,
}

#[derive(Debug, Deserialize)]
struct UpstashResponse {
    result: Option<serde_json::Value>,
    error: Option<String>,
}

impl UpstashRedisService {
    pub fn new(rest_url: String, rest_token: String) -> Self {
        let clean_url = rest_url.trim().trim_end_matches('/').to_string();
        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .connect_timeout(Duration::from_secs(3))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            rest_url: clean_url,
            rest_token: rest_token.trim().to_string(),
        }
    }

    /// Execute a raw Redis command through the Upstash REST API
    pub async fn execute_raw(&self, command: &[&str]) -> anyhow::Result<serde_json::Value> {
        let response = self
            .client
            .post(&self.rest_url)
            .header("Authorization", format!("Bearer {}", self.rest_token))
            .json(&command)
            .send()
            .await?;

        let status = response.status();
        let body: UpstashResponse = response.json().await?;

        if let Some(err) = body.error {
            return Err(anyhow::anyhow!("Upstash error: {err}"));
        }

        if !status.is_success() {
            return Err(anyhow::anyhow!("Upstash HTTP error: {status}"));
        }

        Ok(body.result.unwrap_or(serde_json::Value::Null))
    }

    /// Ping the Upstash Redis database
    pub async fn ping(&self) -> anyhow::Result<String> {
        let res = self.execute_raw(&["PING"]).await?;
        if let Some(s) = res.as_str() {
            Ok(s.to_string())
        } else {
            Ok(res.to_string())
        }
    }

    /// Retrieve a string value by key
    pub async fn get(&self, key: &str) -> anyhow::Result<Option<String>> {
        let res = self.execute_raw(&["GET", key]).await?;
        if res.is_null() {
            Ok(None)
        } else if let Some(s) = res.as_str() {
            Ok(Some(s.to_string()))
        } else {
            Ok(Some(res.to_string()))
        }
    }

    /// Retrieve and deserialize a JSON value by key
    pub async fn get_json<T: DeserializeOwned>(&self, key: &str) -> anyhow::Result<Option<T>> {
        match self.get(key).await? {
            Some(raw_str) => {
                let parsed = serde_json::from_str::<T>(&raw_str)?;
                Ok(Some(parsed))
            }
            None => Ok(None),
        }
    }

    /// Set a key to hold a string value
    pub async fn set(&self, key: &str, value: &str) -> anyhow::Result<()> {
        let _ = self.execute_raw(&["SET", key, value]).await?;
        Ok(())
    }

    /// Set a key with expiration in seconds
    pub async fn set_ex(&self, key: &str, value: &str, ttl_seconds: u64) -> anyhow::Result<()> {
        let ttl_str = ttl_seconds.to_string();
        let _ = self.execute_raw(&["SET", key, value, "EX", &ttl_str]).await?;
        Ok(())
    }

    /// Set a serialized JSON key with expiration in seconds
    pub async fn set_json_ex<T: Serialize>(&self, key: &str, value: &T, ttl_seconds: u64) -> anyhow::Result<()> {
        let json_str = serde_json::to_string(value)?;
        self.set_ex(key, &json_str, ttl_seconds).await
    }

    /// Delete a key
    pub async fn del(&self, key: &str) -> anyhow::Result<()> {
        let _ = self.execute_raw(&["DEL", key]).await?;
        Ok(())
    }

    /// Increment the integer value of a key
    pub async fn incr(&self, key: &str) -> anyhow::Result<i64> {
        let res = self.execute_raw(&["INCR", key]).await?;
        if let Some(num) = res.as_i64() {
            Ok(num)
        } else if let Some(s) = res.as_str() {
            s.parse::<i64>().map_err(|e| anyhow::anyhow!("Failed to parse INCR result: {e}"))
        } else {
            Err(anyhow::anyhow!("Unexpected response from INCR: {res:?}"))
        }
    }

    /// Set a timeout on key in seconds
    pub async fn expire(&self, key: &str, ttl_seconds: u64) -> anyhow::Result<()> {
        let ttl_str = ttl_seconds.to_string();
        let _ = self.execute_raw(&["EXPIRE", key, &ttl_str]).await?;
        Ok(())
    }
}
