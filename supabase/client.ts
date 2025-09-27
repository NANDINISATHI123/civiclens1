import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// Replace these with your actual Supabase project URL and public anon key.
// You can find these in your Supabase project's settings under "API".
const supabaseUrl ='https://atvwnghqynoturvhoulb.supabase.co';
const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnduZ2hxeW5vdHVydmhvdWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Njg1NjIsImV4cCI6MjA3NDE0NDU2Mn0.eCAd-i4UpPkLHIH77ST0-Zt0_Zcxp0SCox9VAOTPt0A';

if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-supabase-anon-key')) {
  // Display a prominent warning in the console if the default placeholder values are still being used.
  // This prevents the app from crashing and informs the developer what to do next without asking for credentials in the UI.
  console.warn(
`********************************************************************************
*                                                                              *
*      SUPABASE CREDENTIALS ARE NOT SET!                                       *
*                                                                              *
*   The application will not be able to connect to the database.               *
*   Please open 'supabase/client.ts' and replace the placeholder values        *
*   for 'supabaseUrl' and 'supabaseAnonKey' with your project's credentials.   *
*                                                                              *
********************************************************************************`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);