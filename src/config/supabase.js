const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  logger.warn(
    'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — supabase-js client disabled. ' +
      'Direct Postgres access via src/config/database.js still works.'
  );
}

module.exports = supabase;
