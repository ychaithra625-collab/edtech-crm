
const bcrypt = require("bcrypt");
const pool = require("./db");
require("dotenv").config();

async function createAdmin() {
    try {
        const email = "admin@k12hunar.com";
        const password = process.env.ADMIN_PASSWORD;

        if (!password) {
            throw new Error("ADMIN_PASSWORD is missing from .env");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO public.admins (email, password_hash)
            VALUES ($1, $2)
            ON CONFLICT (email) DO NOTHING
            RETURNING id, email
        `;

        const result = await pool.query(query, [email, passwordHash]);

        if (result.rows.length > 0) {
            console.log("Admin account created successfully!");
            console.log("Email:", result.rows[0].email);
        } else {
            console.log("Admin account already exists.");
        }

    } catch (error) {
        console.error("Admin creation failed:", error.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
