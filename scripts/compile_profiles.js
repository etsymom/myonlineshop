const fs = require('fs');
const path = require('path');

const profilesDir = path.join(__dirname, '../profiles');
const outputFile = path.join(__dirname, '../curated_profiles.json');

function compileProfiles() {
  const allProfiles = [];
  
  if (!fs.existsSync(profilesDir)) {
    console.error('Profiles directory does not exist.');
    return;
  }

  const items = fs.readdirSync(profilesDir);

  for (const item of items) {
    if (item === '_template') continue; // Skip template

    const itemPath = path.join(profilesDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const templatePath = path.join(itemPath, 'text folder', 'template.json');
      if (fs.existsSync(templatePath)) {
        try {
          const fileContent = fs.readFileSync(templatePath, 'utf-8');
          const profileData = JSON.parse(fileContent);
          
          // Add some generated ID and basic defaults if not present
          profileData.id = `github_${item.toLowerCase().replace(/\s+/g, '_')}`;
          profileData.folderName = item;
          
          allProfiles.push(profileData);
          console.log(`Compiled profile: ${item}`);
        } catch (err) {
          console.error(`Error parsing template.json for profile ${item}:`, err);
        }
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(allProfiles, null, 2));
  console.log(`Successfully compiled ${allProfiles.length} profiles into curated_profiles.json`);
}

compileProfiles();
