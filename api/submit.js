// Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  // 手動でJSONパース（Vercelの素の関数は自動パースされない前提）
  let body = '';
  for await (const chunk of req) body += chunk;
  let stars = null, comment = '';
  try {
    const j = JSON.parse(body || '{}');
    stars = Number(j.stars);
    comment = String(j.comment || '').slice(0,1000);
  } catch (e) { return res.status(400).json({error:'Bad JSON'}); }
  if (!(stars>=1 && stars<=5)) return res.status(400).json({error:'Invalid stars'});

  try {
    // GASのWebアプリへ転送（環境変数からURL取得）
    const r = await fetch(process.env.GAS_WEBAPP_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        stars, comment,
        ua: req.headers['user-agent'] || '',
        ts: new Date().toISOString()
      })
    });
    const text = await r.text();
    return res.status(200).json({ ok:true, relay:text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:'Relay failed' });
  }
}
