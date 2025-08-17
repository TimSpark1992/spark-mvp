#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
const envContent = fs.readFileSync('/app/.env.local', 'utf8');
const envLines = envContent.split('\n');
const env = {};

envLines.forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixUserRole() {
  try {
    console.log('🔍 Finding user test.creator@example.com...');
    
    // First, check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test.creator@example.com')
      .single();
    
    if (checkError) {
      console.error('❌ Error checking user:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Found user:', existingUser);
      console.log('Current role:', existingUser.role);
      
      // Update the user's role to 'creator'
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'creator' })
        .eq('email', 'test.creator@example.com')
        .select();
      
      if (error) {
        console.error('❌ Error updating role:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('✅ SUCCESS: Updated user role to creator');
        console.log('Updated profile:', data[0]);
      } else {
        console.log('⚠️ Update returned no data');
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

fixUserRole().then(() => {
  console.log('🎉 Role fix process complete');
}).catch(err => {
  console.error('💥 Role fix failed:', err);
});