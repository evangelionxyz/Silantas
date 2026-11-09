use serde::{de::DeserializeOwned, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::Instant;

#[derive(Debug, Clone)]
struct CacheEntry {
    value: String,
    expires_at: Option<Instant>,
}

impl CacheEntry {
    fn is_expired(&self) -> bool {
        self.expires_at.is_some_and(|exp| Instant::now() >= exp)
    }
}

/// In-node concurrent key-value cache with TTL expiration (mini-redis)
#[derive(Debug, Clone)]
pub struct MiniRedisService {
    store: Arc<RwLock<HashMap<String, CacheEntry>>>,
}

pub type UpstashRedisService = MiniRedisService;

impl Default for MiniRedisService {
    fn default() -> Self {
        Self::new()
    }
}

impl MiniRedisService {
    pub fn new() -> Self {
        let store: Arc<RwLock<HashMap<String, CacheEntry>>> = Arc::new(RwLock::new(HashMap::new()));
        let cleanup_store = Arc::clone(&store);

        if let Ok(handle) = tokio::runtime::Handle::try_current() {
            handle.spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_secs(60));
                loop {
                    interval.tick().await;
                    let mut map = cleanup_store.write().await;
                    map.retain(|_, entry| !entry.is_expired());
                }
            });
        }

        Self { store }
    }

    /// Ping the in-node mini-redis store
    pub async fn ping(&self) -> anyhow::Result<String> {
        Ok("PONG".to_string())
    }

    /// Retrieve a string value by key
    pub async fn get(&self, key: &str) -> anyhow::Result<Option<String>> {
        {
            let map = self.store.read().await;
            if let Some(entry) = map.get(key) {
                if !entry.is_expired() {
                    return Ok(Some(entry.value.clone()));
                }
            } else {
                return Ok(None);
            }
        }

        // Lazy eviction if expired
        let mut map = self.store.write().await;
        if let Some(entry) = map.get(key) {
            if entry.is_expired() {
                map.remove(key);
                return Ok(None);
            }
            return Ok(Some(entry.value.clone()));
        }
        Ok(None)
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

    /// Set a key to hold a string value without expiration
    pub async fn set(&self, key: &str, value: &str) -> anyhow::Result<()> {
        let mut map = self.store.write().await;
        map.insert(
            key.to_string(),
            CacheEntry {
                value: value.to_string(),
                expires_at: None,
            },
        );
        Ok(())
    }

    /// Set a key with expiration in seconds
    pub async fn set_ex(&self, key: &str, value: &str, ttl_seconds: u64) -> anyhow::Result<()> {
        let mut map = self.store.write().await;
        map.insert(
            key.to_string(),
            CacheEntry {
                value: value.to_string(),
                expires_at: Some(Instant::now() + Duration::from_secs(ttl_seconds)),
            },
        );
        Ok(())
    }

    /// Set a serialized JSON key with expiration in seconds
    pub async fn set_json_ex<T: Serialize>(&self, key: &str, value: &T, ttl_seconds: u64) -> anyhow::Result<()> {
        let json_str = serde_json::to_string(value)?;
        self.set_ex(key, &json_str, ttl_seconds).await
    }

    /// Delete a key
    pub async fn del(&self, key: &str) -> anyhow::Result<()> {
        let mut map = self.store.write().await;
        map.remove(key);
        Ok(())
    }

    /// Increment the integer value of a key
    pub async fn incr(&self, key: &str) -> anyhow::Result<i64> {
        let mut map = self.store.write().await;
        let (next_val, expires_at) = match map.get(key) {
            Some(entry) if !entry.is_expired() => {
                let current = entry
                    .value
                    .parse::<i64>()
                    .map_err(|e| anyhow::anyhow!("Value is not an integer: {e}"))?;
                (current + 1, entry.expires_at)
            }
            _ => (1, None),
        };

        map.insert(
            key.to_string(),
            CacheEntry {
                value: next_val.to_string(),
                expires_at,
            },
        );

        Ok(next_val)
    }

    /// Set a timeout on key in seconds
    pub async fn expire(&self, key: &str, ttl_seconds: u64) -> anyhow::Result<()> {
        let mut map = self.store.write().await;
        if let Some(entry) = map.get_mut(key) {
            if entry.is_expired() {
                map.remove(key);
            } else {
                entry.expires_at = Some(Instant::now() + Duration::from_secs(ttl_seconds));
            }
        }
        Ok(())
    }
}
