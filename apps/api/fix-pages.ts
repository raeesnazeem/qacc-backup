import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const runId = 'cf69181d-4a61-4d76-8be6-d4e155f92c0d'; // Latest run from previous script
  console.log("Updating pages for run:", runId);

  const { data, error } = await supabase
    .from('pages')
    .update({ status: 'done' })
    .eq('run_id', runId);

  if (error) {
    console.error("Error updating pages:", error);
  } else {
    console.log("Successfully updated pages to 'done'");
  }
}

fix();
