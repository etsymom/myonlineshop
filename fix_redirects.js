const fs = require('fs');

// 1. Fix index.html automatic redirect to creator.html instead of members.html
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  '      if (session || localStorage.getItem("gh_user")) window.location.href = "members.html";',
  `      if (localStorage.getItem("gh_user")) {
        const u = localStorage.getItem("gh_user");
        window.location.href = "creator.html?id=github_" + u.replace(/\\s+/g, "_");
      } else if (session) {
        window.location.href = "members.html";
      }`
);

// We need to fix both occurrences of the session check in index.html
html = html.replace(
  '      if (session) window.location.href = "members.html";',
  '      if (session) window.location.href = "members.html"; // handled above'
);
fs.writeFileSync('index.html', html);


// 2. Add cache busting to inkwell-layout.js on all pages
const pages = ['index.html', 'members.html', 'creator.html', 'explore.html'];
for (const page of pages) {
  if (!fs.existsSync(page)) continue;
  let pageHtml = fs.readFileSync(page, 'utf8');
  pageHtml = pageHtml.replace(
    /<script src="inkwell-layout\.js(\?v=\d+)?"><\/script>/,
    '<script src="inkwell-layout.js?v=' + Date.now() + '"></script>'
  );
  fs.writeFileSync(page, pageHtml);
}
