import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { getProjectSettings } from './src/lib/getDecryptedSettings';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
  try {
    const runId = '90f6c41f-09f7-4fa6-9ae4-461d1be1bd9a';
    const projectId = '9e87204c-2d4d-4242-8514-4ccd6836633b';
    const settings = await getProjectSettings(projectId);
    
    if (!settings) {
      console.log("No settings");
      return;
    }

    const { basecamp_token, basecamp_account_id, basecamp_project_id } = settings;
    
    const headers = {
      'Authorization': `Bearer ${basecamp_token}`,
      'Content-Type': 'application/json',
      'User-Agent': `QACC Debug (debug@example.com)`
    };

    console.log(`Fetching ALL project data for bucket ${basecamp_project_id}`);
    
    const projectUrl = `https://3.basecampapi.com/${basecamp_account_id}/projects/${basecamp_project_id}.json`;
    const projectRes = await axios.get(projectUrl, { headers });
    console.log("=== PROJECT TOOLS ===");
    projectRes.data.dock.forEach((tool: any) => {
      console.log(`- ${tool.title} (${tool.name}): ${tool.url}`);
    });

    const chatsUrl = `https://3.basecampapi.com/${basecamp_account_id}/buckets/${basecamp_project_id}/chats.json`;
    const chatsRes = await axios.get(chatsUrl, { headers });
    console.log("=== CHATS ===");
    console.log(JSON.stringify(chatsRes.data.map((c: any) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      lines_url: c.lines_url
    })), null, 2));

  } catch (e: any) {
    console.error(e?.response?.data || e.message);
  }
}
run();
