const SUPABASE_URL = 'https://flprvubcekattilqvyms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscHJ2dWJjZWthdHRpbHF2eW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjE0NDQsImV4cCI6MjA5NzI5NzQ0NH0.Aay3pAMBeHGxk-Zbnrae2k0zhSV6lCWfu-W-_5Wd8D8';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// The owner account — always has full control and can never be locked out.
const OWNER_EMAIL = 'rooseveltdjomo81@gmail.com';

async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

// Cached admin record for the current user (row from the `admins` table)
let _adminRecord;
async function loadAdmin() {
  if (_adminRecord !== undefined) return _adminRecord;
  const user = await getUser();
  if (!user) { _adminRecord = null; return null; }
  // Owner is always an admin even if the table query fails for any reason
  const ownerFallback = user.email === OWNER_EMAIL
    ? { email: user.email, role: 'owner', can_manage_jobs: true, can_manage_applications: true, can_manage_admins: true }
    : null;
  try {
    const { data } = await sb.from('admins').select('*').eq('email', user.email).maybeSingle();
    _adminRecord = data || ownerFallback;
  } catch (e) {
    _adminRecord = ownerFallback;
  }
  return _adminRecord;
}

// Synchronous best-effort check (owner only). Prefer loadAdmin() for full role check.
function isAdmin(user) {
  return user && user.email === OWNER_EMAIL;
}

async function getUserDisplay() {
  const user = await getUser();
  if (!user) return null;
  const name = user.user_metadata?.name || user.email.split('@')[0];
  return { id: user.id, email: user.email, name };
}
