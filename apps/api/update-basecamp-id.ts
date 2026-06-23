import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing environment variable")
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})

async function updateAll() {
  const { data, error } = await supabase
    .from('project_settings')
    .update({ basecamp_account_id: '4023059' })
    .not('project_id', 'is', null);

  if (error) {
    console.error("Error updating DB:", error.message);
  } else {
    console.log("Success updating DB");
  }
}
updateAll();
