const dotenv = require('dotenv');
dotenv.config();

console.log('--- ENV DEBUG ---');
console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('KEY Length:', process.env.REACT_APP_SUPABASE_ANON_KEY ? process.env.REACT_APP_SUPABASE_ANON_KEY.length : 'MISSING');
console.log('KEY Start:', process.env.REACT_APP_SUPABASE_ANON_KEY ? process.env.REACT_APP_SUPABASE_ANON_KEY.substring(0, 10) : 'N/A');
console.log('-----------------');
