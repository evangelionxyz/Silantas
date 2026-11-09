use serde::{Deserialize, Serialize};
use silantas_api::services::MiniRedisService;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
struct TestCacheData {
    id: String,
    counter: i32,
    active: bool,
}

#[tokio::test]
async fn test_mini_redis_full_lifecycle() {
    let service = MiniRedisService::new();

    // 1. PING
    let pong = service.ping().await.expect("MiniRedis ping should succeed");
    assert_eq!(pong, "PONG");

    let test_key = "silantas:test:unit_test_key";

    // 2. SET_EX & GET
    service
        .set_ex(test_key, "silantas_value", 60)
        .await
        .expect("SET with TTL should succeed");

    let val = service
        .get(test_key)
        .await
        .expect("GET should succeed");
    assert_eq!(val, Some("silantas_value".to_string()));

    // 3. SET_JSON_EX & GET_JSON
    let json_test_key = "silantas:test:unit_json_key";
    let sample = TestCacheData {
        id: "record-123".to_string(),
        counter: 42,
        active: true,
    };

    service
        .set_json_ex(json_test_key, &sample, 60)
        .await
        .expect("SET JSON with TTL should succeed");

    let retrieved = service
        .get_json::<TestCacheData>(json_test_key)
        .await
        .expect("GET JSON should succeed");
    assert_eq!(retrieved, Some(sample));

    // 4. INCR & EXPIRE
    let counter_key = "silantas:test:unit_counter";
    let count_1 = service
        .incr(counter_key)
        .await
        .expect("INCR 1 should succeed");
    assert_eq!(count_1, 1);

    let count_2 = service
        .incr(counter_key)
        .await
        .expect("INCR 2 should succeed");
    assert_eq!(count_2, 2);

    service
        .expire(counter_key, 60)
        .await
        .expect("EXPIRE should succeed");

    // 5. CLEANUP / DEL
    service.del(test_key).await.expect("DEL test_key should succeed");
    service.del(json_test_key).await.expect("DEL json_test_key should succeed");
    service.del(counter_key).await.expect("DEL counter_key should succeed");

    let deleted_val = service.get(test_key).await.expect("GET after DEL");
    assert_eq!(deleted_val, None);
}
