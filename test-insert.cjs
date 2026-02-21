require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("Attempting to insert group anonymously...");
    const { data, error } = await supabase
        .from('groups')
        .insert({
            name: "test-anon-group",
            slug: "test-anon-slug-" + Math.random().toString(36).substring(2, 8),
            type: "remote"
        });

    if (error) {
        console.error("FAILED with error:", JSON.stringify(error, null, 2));
    } else {
        console.log("SUCCESS:", data);
    }
}
run();
