const fs = require('fs');
let html = fs.readFileSync('members.html', 'utf8');

const loadUserLogic = `
    async function loadUser() {
      const isGhAdmin = localStorage.getItem("gh_admin") === "true";
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session && !isGhAdmin) { window.location.href = "index.html"; return; }
      
      if (isGhAdmin && !session) {
        currentUser = { id: "gh_admin", email: "admin" };
        document.getElementById("welcome-line").innerText = "Hi, Creator Admin";
        if (document.getElementById("wallet-container")) document.getElementById("wallet-container").style.display = "none";
        await loadAlbums();
        return;
      }
      
      currentUser = session.user;
      document.getElementById("welcome-line").innerText = "Hi, " + (currentUser.email || "");
`;

html = html.replace(
  '    async function loadUser() {\n      const { data: { session } } = await supabaseClient.auth.getSession();\n      if (!session) { window.location.href = "index.html"; return; }\n      currentUser = session.user;\n      document.getElementById("welcome-line").innerText = "Hi, " + (currentUser.email || "");',
  loadUserLogic
);

fs.writeFileSync('members.html', html);
