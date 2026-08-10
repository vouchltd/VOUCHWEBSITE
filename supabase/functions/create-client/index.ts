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
  const redirectTo = `${Deno.env.get('PORTAL_SITE_URL') ?? 'https://www.vouchsocal.com'}/portal/reset-password`;
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

  // Send the onboarding contract via DocuSeal. Best-effort and one-shot:
  // this only ever fires here, at account creation, never again in the
  // client's lifetime (e.g. not on cancellation), so a failure here should
  // not block the account from being created — just get logged for admin
  // to follow up on manually.
  const DOCUSEAL_API_KEY = Deno.env.get('DOCUSEAL_API_KEY');
  const { data: templateSetting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'docuseal_template_id')
    .maybeSingle();
  const DOCUSEAL_TEMPLATE_ID = templateSetting?.value || Deno.env.get('DOCUSEAL_TEMPLATE_ID') || '5375399';
  let contractSent = false;
  if (DOCUSEAL_API_KEY) {
    try {
      const docusealRes = await fetch('https://api.docuseal.com/submissions', {
        method: 'POST',
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: Number(DOCUSEAL_TEMPLATE_ID),
          send_email: true,
          submitters: [{ role: 'First Party', email, name: businessName }],
        }),
      });
      contractSent = docusealRes.ok;
      if (!docusealRes.ok) {
        console.error('DocuSeal submission failed:', await docusealRes.text());
      }
    } catch (err) {
      console.error('DocuSeal submission error:', err);
    }
  } else {
    console.log('DOCUSEAL_API_KEY not configured — skipping contract send.');
  }

  return json({ ok: true, id: newUserId, contract_sent: contractSent });
});
