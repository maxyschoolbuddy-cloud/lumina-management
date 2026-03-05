const express = require('express');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── R2 Client (S3-compatible) ──
// ຕ້ອງຕັ້ງ Environment Variables ໃນ Railway:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
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

// ── GET /sign-upload?path=reviewId/filename.mp4 ──
// Returns a presigned URL the browser can PUT directly to R2
app.get('/sign-upload', async (req, res) => {
  try {
    const filePath = req.query.path;
    const contentType = req.query.type || 'application/octet-stream';
    if (!filePath) return res.status(400).json({ error: 'Missing path' });

    // Check R2 credentials configured
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_ACCOUNT_ID) {
      return res.status(503).json({ error: 'R2 not configured on server' });
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: filePath,
      ContentType: contentType,
    });

    // Presigned URL valid for 1 hour
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    // Public URL via Cloudflare Worker
    const publicUrl = WORKER_URL
      ? `${WORKER_URL}/file/${filePath}`
      : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${filePath}`;

    res.json({ ok: true, uploadUrl: signedUrl, publicUrl });
  } catch (e) {
    console.error('sign-upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    r2_configured: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCOUNT_ID),
    bucket: BUCKET,
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VANGJUT STUDIO running on port ${PORT}`);
});
