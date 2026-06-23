import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { createBasecampCampfireLine } from './src/lib/basecampClient';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');

async function testCampfire() {
  const { data: run } = await supabase.from('qa_runs').select('project_id').order('created_at', { ascending: false }).limit(1).single();
  if (!run) return console.log("No run");

  const { data: integration } = await supabase.from('integrations')
    .select('basecamp_token, basecamp_account_id, basecamp_project_id')
    .eq('project_id', run.project_id)
    .single();

  if (!integration) {
    // maybe project_settings?
    const { data: settings } = await supabase.from('project_settings')
      .select('basecamp_token, basecamp_account_id, basecamp_project_id')
      .eq('project_id', run.project_id)
      .single();
    if (!settings) return console.log("No settings");
    Object.assign(integration || {}, settings);
  }

  const accountId = integration.basecamp_account_id;
  const projectId = integration.basecamp_project_id;
  const token = integration.basecamp_token;

  console.log(`Testing with accountId: ${accountId}, projectId: ${projectId}`);
  
  try {
    const res = await createBasecampCampfireLine({
      token,
      accountId,
      projectId,
      content: "<strong>Test Campfire</strong><br/>Does it work?"
    });
    console.log("SUCCESS!", res);
  } catch (err: any) {
    console.error("FAILED!", err.message);
    if (err.data) console.error("Data:", err.data);
  }
}

testCampfire();
