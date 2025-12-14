// config/db.js
const { Pool } = require("pg");

// Create a connection pool to PostgreSQL
const pool = new Pool({
  host: "dpg-d4pcermr433s73ekg6qg-a.virginia-postgres.render.com",        // where Postgres is running
  port: 5432,               // default Postgres port
  user: "bayaka",         // your Postgres username
  password: "zQW1nVj4jok0JAbomJizGs7NGyZDHPnh", // your Postgres password
  database: "library_db_oneq",   // the DB you created in pgAdmin
   ssl: {
    rejectUnauthorized: false,         // important for Render external connection
  },
});

// Just to confirm it connects
pool.on("connect", () => {
  console.log("✅ Connected to Postgres Database");
});

// If there is an error
pool.on("error", (err) => {
  console.error("❌ Postgres connection error:", err);
});

module.exports = pool;
