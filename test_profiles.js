const { createClient } = require('@supabase/supabase-js');
const sb = createClient("https://ndfqavpmqahdqpsqndbz.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZnFhdnBtcWFoZHFwc3FuZGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODg0NjIsImV4cCI6MjA5NzY2NDQ2Mn0.DDiVkCTEJ__by6YlABHBhgKpyAWp_axezvDK7HwnVEs");
async function test() {
  const { data, error } = await sb.from("profiles").select("id, first_name, last_name");
  console.log("Error:", error);
  console.log("Profiles Data:", data);
}
test();
