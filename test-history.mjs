import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envBuffer = fs.readFileSync(join(__dirname, '.env.local'));
const envConfig = require('dotenv').parse(envBuffer);

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('members')
    .select('id, group_id, joined_at, groups!members_group_id_fkey(name, slug)')
    .eq('user_id', '42b4725c-e1eb-4075-9d44-e1cb39ef5a08')
    .order('joined_at', { ascending: false });

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  console.log('Sample Data:', JSON.stringify(data?.slice(0, 2), null, 2));
}

test();
