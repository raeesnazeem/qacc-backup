import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing credentials", supabaseUrl, supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: runs, error: runError } = await supabase
    .from('qa_runs')
    .select('id, pages_processed, pages_total')
    .order('created_at', { ascending: false })
    .limit(1);

  if (runError || !runs || runs.length === 0) {
    console.log("No runs found");
    return;
  }
  const run = runs[0];
  console.log("Checking run:", run.id);
  console.log("Run info:", { pages_processed: run.pages_processed, pages_total: run.pages_total });

  const { data, error } = await supabase.from('pages').select('id, status').eq('run_id', run.id);
  if (error) {
    console.error(error);
  } else {
    const statuses: Record<string, number> = {};
    data.forEach((p: any) => {
      statuses[p.status] = (statuses[p.status] || 0) + 1;
    });
    console.log("Page statuses:", statuses);
  }
}

check();
