require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('members')
    .select('id, group_id, joined_at, groups!members_group_id_fkey(name, slug)')
    .eq('user_id', '42b4725c-e1eb-4075-9d44-e1cb39ef5a08')
    .order('joined_at', { ascending: false });

  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
