import "dotenv/config";
import pg from "pg";
const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const r = await c.query(`
  SELECT p.key AS permission
  FROM role_permissions rp
  JOIN roles r ON r.id = rp."roleId"
  JOIN permissions p ON p.id = rp."permissionId"
  WHERE r.key = 'TEACHER' AND p.key LIKE 'fee_structures%'
`);

console.log("Teacher's fee_structures permissions:");
console.table(r.rows);

await c.end();