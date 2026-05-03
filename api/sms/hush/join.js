export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body || {};
  if (!phone || !/^\+1\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || '+18885468895';

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'Twilio credentials not configured on server' });
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: phone,
    From: fromNumber,
    Body: "You're on the HUSH list. Tickets to HUSH at Skybar (Moonrise Hotel): https://posh.vip/e/hush-skybar-at-moonrise-hotel\n\nQuestions? Call this number. Reply STOP to opt out."
  });

  const twilioResp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  if (!twilioResp.ok) {
    const detail = await twilioResp.text();
    return res.status(502).json({ error: 'SMS send failed', detail });
  }

  const data = await twilioResp.json();
  return res.status(200).json({ ok: true, sid: data.sid });
}
