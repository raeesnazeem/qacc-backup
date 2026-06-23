import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// We need to bypass getDecryptedSettings because it relies on env vars that might not be loaded in script context easily.
// But we can just query the project directly for the token.
async function check() {
  const { data: run } = await supabase.from('qa_runs').select('project_id').order('created_at', { ascending: false }).limit(1).single();
  if (!run) return console.log("No run");

  const { data: integration } = await supabase.from('integrations')
    .select('basecamp_token, basecamp_account_id, basecamp_project_id')
    .eq('project_id', run.project_id)
    .single();

  if (!integration) return console.log("No integration");

  const accountId = integration.basecamp_account_id;
  const projectId = integration.basecamp_project_id;
  const token = integration.basecamp_token;

  const chatsUrl = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/chats.json`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': `Test Script`
  };

  try {
    const response = await axios.get(chatsUrl, { headers });
    console.log("CHATS FOUND:", response.data.length);
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.length > 0) {
      const chatId = response.data[0].id;
      const url = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/chats/${chatId}/lines.json`;
      console.log("Would post to:", url);
    }
  } catch (err: any) {
    console.log("API ERROR:", err.response ? err.response.data : err.message);
  }
}

check();
