const pool = require("./db");

console.log("Database test started.");

async function testConnection() {
    try {
        console.log("Connecting to Supabase...");

        const result = await pool.query("SELECT NOW()");

        console.log("SUCCESS: Database connected!");
        console.log("Database time:", result.rows[0].now);

    } catch (error) {
        console.error("Database connection failed:");
        console.error("Error details:", error);

    } finally {
        await pool.end();
    }
}

testConnection();