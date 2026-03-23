// Supabase Client Initialization
const supabaseUrl = 'https://spxctiaqjicdgchqvzuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweGN0aWFxamljZGdjaHF2enVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzgzMTQsImV4cCI6MjA4OTE1NDMxNH0.UrjfNq68StEm5g7N52JufE625VQTs5TWKXAcElCNwlc';

// The client is available on window.supabase since we'll include it via CDN
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Automatically parse the #access_token from the URL after OAuth redirect
    detectSessionInUrl: true,
    // Implicit flow is correct for pure client-side SPAs (no backend server)
    flowType: 'implicit',
    // Keep the session alive across browser refreshes
    persistSession: true,
  },
});
