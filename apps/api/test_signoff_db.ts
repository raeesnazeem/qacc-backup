import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: signOffs, error } = await supabase
    .from('sign_offs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  if (!signOffs || signOffs.length === 0) {
    console.log("No sign offs found in the database. Did you click the sign off button after the fix?");
  } else {
    console.log("Latest sign off record:");
    console.log(JSON.stringify(signOffs[0], null, 2));
    if (!signOffs[0].basecamp_message_id) {
      console.log("-> basecamp_message_id is missing, meaning the Basecamp API call failed silently!");
    } else {
      console.log("-> basecamp_message_id exists! ID: " + signOffs[0].basecamp_message_id);
    }
  }
}

check();
