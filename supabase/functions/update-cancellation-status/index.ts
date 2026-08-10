// Admin-only: called when staff click "Acknowledge" or "Mark Complete" on a
// cancellation request. Updates the request's status, syncs the client's
// account status (clients.status) so the portal home page reflects it, and
// emails the client about the change. The client's account status and the
// email are best-effort follow-ons — the request status update above is the
// source of truth and always happens first.
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

const CLIENT_STATUS_BY_REQUEST_STATUS: Record<string, string> = {
  acknowledged: 'pending_cancellation',
  completed: 'cancelled',
};

const EMAIL_SUBJECT_BY_STATUS: Record<string, string> = {
  acknowledged: 'Your cancellation request has been received',
  completed: 'Your Vouch SoCal account has been cancelled',
};

const EMAIL_TEXT_BY_STATUS: Record<string, string> = {
  acknowledged: "We've received and acknowledged your cancellation request. We'll follow up to confirm your effective end date. No further action is needed from you.",
  completed: "Your Vouch SoCal account has been cancelled as requested. If this was a mistake or you'd like to come back, just reply to this email.",
};

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

  const cancellationId = String(body.cancellation_id || '').trim();
  const newStatus = String(body.new_status || '').trim();
  const clientStatus = CLIENT_STATUS_BY_REQUEST_STATUS[newStatus];
  if (!cancellationId || !clientStatus) {
    return json({ error: 'cancellation_id and a valid new_status (acknowledged or completed) are required' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: cancellation, error: cancellationErr } = await admin
    .from('cancellation_requests')
    .select('id, client_id')
    .eq('id', cancellationId)
    .single();
  if (cancellationErr || !cancellation) return json({ error: 'Cancellation request not found' }, 404);

  const { error: updateReqErr } = await admin
    .from('cancellation_requests')
    .update({ status: newStatus })
    .eq('id', cancellationId);
  if (updateReqErr) return json({ error: updateReqErr.message }, 400);

  const { error: clientUpdateErr } = await admin
    .from('clients')
    .update({ status: clientStatus })
    .eq('id', cancellation.client_id);
  if (clientUpdateErr) return json({ error: clientUpdateErr.message }, 400);

  // Email the client. Best-effort: both status updates above already
  // succeeded regardless of whether this send succeeds.
  let emailed = false;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (RESEND_API_KEY) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(cancellation.client_id);
      const clientEmail = authUser?.user?.email;
      if (clientEmail) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Vouch Portal <notifications@vouchsocal.com>',
            to: [clientEmail],
            subject: EMAIL_SUBJECT_BY_STATUS[newStatus],
            text: `${EMAIL_TEXT_BY_STATUS[newStatus]}\n\nLog in to your portal anytime to check your account status: https://www.vouchsocal.com/portal/login`,
          }),
        });
        emailed = res.ok;
        if (!res.ok) console.error('Client status-update email failed:', await res.text());
      } else {
        console.error('No email on file for client', cancellation.client_id);
      }
    } catch (err) {
      console.error('Client status-update email error:', err);
    }
  }

  return json({ ok: true, client_status: clientStatus, emailed });
});
