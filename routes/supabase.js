const { createClient } = require('@supabase/supabase-js');

// Instantiate Supabase
const supabaseUrl = 'https://cxtvmolpayeplvdxcjvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dHZtb2xwYXllcGx2ZHhjanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NTE0NTgsImV4cCI6MjA2MTEyNzQ1OH0.LIBg-OUlZHE6jtct1hRBFn1uOw6upqyDOCK-qBqaXic';
const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase;
