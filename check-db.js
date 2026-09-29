import pg from "pg";

const { Client } = pg;

async function check() {
  // Connect to the default postgres database
  const client = new Client({
    connectionString: "postgresql://postgres:12345@localhost:5432/postgres",
  });

  await client.connect();

  const result = await client.query(
    "SELECT datname FROM pg_database WHERE datname = $1",
    ["school_db_test"],
  );

  if (result.rows.length > 0) {
    console.log("✅ school_db_test exists");
  } else {
    console.log("❌ school_db_test does NOT exist");
  }

  await client.end();
}

check().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});