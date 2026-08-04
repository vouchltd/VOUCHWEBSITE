// Shared Supabase client + auth helpers for the Vouch client portal.
// SUPABASE_URL and the anon key are meant to be public — access control is
// enforced by Postgres Row Level Security (RLS) policies, not by keeping
// these values secret.
const SUPABASE_URL = 'https://yaergzpwmcqmnxhivzci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZXJnenB3bWNxbW54aGl2emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzAxNTYsImV4cCI6MjEwMTQ0NjE1Nn0.a9VrMXc7vWpBYAYDYHcKornDAJ4VYkMaHD5lYYkhPaI';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function vouchGetSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function vouchGetRole(userId) {
  const { data, error } = await sb.from('profiles').select('role').eq('id', userId).single();
  if (error || !data) return null;
  return data.role;
}

// Redirects to login if not signed in; redirects to `wrongRoleRedirect`
// if signed in but the profile role doesn't match `expectedRole`.
// Returns the session on success, or null (after redirecting) otherwise.
async function vouchRequireRole(expectedRole, wrongRoleRedirect) {
  const session = await vouchGetSession();
  if (!session) {
    window.location.href = 'login';
    return null;
  }
  const role = await vouchGetRole(session.user.id);
  if (role !== expectedRole) {
    window.location.href = wrongRoleRedirect;
    return null;
  }
  return session;
}

async function vouchLogout() {
  await sb.auth.signOut();
  window.location.href = 'login';
}
