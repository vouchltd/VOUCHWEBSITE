// Triggered by a Postgres trigger (via pg_net) on INSERT into
// cancellation_requests. Sends a notification email via Resend.
// Best-effort: the database row is the source of truth regardless of
// whether this email succeeds, so failures here are logged, not thrown.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record?.client_id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no client_id' }), { status: 200 });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const NOTIFY_TO = Deno.env.get('NOTIFY_EMAIL') || 'vouchsocal@gmail.com';

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: client } = await admin
      .from('clients')
      .select('business_name')
      .eq('id', record.client_id)
      .single();

    const businessName = client?.business_name || 'Unknown business';
    const reason = record.reason || '(no reason given)';

    if (!RESEND_API_KEY || RESEND_API_KEY === 'REPLACE_ME_RESEND_API_KEY') {
      console.log('RESEND_API_KEY not configured yet — skipping email. Request logged in DB only.', {
        businessName,
        reason,
      });
      return new Response(JSON.stringify({ ok: true, emailed: false }), { status: 200 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vouch Portal <notifications@vouchsocal.com>',
        to: [NOTIFY_TO],
        subject: `Cancellation request: ${businessName}`,
        text: `${businessName} submitted a cancellation request through the client portal.\n\nReason: ${reason}\n\nLog in to the admin panel to acknowledge and follow up.`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend send failed:', errText);
    }

    return new Response(JSON.stringify({ ok: true, emailed: res.ok }), { status: 200 });
  } catch (err) {
    console.error('notify-cancellation error:', err);
    return new Response(JSON.stringify({ ok: true, error: String(err) }), { status: 200 });
  }
});
