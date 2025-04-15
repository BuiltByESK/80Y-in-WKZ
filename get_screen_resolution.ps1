# PowerShell script to get screen resolution
try {
    # Method 1: Using Windows Forms
    Add-Type -AssemblyName System.Windows.Forms
    $primaryScreen = [System.Windows.Forms.Screen]::PrimaryScreen
    $width = $primaryScreen.Bounds.Width
    $height = $primaryScreen.Bounds.Height
    
    # Output the resolution
    if ($width -gt 0 -and $height -gt 0) {
        Write-Output "$width,$height"
        exit 0
    }
} catch {
    # Ignore errors and continue
}

try {
    # Method 2: Using WMI
    $monitors = Get-WmiObject -Class Win32_VideoController
    foreach ($monitor in $monitors) {
        if ($monitor.CurrentHorizontalResolution -gt 0 -and $monitor.CurrentVerticalResolution -gt 0) {
            Write-Output "$($monitor.CurrentHorizontalResolution),$($monitor.CurrentVerticalResolution)"
            exit 0
        }
    }
} catch {
    # Ignore errors and continue
}

# Default fallback
Write-Output "1920,1080"
exit 0 