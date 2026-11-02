// This tells Node to read the secret keys from your .env file
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Grab the keys from the environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Initialize the Supabase connection
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Attempting to connect to Supabase...");

  // Try to fetch data from the 'users' table we just created
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    console.error("❌ Connection failed! Error:", error.message);
  } else {
    console.log("✅ Connection successful!");
    console.log("Users in database:", data);
    console.log("If it says '[]', that is perfect! It means the table exists but is currently empty.");
  }
}

// Run the function
testConnection();