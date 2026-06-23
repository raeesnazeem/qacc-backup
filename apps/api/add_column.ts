import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');

async function run() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE sign_offs ADD COLUMN IF NOT EXISTS basecamp_url text;' });
  
  if (error) {
    console.log("Could not run RPC. Trying direct insert trick or we can just ask user.");
    console.log(error);
  } else {
    console.log("Column added successfully!");
  }
}
run();
