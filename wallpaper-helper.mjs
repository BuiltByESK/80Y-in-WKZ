// wallpaper-helper.mjs - ES Module for setting wallpapers
import * as wallpaperModule from 'wallpaper';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The main function to set wallpaper
async function setWallpaper() {
  try {
    // Get the wallpaper path from command line arguments or use the default
    const imagePath = process.argv[2] || resolve(__dirname, 'life_calendar_wallpaper.png');
    
    console.log(`Setting wallpaper from: ${imagePath}`);
    
    // Set the wallpaper
    await wallpaperModule.set(imagePath, { scale: 'fill' });
    
    console.log('Wallpaper set successfully!');
    return true;
  } catch (error) {
    console.error('Error setting wallpaper:', error.message);
    return false;
  }
}

// Run the function
setWallpaper()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 