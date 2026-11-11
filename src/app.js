import express from "express";
import authRouter from "./routes/auth.js";

export const app = express();

app.use(express.json({ limit: "10kb" }));
app.use("/api/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  console.error(error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  return res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
  });
});
