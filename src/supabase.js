// Supabase Client Initialization
const supabaseUrl = 'https://spxctiaqjicdgchqvzuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweGN0aWFxamljZGdjaHF2enVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzgzMTQsImV4cCI6MjA4OTE1NDMxNH0.UrjfNq68StEm5g7N52JufE625VQTs5TWKXAcElCNwlc';

// The client is available on window.supabase since we'll include it via CDN
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
