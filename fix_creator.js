const fs = require('fs');
let html = fs.readFileSync('creator.html', 'utf8');

// 1. Remove the full page login gate that was added earlier
html = html.replace(/\/\/ AUTHENTICATION GATE for GitHub Profiles[\s\S]*?try \{/m, 'try {');

// 2. Add the discreet Creator Login button logic
const insertStr = `
        // Check if logged in as GH admin via localStorage
        const isGhAdmin = localStorage.getItem('gh_admin') === 'true';
        if (isGhAdmin) hasSubscribed = true;
        
        document.getElementById("creator-name-title").innerText = hasSubscribed ? actualName : usernameStr;
        document.getElementById("creator-username").innerText = usernameStr;
        
        // Add a discreet Creator Login button if not already logged in as GH admin
        if (!isGhAdmin) {
           const loginBtn = document.createElement("button");
           loginBtn.innerText = "Creator Login";
           loginBtn.style.fontSize = "10px";
           loginBtn.style.padding = "4px 8px";
           loginBtn.style.background = "transparent";
           loginBtn.style.border = "1px solid var(--slate-light)";
           loginBtn.style.borderRadius = "4px";
           loginBtn.style.color = "var(--slate)";
           loginBtn.style.cursor = "pointer";
           loginBtn.style.marginTop = "8px";
           loginBtn.onclick = () => {
              const u = prompt("Username:");
              const p = prompt("Password:");
              if (u === "admin" && p === "rogue1") {
                 localStorage.setItem("gh_admin", "true");
                 window.location.reload();
              } else {
                 alert("Invalid credentials");
              }
           };
           document.getElementById("creator-username").parentElement.appendChild(loginBtn);
        } else {
           const logoutBtn = document.createElement("button");
           logoutBtn.innerText = "Creator Logout";
           logoutBtn.style.fontSize = "10px";
           logoutBtn.style.padding = "4px 8px";
           logoutBtn.style.background = "var(--danger)";
           logoutBtn.style.border = "none";
           logoutBtn.style.borderRadius = "4px";
           logoutBtn.style.color = "var(--white)";
           logoutBtn.style.cursor = "pointer";
           logoutBtn.style.marginTop = "8px";
           logoutBtn.onclick = () => {
              localStorage.removeItem("gh_admin");
              window.location.reload();
           };
           document.getElementById("creator-username").parentElement.appendChild(logoutBtn);
        }
`;

html = html.replace(
  '        document.getElementById("creator-name-title").innerText = hasSubscribed ? actualName : usernameStr;\n        document.getElementById("creator-username").innerText = usernameStr;',
  insertStr
);

// 3. Update the album logic
html = html.replace(
  '           const isOwner = false;\n           const userHasPurchased = hasSubscribed;',
  '           const isOwner = typeof isGhAdmin !== "undefined" && isGhAdmin;\n           const userHasPurchased = hasSubscribed || isOwner;'
);

fs.writeFileSync('creator.html', html);
