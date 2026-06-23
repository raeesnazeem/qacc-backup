import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');

async function run() {
  const projectId = '9e87204c-2d4d-4242-8514-4ccd6836633b';
  
  const { data, error } = await supabase.from('project_settings').select('basecamp_project_id, basecamp_account_id').eq('project_id', projectId).single();
  if (data && data.basecamp_project_id) {
    console.log(`Basecamp Project ID (from project_settings): ${data.basecamp_project_id}`);
    console.log(`Basecamp Account ID: ${data.basecamp_account_id}`);
    return;
  }
  
  const { data: integ, error: integErr } = await supabase.from('integrations').select('basecamp_project_id, basecamp_account_id').eq('project_id', projectId).single();
  if (integ && integ.basecamp_project_id) {
    console.log(`Basecamp Project ID (from integrations): ${integ.basecamp_project_id}`);
    console.log(`Basecamp Account ID: ${integ.basecamp_account_id}`);
  } else {
    console.log("Could not find Basecamp settings for this project in the DB.");
  }
}
run();
