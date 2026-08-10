// Admin-only: pushes a fresh DocuSeal contract to an existing client,
// using whichever template is currently set in app_settings (same one
// onboarding uses), and re-gates their portal behind signing it. Used
// when the underlying contract has changed and an already-active client
// needs to sign the new version.
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

  const clientId = String(body.client_id || '').trim();
  if (!clientId) return json({ error: 'client_id is required' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('business_name')
    .eq('id', clientId)
    .single();
  if (clientErr || !client) return json({ error: 'Client not found' }, 404);

  const { data: authUser, error: authUserErr } = await admin.auth.admin.getUserById(clientId);
  const clientEmail = authUser?.user?.email;
  if (authUserErr || !clientEmail) return json({ error: 'Could not look up client email' }, 400);

  const DOCUSEAL_API_KEY = Deno.env.get('DOCUSEAL_API_KEY');
  if (!DOCUSEAL_API_KEY) return json({ error: 'DOCUSEAL_API_KEY not configured' }, 400);

  const { data: templateSetting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'docuseal_template_id')
    .maybeSingle();
  const DOCUSEAL_TEMPLATE_ID = templateSetting?.value || Deno.env.get('DOCUSEAL_TEMPLATE_ID') || '5375399';

  const docusealRes = await fetch('https://api.docuseal.com/submissions', {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: Number(DOCUSEAL_TEMPLATE_ID),
      send_email: false,
      submitters: [{ role: 'First Party', email: clientEmail, name: client.business_name || clientEmail }],
    }),
  });

  if (!docusealRes.ok) {
    const errText = await docusealRes.text();
    console.error('DocuSeal submission failed:', errText);
    return json({ error: 'Could not create new contract in DocuSeal' }, 400);
  }

  const submitters = await docusealRes.json();
  const slug = submitters?.[0]?.slug;
  if (!slug) return json({ error: 'DocuSeal did not return a submission slug' }, 400);

  const { error: updateErr } = await admin
    .from('clients')
    .update({ docuseal_submission_slug: slug, contract_needs_resign: true })
    .eq('id', clientId);
  if (updateErr) return json({ error: updateErr.message }, 400);

  // Notify the client. Best-effort: the new contract is already live in
  // the portal regardless of whether this send succeeds.
  let emailed = false;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vouch Portal <notifications@vouchsocal.com>',
          to: [clientEmail],
          subject: 'Action required: please sign your updated service agreement',
          text: "We've updated our client service agreement. Please log in to your portal to review and sign the new version.\n\nContinued access to your account requires signing the updated agreement — accounts that don't sign may have their membership cancelled.\n\nLog in here: https://www.vouchsocal.com/portal/login",
        }),
      });
      emailed = res.ok;
      if (!res.ok) console.error('New-contract notification failed:', await res.text());
    } catch (err) {
      console.error('New-contract notification error:', err);
    }
  }

  return json({ ok: true, emailed });
});
