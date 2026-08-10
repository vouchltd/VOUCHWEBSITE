// Client-only, self-service: called by the embedded DocuSeal form's
// "completed" event (or the manual fallback button) once a client finishes
// signing their onboarding contract. Records the timestamp so the portal
// stops gating the dashboard behind the contract on future logins. A caller
// can only ever mark their own row — there is no client_id parameter.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization') || '';
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: updatedClient, error } = await admin
    .from('clients')
    .update({ contract_signed_at: new Date().toISOString(), contract_needs_resign: false })
    .eq('id', userData.user.id)
    .select('business_name')
    .single();
  if (error) return json({ error: error.message }, 400);

  // Notify the team. Best-effort: the signature is already recorded above
  // regardless of whether this send succeeds.
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (RESEND_API_KEY) {
    try {
      const notifyTo = (Deno.env.get('NOTIFY_EMAIL') || 'vouchsocal@gmail.com,vouch.limited@gmail.com')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vouch Portal <notifications@vouchsocal.com>',
          to: notifyTo,
          subject: `Contract signed: ${updatedClient?.business_name || userData.user.email}`,
          text: `${updatedClient?.business_name || 'A client'} (${userData.user.email}) just signed their onboarding contract in the portal.\n\nLog in to the admin panel to review their account.`,
        }),
      });
      if (!res.ok) console.error('Contract-signed notification failed:', await res.text());
    } catch (err) {
      console.error('Contract-signed notification error:', err);
    }
  } else {
    console.log('RESEND_API_KEY not configured — skipping contract-signed notification.');
  }

  return json({ ok: true });
});
