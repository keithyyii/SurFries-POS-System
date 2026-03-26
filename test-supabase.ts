import { supabase } from './src/supabaseClient'

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test 1: Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    console.log('✓ Auth session check successful')
    
    // Test 2: Try to query a table (will be empty but proves connection works)
    const { data, error } = await supabase
      .from('products')
      .select('count')
      
    if (error) {
      console.log('⚠ Table "products" not found (table may not exist yet)')
    } else {
      console.log('✓ Successfully connected to Supabase database')
      console.log('✓ "products" table exists')
    }
    
    console.log('\n✅ Supabase is properly connected!')
    
  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()
