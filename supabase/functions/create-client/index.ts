// Admin-only: creates a new client login + seeds their clients/billing rows.
// Requires the service_role key (never exposed to the browser), so this
// must run server-side as an Edge Function rather than client-side JS.
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

  const email = String(body.email || '').trim();
  const businessName = String(body.business_name || '').trim();
  if (!email || !businessName) {
    return json({ error: 'email and business_name are required' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Without redirectTo, Supabase sends the client to the bare site_url
  // (the homepage) instead of the password-set page, so the invite link
  // looks like it "does nothing."
  const redirectTo = `${Deno.env.get('PORTAL_SITE_URL') ?? 'https://www.vouchltd.com'}/portal/reset-password`;
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inviteErr || !invited?.user) {
    return json({ error: inviteErr?.message || 'Could not create client login' }, 400);
  }
  const newUserId = invited.user.id;

  const { error: profileInsertErr } = await admin
    .from('profiles')
    .insert({ id: newUserId, role: 'client' });
  if (profileInsertErr) return json({ error: profileInsertErr.message }, 400);

  const { error: clientInsertErr } = await admin.from('clients').insert({
    id: newUserId,
    business_name: businessName,
    category: body.category || null,
    address: body.address || null,
    phone: body.phone || null,
  });
  if (clientInsertErr) return json({ error: clientInsertErr.message }, 400);

  const { error: billingInsertErr } = await admin.from('billing').insert({
    client_id: newUserId,
    monthly_amount: body.monthly_amount || null,
    next_billing_date: body.next_billing_date || null,
  });
  if (billingInsertErr) return json({ error: billingInsertErr.message }, 400);

  return json({ ok: true, id: newUserId });
});
