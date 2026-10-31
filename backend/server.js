
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./db");

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());


// Check backend status
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "K12 Hunar CRM Backend is running!"
    });
});


// Public Inquiry Submission API
app.post("/api/inquiries", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            user_type,
            category,
            message
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !user_type || !category || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Validate user type
        const allowedUserTypes = ["Parent", "Student", "School"];

        if (!allowedUserTypes.includes(user_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user type."
            });
        }

        // Validate category
        const allowedCategories = [
            "Scholarship",
            "Concert",
            "Admission",
            "General Query"
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid inquiry category."
            });
        }

        // Insert inquiry into Supabase
        const query = `
            INSERT INTO public.inquiries
                (name, email, phone, user_type, category, message)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, email, phone, user_type,
                      category, message, status, created_at
        `;

        const values = [
            name.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            user_type,
            category,
            message.trim()
        ];

        const result = await pool.query(query, values);

        return res.status(201).json({
            success: true,
            message: "Inquiry submitted successfully!",
            inquiry: result.rows[0]
        });

    } catch (error) {
        console.error("Inquiry submission error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to submit inquiry. Please try again."
        });
    }
});


// Admin Login API
app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find admin by email
        const query = `
            SELECT id, email, password_hash
            FROM public.admins
            WHERE email = $1
        `;

        const result = await pool.query(query, [
            email.trim().toLowerCase()
        ]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const admin = result.rows[0];

        // Compare password with bcrypt hash
        const isPasswordValid = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from .env");
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                adminId: admin.id,
                email: admin.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful!",
            token,
            admin: {
                id: admin.id,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Admin login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log in. Please try again."
        });
    }
});


// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Token is required."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            success: false,
            message: "JWT configuration is missing."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, admin) => {
        if (error) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired token."
            });
        }

        req.admin = admin;
        next();
    });
}


// Protected Admin Inquiries API
app.get("/api/admin/inquiries", authenticateToken, async (req, res) => {
    try {
        const { search, category, user_type } = req.query;

        let query = `
            SELECT
                id,
                name,
                phone,
                email,
                user_type,
                category,
                message,
                status,
                created_at
            FROM public.inquiries
            WHERE 1=1
        `;

        const values = [];

        // Search by name or phone
        if (search && search.trim()) {
            values.push(`%${search.trim()}%`);

            query += `
                AND (
                    name ILIKE $${values.length}
                    OR phone ILIKE $${values.length}
                )
            `;
        }

        // Filter by category
        if (category && category !== "All") {
            values.push(category);
            query += ` AND category = $${values.length}`;
        }

        // Filter by user type
        if (user_type && user_type !== "All") {
            values.push(user_type);
            query += ` AND user_type = $${values.length}`;
        }

        query += `
            ORDER BY created_at DESC
            LIMIT 100
        `;

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            inquiries: result.rows
        });

    } catch (error) {
        console.error("Fetch inquiries error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch inquiries."
        });
    }
});


// Start Server
const PORT = process.env.PORT || 5000;

// Update Inquiry Status (Protected Admin Route)
app.put("/api/admin/inquiries/:id/status", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "New",
            "In Progress",
            "Resolved"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid inquiry status."
            });
        }

        const query = `
            UPDATE public.inquiries
            SET status = $1
            WHERE id = $2
            RETURNING id, name, status
        `;

        const result = await pool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Inquiry status updated successfully!",
            inquiry: result.rows[0]
        });

    } catch (error) {
        console.error("Update status error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update inquiry status."
        });
    }
});


app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});