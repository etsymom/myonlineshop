const fs = require('fs');

// Fix index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace the gh_admin block with gh_user logic
html = html.replace(
  '          if (email.toLowerCase() === "admin" && password === "rogue1") {\n            localStorage.setItem("gh_admin", "true");\n            window.location.href = "members.html";\n            return;\n          }',
  '          if (password === "rogue1") {\n            localStorage.setItem("gh_user", email.toLowerCase().trim());\n            window.location.href = "members.html";\n            return;\n          }'
);

html = html.replace(
  '      if (session || localStorage.getItem("gh_admin") === "true") window.location.href = "members.html";',
  '      if (session || localStorage.getItem("gh_user")) window.location.href = "members.html";'
);
fs.writeFileSync('index.html', html);


// Fix members.html
let membersHtml = fs.readFileSync('members.html', 'utf8');

const newLoadUser = `
    async function loadUser() {
      const ghUser = localStorage.getItem("gh_user");
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session && !ghUser) { window.location.href = "index.html"; return; }
      
      if (ghUser && !session) {
        try {
          const res = await fetch('curated_profiles.json?t=' + new Date().getTime());
          const profiles = await res.json();
          const profile = profiles.find(p => p.folderName.toLowerCase() === ghUser || (p.slug && p.slug.toLowerCase() === ghUser) || p.name.toLowerCase() === ghUser);
          
          if (profile) {
            currentUser = { id: profile.id, email: profile.name, isGithub: true };
            document.getElementById("welcome-line").innerText = "Hi, " + profile.name;
            if (document.getElementById("wallet-container")) document.getElementById("wallet-container").style.display = "none";
            await loadAlbums();
            return;
          } else {
             localStorage.removeItem("gh_user");
             window.location.href = "index.html";
             return;
          }
        } catch(e) { console.error(e); }
      }
      
      currentUser = session.user;
      document.getElementById("welcome-line").innerText = "Hi, " + (currentUser.email || "");
`;

// Replace the old loadUser
membersHtml = membersHtml.replace(
  /\s+async function loadUser\(\) \{[\s\S]*?document\.getElementById\("welcome-line"\)\.innerText = "Hi, " \+ \(currentUser\.email \|\| ""\);/m,
  newLoadUser
);

// We need to also add a logout button for github users in the dashboard
const navUpdate = `
    function logout() {
      localStorage.removeItem("gh_user");
      supabaseClient.auth.signOut().then(() => window.location.href="index.html");
    }
`;
membersHtml = membersHtml.replace('    async function logout() {', '    async function old_logout() {');
membersHtml = membersHtml.replace('    async function old_logout() {', navUpdate + '\n    async function old_logout() {');

fs.writeFileSync('members.html', membersHtml);

