import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), config.jwtSecret);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (typeof payload !== "object" || typeof payload.sub !== "string" || !/^\d+$/.test(payload.sub)) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const [users] = await pool.execute(
    "SELECT id, email, role FROM users WHERE id = ?",
    [payload.sub],
  );
  if (users.length === 0) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = users[0];
  next();
});

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
