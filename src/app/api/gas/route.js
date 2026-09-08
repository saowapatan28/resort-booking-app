// Server-side proxy to the Google Apps Script backend.
//
// The browser never talks to `script.google.com` directly — it always calls
// this route. That keeps the GAS URL out of client bundles, sidesteps CORS
// entirely (GAS -> Next.js is a plain server-to-server fetch), and gives us
// one place to attach the shared secret / session token if we add one later.
//
// Contract: POST { action: string, payload?: object, token?: string }
// GAS side (doPost) should read e.postData.contents as JSON with the same
// shape and return JSON: { ok: true, data } or { ok: false, error }.

const GAS_API_URL = process.env.GAS_API_URL;

export async function POST(request) {
  if (!GAS_API_URL) {
    return Response.json(
      { ok: false, error: "GAS_API_URL is not configured on the server." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.action) {
    return Response.json({ ok: false, error: "Missing `action`." }, { status: 400 });
  }

  try {
    const upstream = await fetch(GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // GAS web apps issue a 302 redirect before serving the real response.
      redirect: "follow",
      cache: "no-store",
    });

    const text = await upstream.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return Response.json(
        { ok: false, error: "GAS returned a non-JSON response.", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    return Response.json(json, { status: upstream.ok ? 200 : 502 });
  } catch (err) {
    return Response.json(
      { ok: false, error: `Failed to reach GAS backend: ${err.message}` },
      { status: 502 }
    );
  }
}

export async function GET() {
  return Response.json(
    { ok: false, error: "Use POST { action, payload } to call the GAS API." },
    { status: 405 }
  );
}
