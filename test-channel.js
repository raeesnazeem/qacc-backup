const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xyz.supabase.co', 'dummy');
const channel = supabase.channel('test');
console.log(typeof channel.send);
console.log(typeof channel.httpSend);
