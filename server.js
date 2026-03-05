const express = require('express');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// R2 Client
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'vangjut-drafts';
const WORKER_URL = process.env.R2_WORKER_URL || '';

// multer: store in memory (streams to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB max
});

// ── POST /upload-r2 — browser uploads to Railway, Railway streams to R2 ──
app.post('/upload-r2', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const filePath = req.body.path || `uploads/${Date.now()}_${req.file.originalname}`;

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'application/octet-stream',
    }));

    const publicUrl = WORKER_URL
      ? `${WORKER_URL}/file/${filePath}`
      : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${filePath}`;

    res.json({ ok: true, path: filePath, url: publicUrl });
  } catch (e) {
    console.error('upload-r2 error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    r2: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCOUNT_ID),
    bucket: BUCKET,
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VANGJUT STUDIO on port ${PORT}`));
