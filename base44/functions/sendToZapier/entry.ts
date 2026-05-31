import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const ZAPIER_WEBHOOK_URL = Deno.env.get('ZAPIER_WEBHOOK_URL');
    if (!ZAPIER_WEBHOOK_URL) {
      return Response.json({ error: 'ZAPIER_WEBHOOK_URL not configured' }, { status: 500 });
    }

    const res = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    return Response.json({ success: res.ok, status: res.status, response: text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});