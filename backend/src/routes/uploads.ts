import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config";

export const uploadsRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({ storage });

uploadsRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Missing file" });

  const publicUrl = `/uploads/${req.file.filename}`;

  res.status(201).json({
    filename: req.file.filename,
    url: publicUrl,
  });
});
