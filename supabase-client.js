const SUPABASE_URL = 'https://flprvubcekattilqvyms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscHJ2dWJjZWthdHRpbHF2eW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjE0NDQsImV4cCI6MjA5NzI5NzQ0NH0.Aay3pAMBeHGxk-Zbnrae2k0zhSV6lCWfu-W-_5Wd8D8';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = 'rooseveltdjomo81@gmail.com';

async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

async function getUserDisplay() {
  const user = await getUser();
  if (!user) return null;
  const name = user.user_metadata?.name || user.email.split('@')[0];
  return { id: user.id, email: user.email, name };
}
