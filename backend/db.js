const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ca = fs.readFileSync(
    path.join(__dirname, "supabase-ca.crt"),
    "utf8"
);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        ca: ca,
        rejectUnauthorized: true
    }
});

pool.on("error", (err) => {
    console.error("Unexpected database error:", err.message);
});

module.exports = pool;