use sqlx::postgres::PgPoolOptions;

#[tokio::test]
#[ignore = "requires a PostgreSQL database configured by DATABASE_URL"]
async fn numeric_quantity_can_be_decoded_as_api_f64_after_explicit_cast() {
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must point to PostgreSQL for this test");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await
        .expect("connect to PostgreSQL");

    let quantity: f64 = sqlx::query_scalar(
        "SELECT CAST(CAST('123.45' AS NUMERIC(12, 2)) AS DOUBLE PRECISION)",
    )
    .fetch_one(&pool)
    .await
    .expect("decode PostgreSQL NUMERIC as f64 after explicit cast");

    assert_eq!(quantity, 123.45);
}
