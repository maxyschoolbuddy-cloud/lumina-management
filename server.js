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

// ✅ FIX: ໃຊ້ diskStorage ແທນ memoryStorage — ບໍ່ crash RAM ສຳລັບ video ໃຫຍ່
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB max
});

// ── POST /upload-r2 — browser uploads to Railway, Railway streams to R2 ──
app.post('/upload-r2', upload.single('file'), async (req, res) => {
  const fs = require('fs');
  let tmpPath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    tmpPath = req.file.path;
    const filePath = req.body.path || `uploads/${Date.now()}_${req.file.originalname}`;

    // ✅ FIX: stream ໂດຍກົງຈາກ disk → R2, ບໍ່ load ທັງໝົດໃສ່ RAM
    const fileStream = fs.createReadStream(tmpPath);
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: filePath,
      Body: fileStream,
      ContentLength: req.file.size,
      ContentType: req.file.mimetype || 'application/octet-stream',
    }));

    const publicUrl = WORKER_URL
      ? `${WORKER_URL}/file/${filePath}`
      : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${filePath}`;

    res.json({ ok: true, path: filePath, url: publicUrl });
  } catch (e) {
    console.error('upload-r2 error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    // ✅ ລຶບໄຟລ໌ temp ຫຼັງ upload ສຳເລັດ
    if (tmpPath) fs.unlink(tmpPath, () => {});
  }
});

// Health check + credential debug
app.get('/health', (req, res) => {
  const key = process.env.R2_ACCESS_KEY_ID||'';
  const secret = process.env.R2_SECRET_ACCESS_KEY||'';
  const account = process.env.R2_ACCOUNT_ID||'';
  res.json({
    ok: true,
    r2: !!(key && account),
    bucket: BUCKET,
    // Show partial keys for debugging (safe — not full secret)
    key_prefix: key.slice(0,8)+'...',
    key_len: key.length,
    secret_len: secret.length,
    account_prefix: account.slice(0,8)+'...',
  });
});

// Test R2 connection
app.get('/test-r2', async (req, res) => {
  try {
    const { ListBucketsCommand } = require('@aws-sdk/client-s3');
    const result = await r2.send(new ListBucketsCommand({}));
    res.json({ ok: true, buckets: result.Buckets?.map(b=>b.Name) });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message, code: e.Code });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VANGJUT STUDIO on port ${PORT}`));
