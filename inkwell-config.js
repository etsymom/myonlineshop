// InkwellMedia Config
window.INK_CONFIG = {
  SUPABASE_URL:  "https://ndfqavpmqahdqpsqndbz.supabase.co",
  SUPABASE_ANON: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZnFhdnBtcWFoZHFwc3FuZGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODg0NjIsImV4cCI6MjA5NzY2NDQ2Mn0.DDiVkCTEJ__by6YlABHBhgKpyAWp_axezvDK7HwnVEs",
  ADMIN_EMAILS:  ["iedereesfrancis@gmail.com"],
  CREATOR_PASS_PRICE: 150,
  PLATFORM_CUT: 0.15,
};
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('inkwell-sw.js').catch(()=>{});
}
