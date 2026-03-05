/**
 * VANGJUT STUDIO — Cloudflare R2 Upload Worker
 * ============================================
 * ໜ້າທີ່: Proxy ການ Upload ໄຟລ໌ ໄປ R2 Bucket
 * ຮອງຮັບ: ໄຟລ໌ບໍ່ຈຳກັດຂະໜາດ (video, photo, pdf)
 *
 * Routes:
 *   PUT  /upload/:path   — Upload file to R2
 *   GET  /file/:path     — Get public file URL (redirect)
 *   DELETE /file/:path   — Delete file
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── CORS headers — allow your Railway domain ──
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Change to your Railway URL for production
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── PUT /upload/:path — Upload file ──
    if (request.method === 'PUT' && pathname.startsWith('/upload/')) {
      const key = decodeURIComponent(pathname.slice('/upload/'.length));
      if (!key) {
        return new Response('Missing file path', { status: 400, headers: corsHeaders });
      }

      try {
        const body = request.body;
        const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

        await env.R2_BUCKET.put(key, body, {
          httpMetadata: { contentType },
        });

        return new Response(JSON.stringify({
          ok: true,
          key,
          url: `${url.origin}/file/${key}`,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── GET /file/:path — Serve file from R2 ──
    if (request.method === 'GET' && pathname.startsWith('/file/')) {
      const key = decodeURIComponent(pathname.slice('/file/'.length));
      if (!key) {
        return new Response('Missing file path', { status: 400, headers: corsHeaders });
      }

      try {
        const object = await env.R2_BUCKET.get(key);
        if (!object) {
          return new Response('File not found', { status: 404, headers: corsHeaders });
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(object.body, { headers });
      } catch (e) {
        return new Response(e.message, { status: 500, headers: corsHeaders });
      }
    }

    // ── DELETE /file/:path — Delete file ──
    if (request.method === 'DELETE' && pathname.startsWith('/file/')) {
      const key = decodeURIComponent(pathname.slice('/file/'.length));
      try {
        await env.R2_BUCKET.delete(key);
        return new Response(JSON.stringify({ ok: true, deleted: key }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(e.message, { status: 500, headers: corsHeaders });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};
