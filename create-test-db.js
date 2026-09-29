import pg from "pg";

const { Client } = pg;

async function create() {
  const client = new Client({
    connectionString: "postgresql://postgres:12345@localhost:5432/postgres",
  });

  await client.connect();

  try {
    await client.query("CREATE DATABASE school_db_test");
    console.log("✅ Database school_db_test created");
  } catch (err) {
    if (err.code === "42P04") {
      // Duplicate database
      console.log("ℹ school_db_test already exists");
    } else {
      throw err;
    }
  }

  await client.end();
}

create().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});