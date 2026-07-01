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
      let templatePath = path.join(itemPath, 'text folder', 'template.json');
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(itemPath, 'text', 'template.json');
      }
      
      if (fs.existsSync(templatePath)) {
        try {
          const fileContent = fs.readFileSync(templatePath, 'utf-8');
          const profileData = JSON.parse(fileContent);
          
          // Add some generated ID and basic defaults if not present
          profileData.id = `github_${item.toLowerCase().replace(/\s+/g, '_')}`;
          profileData.folderName = item;
          
          // Map videos into an album so the frontend can render them
          if (profileData.videos && Array.isArray(profileData.videos)) {
            if (!profileData.albums) profileData.albums = [];
            
            const mediaItems = profileData.videos.map(v => ({
              type: 'video',
              url: v.video_path || v.thumbnail_path,
              thumbnail: v.thumbnail_path
            }));
            
            if (mediaItems.length > 0) {
              profileData.albums.push({
                title: "All Videos",
                description: "Creator Videos",
                media: mediaItems,
                price: 0
              });
            }
          }
          
          // Auto-generate albums from subfolders in images/ and videos/
          const mediaDirs = ['images', 'videos'];
          if (!profileData.albums) profileData.albums = [];

          for (const mediaDir of mediaDirs) {
            const fullMediaDirPath = path.join(itemPath, mediaDir);
            if (fs.existsSync(fullMediaDirPath) && fs.statSync(fullMediaDirPath).isDirectory()) {
              const subItems = fs.readdirSync(fullMediaDirPath);
              for (const subItem of subItems) {
                const subItemPath = path.join(fullMediaDirPath, subItem);
                if (fs.statSync(subItemPath).isDirectory()) {
                  // This is a subfolder, treat it as an album!
                  const albumMedia = [];
                  const files = fs.readdirSync(subItemPath);
                  for (const file of files) {
                    // ignore hidden files like .DS_Store
                    if (file.startsWith('.')) continue;
                    
                    const ext = path.extname(file).toLowerCase();
                    const type = ['.mp4', '.webm', '.mov'].includes(ext) ? 'video' : 'image';
                    albumMedia.push({
                      type: type,
                      url: `profiles/${item}/${mediaDir}/${subItem}/${file}`
                    });
                  }
                  
                  if (albumMedia.length > 0) {
                    profileData.albums.push({
                      title: subItem.replace(/_/g, ' '),
                      description: `Auto-generated album from folder: ${subItem}`,
                      media: albumMedia,
                      price: 0
                    });
                  }
                }
              }
            }
          }
          
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
