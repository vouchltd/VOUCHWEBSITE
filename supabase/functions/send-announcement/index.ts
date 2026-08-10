// Admin-only: sends an announcement individually to each matching client
// (never a single email with everyone cc'd/bcc'd), so no client ever sees
// another client's address. Scope is either active clients (status !=
// 'cancelled') or literally every client on file.
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

  const { data: profile, error: profileErr } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  if (profileErr || profile?.role !== 'admin') {
    return json({ error: 'Admin access required' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const includeCancelled = Boolean(body.include_cancelled);
  if (!subject || !message) {
    return json({ error: 'subject and message are required' }, 400);
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let query = admin.from('clients').select('id, business_name, status');
  if (!includeCancelled) query = query.neq('status', 'cancelled');
  const { data: clients, error: clientsErr } = await query;
  if (clientsErr) return json({ error: clientsErr.message }, 400);

  let sent = 0;
  let failed = 0;

  // Sequential, not parallel: keeps this comfortably under Resend's
  // account-level rate limit even as the client list grows, at the cost
  // of the request taking longer for large lists.
  for (const client of clients || []) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(client.id);
      const email = authUser?.user?.email;
      if (!email) {
        failed++;
        continue;
      }

      const greeting = client.business_name ? `Hi ${client.business_name},` : 'Hi,';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vouch SoCal <notifications@vouchsocal.com>',
          to: [email],
          subject,
          text: `${greeting}\n\n${message}\n\n— Vouch SoCal`,
        }),
      });
      if (res.ok) {
        sent++;
      } else {
        failed++;
        console.error('Announcement send failed for', email, ':', await res.text());
      }
    } catch (err) {
      failed++;
      console.error('Announcement send error:', err);
    }
  }

  return json({ ok: true, sent, failed, total: (clients || []).length });
});
