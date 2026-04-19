const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: 'd:/focus-app/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing posts query...');
    const { data: posts, error: postErr } = await supabase.from('posts').select('*, profiles(*)').limit(1);
    if (postErr) console.error('Post Error:', postErr);
    else console.log('Posts:', posts.length);

    console.log('Testing boltz query...');
    const { data: boltz, error: boltzErr } = await supabase.from('boltz').select('*, profiles(*)').limit(1);
    if (boltzErr) console.error('Boltz Error:', boltzErr);
    else console.log('Boltz:', boltz.length);

    console.log('Testing flash query...');
    const { data: flash, error: flashErr } = await supabase.from('flash').select('*, profiles(*)').limit(1);
    if (flashErr) console.error('Flash Error:', flashErr);
    else console.log('Flash:', flash.length);
}

test();
