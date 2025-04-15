// Simple standalone wallpaper setter for Windows 11
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to wallpaper image
const wallpaperPath = path.resolve(process.argv[2] || './life_calendar_wallpaper.png');

// Check if file exists
if (!fs.existsSync(wallpaperPath)) {
  console.error(`Error: Wallpaper file not found at: ${wallpaperPath}`);
  console.error('Usage: node wallpaper_setter.js [path/to/image.png]');
  process.exit(1);
}

console.log(`Setting wallpaper from: ${wallpaperPath}`);

try {
  // Create PowerShell command to set wallpaper using Windows 11 compatible method
  const psScript = `
    # Set wallpaper using .NET API
    # This method works on Windows 10/11
    Add-Type -AssemblyName System.Windows.Forms
    
    # Set desktop properties in registry  
    Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name WallpaperStyle -Value 2
    Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name TileWallpaper -Value 0
    
    # First approach: Use SystemParametersInfo API call
    Add-Type -TypeDefinition @"
      using System;
      using System.Runtime.InteropServices;
      
      public class Wallpaper {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
      }
"@
    
    # Set the wallpaper
    [Wallpaper]::SystemParametersInfo(0x0014, 0, "${wallpaperPath.replace(/\\/g, '\\\\')}", 0x01 | 0x02)
    
    # Explicitly trigger the reload
    RUNDLL32.EXE USER32.DLL,UpdatePerUserSystemParameters
    
    # Wait a second and try again
    Start-Sleep -Seconds 1
    RUNDLL32.EXE USER32.DLL,UpdatePerUserSystemParameters
    
    Write-Host "Wallpaper set to: ${wallpaperPath.replace(/\\/g, '\\\\')}"
  `;
  
  // Execute PowerShell with Bypass execution policy
  console.log('Executing PowerShell command...');
  const result = execSync(`powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/\$/g, '`$')}"`, {
    encoding: 'utf8'
  });
  
  console.log('PowerShell output:');
  console.log(result);
  console.log('Wallpaper set successfully!');
  
} catch (error) {
  console.error('Error setting wallpaper:', error.message);
  process.exit(1);
} 