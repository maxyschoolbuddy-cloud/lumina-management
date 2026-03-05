/**
 * VANGJUT STUDIO — Cloudflare R2 Upload Worker v2
 * ================================================
 * Fixed: ໃຊ້ formData + arrayBuffer ທີ່ stable
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    try {
      // POST /upload — multipart form (primary)
      if (request.method === 'POST' && pathname === '/upload') {
        const formData = await request.formData();
        const file = formData.get('file');
        const path = formData.get('path') || `uploads/${Date.now()}_${file.name}`;
        if (!file) return new Response(JSON.stringify({error:'No file'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const buf = await file.arrayBuffer();
        await env.R2_BUCKET.put(path, buf, { httpMetadata:{ contentType: file.type||'application/octet-stream' } });
        return new Response(JSON.stringify({ ok:true, path, url:`${url.origin}/file/${path}` }), {
          status:200, headers:{...corsHeaders,'Content-Type':'application/json'},
        });
      }
      // PUT /upload/:path — direct body (fallback)
      if (request.method === 'PUT' && pathname.startsWith('/upload/')) {
        const key = decodeURIComponent(pathname.slice('/upload/'.length));
        const contentType = request.headers.get('Content-Type')||'application/octet-stream';
        const buf = await request.arrayBuffer();
        await env.R2_BUCKET.put(key, buf, { httpMetadata:{ contentType } });
        return new Response(JSON.stringify({ ok:true, key, url:`${url.origin}/file/${key}` }), {
          status:200, headers:{...corsHeaders,'Content-Type':'application/json'},
        });
      }
      // GET /file/:path
      if (request.method === 'GET' && pathname.startsWith('/file/')) {
        const key = decodeURIComponent(pathname.slice('/file/'.length));
        const object = await env.R2_BUCKET.get(key);
        if (!object) return new Response('Not found',{status:404,headers:corsHeaders});
        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control','public, max-age=31536000');
        return new Response(object.body, { headers });
      }
      // DELETE /file/:path
      if (request.method === 'DELETE' && pathname.startsWith('/file/')) {
        const key = decodeURIComponent(pathname.slice('/file/'.length));
        await env.R2_BUCKET.delete(key);
        return new Response(JSON.stringify({ok:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      }
      return new Response(JSON.stringify({ok:true,service:'VANGJUT R2 Worker v2'}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e) {
      return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
  },
};
