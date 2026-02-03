const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Configuration
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.NAS_API_KEY || "change-me-to-a-secure-key";
const STORAGE_PATH = process.env.STORAGE_PATH || "./uploads";
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "524288000"); // 500MB default
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,https://nxrthstack.vercel.app").split(",");
const TOKEN_SECRET = process.env.NAS_API_KEY || "change-me"; // Reuse API key for signing tokens

// Simple token signing/verification
function createUploadToken(data, expiresInSeconds = 3600) {
  const payload = {
    ...data,
    exp: Date.now() + expiresInSeconds * 1000,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadStr)
    .digest("base64url");
  return `${payloadStr}.${signature}`;
}

function verifyUploadToken(token) {
  try {
    const [payloadStr, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payloadStr)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

const app = express();

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  exposedHeaders: ["Content-Length", "Content-Type"],
}));

// API Key authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized - Invalid API key" });
  }
  next();
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Optional subfolder from request (e.g., "clips", "thumbnails")
    const subfolder = req.query.folder || "";
    const destPath = path.join(STORAGE_PATH, subfolder);

    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Allowed video and image types
    const allowedMimes = [
      // Videos
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      // Images (for thumbnails/screenshots)
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    storage: STORAGE_PATH,
  });
});

// Generate upload token (called by Next.js API)
app.post("/token", authenticate, express.json(), (req, res) => {
  const { folder, maxSize, allowedTypes, expiresIn } = req.body;

  const token = createUploadToken({
    folder: folder || "",
    maxSize: maxSize || MAX_FILE_SIZE,
    allowedTypes: allowedTypes || null,
  }, expiresIn || 3600);

  res.json({
    token,
    uploadUrl: `${PUBLIC_URL}/upload/direct`,
    expiresIn: expiresIn || 3600,
  });
});

// Direct upload with token (for large files, bypasses Vercel)
app.post("/upload/direct", upload.single("file"), (req, res) => {
  const token = req.headers["x-upload-token"] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Upload token required" });
  }

  const payload = verifyUploadToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired upload token" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  // Validate file size against token limit
  if (req.file.size > payload.maxSize) {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(413).json({
      error: `File too large. Maximum size is ${payload.maxSize / (1024 * 1024)}MB`,
    });
  }

  // Validate file type if specified in token
  if (payload.allowedTypes && !payload.allowedTypes.includes(req.file.mimetype)) {
    fs.unlinkSync(req.file.path);
    return res.status(415).json({ error: "File type not allowed" });
  }

  const subfolder = payload.folder || "";
  const relativePath = subfolder ? `${subfolder}/${req.file.filename}` : req.file.filename;
  const fileUrl = `${PUBLIC_URL}/files/${relativePath}`;

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// Upload endpoint (with API key auth)
app.post("/upload", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const subfolder = req.query.folder || "";
  const relativePath = subfolder ? `${subfolder}/${req.file.filename}` : req.file.filename;
  const fileUrl = `${PUBLIC_URL}/files/${relativePath}`;

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// Multi-file upload endpoint
app.post("/upload/multiple", authenticate, upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files provided" });
  }

  const subfolder = req.query.folder || "";
  const files = req.files.map((file) => {
    const relativePath = subfolder ? `${subfolder}/${file.filename}` : file.filename;
    return {
      url: `${PUBLIC_URL}/files/${relativePath}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  });

  res.json({
    success: true,
    files,
  });
});

// Serve files
app.use("/files", express.static(STORAGE_PATH, {
  maxAge: "7d", // Cache for 7 days
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    if (mimeTypes[ext]) {
      res.setHeader("Content-Type", mimeTypes[ext]);
    }
    // Allow range requests for video streaming
    res.setHeader("Accept-Ranges", "bytes");
  },
}));

// Delete file endpoint
app.delete("/files/:filename", authenticate, (req, res) => {
  const filename = req.params.filename;
  const subfolder = req.query.folder || "";
  const filePath = path.join(STORAGE_PATH, subfolder, filename);

  // Security check - prevent directory traversal
  const resolvedPath = path.resolve(filePath);
  const resolvedStorage = path.resolve(STORAGE_PATH);
  if (!resolvedPath.startsWith(resolvedStorage)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// List files endpoint (for debugging/admin)
app.get("/files", authenticate, (req, res) => {
  const subfolder = req.query.folder || "";
  const dirPath = path.join(STORAGE_PATH, subfolder);

  if (!fs.existsSync(dirPath)) {
    return res.json({ files: [] });
  }

  try {
    const files = fs.readdirSync(dirPath)
      .filter((f) => !fs.statSync(path.join(dirPath, f)).isDirectory())
      .map((filename) => {
        const filePath = path.join(dirPath, filename);
        const stats = fs.statSync(filePath);
        const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
        return {
          filename,
          url: `${PUBLIC_URL}/files/${relativePath}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      });
    res.json({ files });
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Storage stats endpoint
app.get("/stats", authenticate, (req, res) => {
  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    let fileCount = 0;

    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          walk(filePath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    };

    walk(dirPath);
    return { totalSize, fileCount };
  };

  const { totalSize, fileCount } = getDirectorySize(STORAGE_PATH);

  res.json({
    totalFiles: fileCount,
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
    storagePath: STORAGE_PATH,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error.message?.includes("not allowed")) {
    return res.status(415).json({ error: error.message });
  }

  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              NAS Storage Server Started                     ║
╠════════════════════════════════════════════════════════════╣
║  Port:          ${PORT.toString().padEnd(40)}║
║  Storage:       ${STORAGE_PATH.padEnd(40)}║
║  Public URL:    ${PUBLIC_URL.substring(0, 40).padEnd(40)}║
║  Max File Size: ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0).padEnd(37)}MB ║
╚════════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health              - Health check
  POST /upload              - Upload single file
  POST /upload/multiple     - Upload multiple files
  GET  /files/:filename     - Download/stream file
  GET  /files               - List files (auth required)
  DELETE /files/:filename   - Delete file (auth required)
  GET  /stats               - Storage statistics (auth required)
  `);
});
