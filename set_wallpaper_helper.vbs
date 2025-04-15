' Simple standalone VBS script to set wallpaper
Option Explicit

Dim wallpaperPath
wallpaperPath = WScript.Arguments(0)

If wallpaperPath = "" Then
    WScript.Echo "Please drag and drop the wallpaper image onto this script"
    WScript.Quit
End If

' Verify file exists
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(wallpaperPath) Then
    WScript.Echo "Wallpaper file not found: " & wallpaperPath
    WScript.Quit
End If

' Set the wallpaper using multiple methods
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.RegWrite "HKCU\Control Panel\Desktop\Wallpaper", wallpaperPath, "REG_SZ"
shell.RegWrite "HKCU\Control Panel\Desktop\WallpaperStyle", "2", "REG_SZ"
shell.RegWrite "HKCU\Control Panel\Desktop\TileWallpaper", "0", "REG_SZ"

' Force a refresh using multiple methods
shell.Run "rundll32.exe user32.dll,UpdatePerUserSystemParameters 1, True", 0, True
WScript.Sleep 1000
shell.Run "rundll32.exe user32.dll,UpdatePerUserSystemParameters 1, True", 0, True

WScript.Echo "Wallpaper set successfully to: " & wallpaperPath 