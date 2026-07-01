const fs = require('fs');

// 1. Fix inkwell-layout.js
let layout = fs.readFileSync('inkwell-layout.js', 'utf8');

const checkSessionLogic = `
  async function checkSession() {
    if (localStorage.getItem('gh_user')) return true;
    if (!window.supabase) return false;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: true }
      });
      const { data } = await client.auth.getSession();
      return !!(data && data.session);
    } catch { return false; }
  }
`;

layout = layout.replace(
  /  async function checkSession\(\) \{[\s\S]*?    \} catch \{ return false; \}\n  \}/,
  checkSessionLogic
);

const logoutLogic = `
  window.inkwellLogout = async function() {
    localStorage.removeItem('gh_user');
    if (window.supabase) {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      await client.auth.signOut();
    }
    window.location.href = "index.html";
  };
`;

layout = layout.replace(
  /  window\.inkwellLogout = async function\(\) \{[\s\S]*?  \};/,
  logoutLogic
);

fs.writeFileSync('inkwell-layout.js', layout);


// 2. Fix index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '            localStorage.setItem("gh_user", email.toLowerCase().trim());\n            window.location.href = "members.html";',
  '            const u = email.toLowerCase().trim();\n            localStorage.setItem("gh_user", u);\n            window.location.href = "creator.html?id=github_" + u.replace(/\\s+/g, "_");'
);
fs.writeFileSync('index.html', html);


// 3. Fix creator.html
let creator = fs.readFileSync('creator.html', 'utf8');
const isGhAdminLogic = `
        // Check if logged in as GH admin via localStorage
        const isGhAdmin = localStorage.getItem('gh_admin') === 'true';
        if (isGhAdmin) hasSubscribed = true;
`;

const isGhUserLogic = `
        // Check if logged in as GH user via localStorage
        const ghUser = localStorage.getItem('gh_user');
        const isOwner = ghUser && (profile.slug === ghUser || profile.folderName.toLowerCase() === ghUser || profile.name.toLowerCase() === ghUser);
        if (isOwner) hasSubscribed = true;
`;

creator = creator.replace(isGhAdminLogic, isGhUserLogic);

// Also update the discreet login/logout buttons in creator.html
creator = creator.replace(/if \(\!isGhAdmin\)/g, 'if (!isOwner)');
creator = creator.replace(/localStorage\.setItem\("gh_admin", "true"\);/g, 'localStorage.setItem("gh_user", profile.slug || profile.folderName);');
creator = creator.replace(/localStorage\.removeItem\("gh_admin"\);/g, 'localStorage.removeItem("gh_user");');
creator = creator.replace(/isGhAdmin/g, 'isOwner');

fs.writeFileSync('creator.html', creator);

