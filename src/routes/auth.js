import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxPasswordBytes = 72;

function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 && emailPattern.test(email);
}

function isValidPassword(password) {
  return typeof password === "string"
    && password.length >= 8
    && Buffer.byteLength(password, "utf8") <= maxPasswordBytes;
}

function createToken(user) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });
}

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return res.status(400).json({
      error: "Provide a valid email and a password of 8-72 UTF-8 bytes",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [normalizedEmail, passwordHash],
    );
    const user = { id: result.insertId, email: normalizedEmail, role: "user" };
    return res.status(201).json({
      user,
      token: createToken(user),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    throw error;
  }
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isValidEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Provide a valid email and password" });
  }

  const [users] = await pool.execute(
    "SELECT id, email, password_hash, role FROM users WHERE email = ?",
    [email.trim().toLowerCase()],
  );
  const user = users[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token: createToken(user),
  });
}));

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

export default router;
