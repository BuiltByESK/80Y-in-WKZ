const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const winWallpaper = require('win-wallpaper');

// Constants
const YEARS = 80;
const WEEKS_PER_YEAR = 52;
const DAYS_PER_WEEK = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Default screen dimensions (fallback)
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

// Adjust grid constants to be more dynamic
const GRID_MARGIN = 50;
const QUOTE_MARGIN = 80;

// Font definitions - system fonts with fallbacks
const FONTS = {
    title: '"Segoe UI Light", "Calibri Light", Arial, sans-serif',
    quote: 'Georgia, "Times New Roman", serif',
    attribution: '"Segoe UI", Calibri, Arial, sans-serif',
    labels: '"Segoe UI", Arial, sans-serif'
};

// Add better spacing for different resolutions
const SPACING_SCALE = {
    small: {
        minWidth: 0,
        circleRadiusPercent: 0.38, // Further reduced from 0.40
        cellPaddingPercent: 0.18,  // Increased from 0.15
        labelFrequency: 4,         // Every 4 weeks
    },
    medium: {
        minWidth: 1600,
        circleRadiusPercent: 0.40, // Further reduced from 0.42
        cellPaddingPercent: 0.18,  // Increased from 0.15
        labelFrequency: 4,
    },
    large: {
        minWidth: 2560,
        circleRadiusPercent: 0.42, // Further reduced from 0.44
        cellPaddingPercent: 0.18,  // Increased from 0.15
        labelFrequency: 4,
    },
    xl: {
        minWidth: 3440,
        circleRadiusPercent: 0.44, // Further reduced from 0.46
        cellPaddingPercent: 0.18,  // Increased from 0.15
        labelFrequency: 4,
    }
};

// Theme colors
const THEMES = {
    dark: {
        background: '#121110',
        pastWeeks: '#f5f1e6',
        currentWeek: '#e5c98a',
        futureWeeks: '#f0d090',
        text: '#ffffff',
        attribution: '#e5c98a',
        connectingLines: '#e5c98ac0',
        gridMarkers: '#e5c98a',
        yearLabels: '#e5c98a',
        weekLabels: '#e5c98a' // Changed from '#e5c98a80' to match year labels
    },
    light: {
        background: '#FDF7E3', // Aged parchment, soft beige
        pastWeeks: '#3B3024', // Burnt ink, dark brown-black
        currentWeek: '#C1A97B', // Changed to match futureWeeks color
        futureWeeks: '#C1A97B', // Faded bronze, subtle contrast
        text: '#5A4636', // Sepia-toned for warm legibility
        attribution: '#857C6D', // Dusty gray or light parchment ink
        connectingLines: '#C9B79F', // Light coffee line
        gridMarkers: '#C9B79F', // Light coffee line
        yearLabels: '#A89060', // Muted olive or bronze accent
        weekLabels: '#A89060' // Muted olive or bronze accent
    }
};

/**
 * Get appropriate sizing based on screen resolution
 * @param {number} width - Screen width
 * @returns {Object} Sizing configuration
 */
function getSizingForResolution(width) {
    // Find the right sizing based on screen width
    let sizing = SPACING_SCALE.small; // Default to small
    
    for (const size of Object.values(SPACING_SCALE)) {
        if (width >= size.minWidth) {
            sizing = size;
        } else {
            break;
        }
    }
    
    return sizing;
}

/**
 * Detect the screen resolution using PowerShell
 * @returns {Object} Screen dimensions {width, height}
 */
function detectScreenResolution() {
    try {
        // Check for test resolution environment variable
        const testResolution = process.env.TEST_RESOLUTION;
        if (testResolution) {
            const [width, height] = testResolution.split('x').map(Number);
            if (width > 0 && height > 0) {
                console.log(`TESTING MODE: Simulating screen resolution: ${width}x${height}`);
                return { width, height };
            }
        }
        
        console.log('Detecting screen resolution...');
        
        // Use the external PowerShell script for more reliable detection
        const scriptPath = path.join(__dirname, 'get_screen_resolution.ps1');
        
        if (!fs.existsSync(scriptPath)) {
            console.log('Resolution detection script not found, using defaults');
            return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
        }
        
        // Execute the PowerShell script
        const output = execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { encoding: 'utf8' }).trim();
        
        // Parse the output to get width and height
        const [width, height] = output.split(',').map(Number);
        
        if (width > 0 && height > 0) {
            console.log(`Detected screen resolution: ${width}x${height}`);
            return { width, height };
        } else {
            console.log('Failed to detect valid resolution, using defaults');
            return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
        }
    } catch (error) {
        console.error('Error detecting screen resolution:', error.message);
        console.log('Using default screen resolution');
        return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    }
}

/**
 * Scale elements based on screen resolution
 * @param {number} baseValue - Base value for standard resolution (1920x1080)
 * @param {number} screenWidth - Actual screen width
 * @returns {number} Scaled value
 */
function scaleForResolution(baseValue, screenWidth) {
    const scaleFactor = screenWidth / DEFAULT_WIDTH;
    return Math.max(1, Math.round(baseValue * scaleFactor));
}

/**
 * Load and parse the config.json file
 * @returns {Object} Configuration object
 */
function loadConfig() {
    const configPath = path.join(__dirname, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Calculate life position based on birthdate
 * @param {string} birthdate - Birthdate in YYYY-MM-DD format
 * @returns {Object} Life position information
 */
function calculateLifePosition(birthdate) {
    const birth = new Date(birthdate);
    const now = new Date();
    
    // Ensure we have the exact current week by calculating directly from dates
    // Get the first day of the birth year
    const birthYear = birth.getFullYear();
    const birthMonth = birth.getMonth();
    const birthDay = birth.getDate();
    
    // Create date objects for current birthday-year cycle
    const currentYearBirthday = new Date(now.getFullYear(), birthMonth, birthDay);
    const previousYearBirthday = new Date(now.getFullYear() - 1, birthMonth, birthDay);
    const nextYearBirthday = new Date(now.getFullYear() + 1, birthMonth, birthDay);
    
    // Determine which birthday we're measuring from (previous birthday)
    let cycleStart;
    if (now >= currentYearBirthday) {
        cycleStart = currentYearBirthday;
    } else {
        cycleStart = previousYearBirthday;
    }
    
    // Calculate next birthday
    const nextBirthday = now >= currentYearBirthday ? nextYearBirthday : currentYearBirthday;
    
    // Calculate weeks since last birthday
    const millisecondsSinceLastBirthday = now - cycleStart;
    const daysSinceLastBirthday = Math.floor(millisecondsSinceLastBirthday / MILLISECONDS_PER_DAY);
    const weeksSinceLastBirthday = Math.floor(daysSinceLastBirthday / DAYS_PER_WEEK);
    
    // Calculate total weeks lived (whole years + current year's weeks)
    const yearsSinceBirth = now.getFullYear() - birth.getFullYear() - (now < currentYearBirthday ? 1 : 0);
    const totalWeeksLived = (yearsSinceBirth * WEEKS_PER_YEAR) + weeksSinceLastBirthday;
    
    // Calculate weeks until next birthday
    const millisecondsUntilNextBirthday = nextBirthday - now;
    const daysUntilNextBirthday = Math.ceil(millisecondsUntilNextBirthday / MILLISECONDS_PER_DAY);
    const weeksUntilNextBirthday = Math.ceil(daysUntilNextBirthday / DAYS_PER_WEEK);
    
    // Calculate progress through current week
    const currentDayOfWeek = getCurrentDayOfWeek();
    const dayProgress = getDayProgress();
    const weekProgress = (currentDayOfWeek + dayProgress) / DAYS_PER_WEEK;
    
    return {
        totalWeeksLived,
        currentYearOfLife: yearsSinceBirth,
        currentWeekOfYear: weeksSinceLastBirthday,
        weekProgress,
        weeksUntilNextBirthday
    };
}

/**
 * Calculate current week number in the year (1-52)
 * @returns {number} Week number
 */
function getWeekOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil(diff / oneWeek);
}

/**
 * Get current day of week (0-6, where 0 is Monday)
 * @returns {number} Day of week
 */
function getCurrentDayOfWeek() {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, shift others down
}

/**
 * Calculate progress through current day (0.0-1.0)
 * @returns {number} Day progress
 */
function getDayProgress() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return (hours * 3600 + minutes * 60 + seconds) / (24 * 3600);
}

/**
 * Get theme colors based on config
 * @param {string} themeName - Theme name ('dark' or 'light')
 * @returns {Object} Theme colors
 */
function getTheme(themeName) {
    return THEMES[themeName] || THEMES.dark;
}

/**
 * Draw a circle with specified properties
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} radius - Circle radius
 * @param {Object} options - Drawing options
 */
function drawCircle(ctx, x, y, radius, options = {}) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (options.fill) {
        ctx.fillStyle = options.fill;
        ctx.fill();
    }
    
    if (options.stroke) {
        ctx.strokeStyle = options.stroke.color || '#000000';
        ctx.lineWidth = options.stroke.width || 1;
        ctx.stroke();
    }
}

/**
 * Calculate optimal cell size based on screen dimensions and grid size
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {Object} Cell size and padding information
 */
function calculateCellSize(width, height) {
    // Define the usable area (accounting for margins)
    const usableWidth = width * 0.85;  // Reduced from 95% to 85% of screen width
    const usableHeight = height * 0.75; // Reduced from 85% to 75% of screen height
    
    // Calculate cell size based on the limiting dimension (now years are columns, weeks are rows)
    const maxCellWidth = usableWidth / YEARS;        // 80 years wide
    const maxCellHeight = usableHeight / WEEKS_PER_YEAR; // 52 weeks tall
    
    // Use the smaller dimension to ensure grid fits
    let cellSize = Math.min(maxCellWidth, maxCellHeight);
    
    // Apply a slightly increased spacing factor (1.08x instead of 1.05x)
    cellSize = cellSize * 1.08;
    
    // Get size configuration based on resolution
    const sizing = getSizingForResolution(width);
    
    // Calculate circle radius based on cell size
    const circleRadius = Math.max(3, Math.round(cellSize * sizing.circleRadiusPercent));
    
    // Calculate spacing between circles
    const cellPadding = cellSize * sizing.cellPaddingPercent;
    
    return {
        cellSize,
        circleRadius,
        cellPadding,
        labelFrequency: sizing.labelFrequency
    };
}

/**
 * Generate the wallpaper image
 * @param {Object} lifePosition - Life position information
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} Path to generated image
 */
async function generateWallpaper(lifePosition, config) {
    // Get actual screen dimensions
    const screenDimensions = detectScreenResolution();
    const width = screenDimensions.width;
    const height = screenDimensions.height;
    
    // Calculate optimal cell size and circle radius
    const { cellSize, circleRadius, cellPadding, labelFrequency } = calculateCellSize(width, height);
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const theme = getTheme(config.theme);
    
    // Draw background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate grid dimensions - years are columns, weeks are rows (reversed from before)
    const gridWidth = YEARS * cellSize;
    const gridHeight = WEEKS_PER_YEAR * cellSize;
    
    // Position the grid higher on the screen
    const gridX = (width - gridWidth) / 2;
    const gridY = height * 0.08; // Moved up from 15% to 8% from top
    
    // No container box - removed for cleaner design
    
    // Select and draw quote
    const weekOfYear = getWeekOfYear();
    
    console.log('Debug - Week selection:');
    console.log('  Current week of year:', weekOfYear);
    console.log('  Current week of user life:', lifePosition.currentWeekOfYear);
    
    // Always use first quote (Tim Urban) for:
    // 1. First week of calendar year (week 1)
    // 2. First week after user's birthday (when lifePosition.currentWeekOfYear is 0)
    let quoteIndex;
    if (weekOfYear === 1 || lifePosition.currentWeekOfYear === 0) {
        console.log('  Using first quote (Tim Urban) because:', 
                  weekOfYear === 1 ? 'It is the first week of the year' : 
                  'It is the first week after your birthday');
        quoteIndex = 0; // First quote in the array (Tim Urban)
    } else {
        quoteIndex = (weekOfYear - 1) % config.quotes.length;
        console.log(`  Using quote #${quoteIndex + 1} based on week of year (${weekOfYear})`);
    }
    
    const quote = config.quotes[quoteIndex];
    const attribution = config.attributions[quoteIndex];
    console.log(`  Selected quote: "${quote}" — ${attribution}`);
    
    // Calculate font sizes based on screen width with improved scaling
    const quoteFontSize = scaleForResolution(24, width);
    const attributionFontSize = scaleForResolution(12, width);
    
    // Calculate marker sizes with improved scaling - making both markers the same size
    const markerSize = scaleForResolution(14, width); // Unified size for both year and week markers
    
    // Calculate positions of all elements
    // Year markers are positioned at gridY - scaleForResolution(10, width)
    const yearMarkersY = gridY - scaleForResolution(10, width);
    
    // First calculate the quote position with adequate spacing from year markers
    const totalSpacing = scaleForResolution(35, width); // Total space between year markers and quote
    const quoteY = yearMarkersY - totalSpacing;
    
    // Position attribution in the middle between year markers and quote
    const attributionY = yearMarkersY - (totalSpacing / 2) + (attributionFontSize / 4);
    
    // Draw year markers (decades) at the top of the grid
    ctx.fillStyle = theme.yearLabels;
    ctx.globalAlpha = 0.7; // Match week marker opacity
    ctx.font = `${markerSize}px ${FONTS.labels}`;
    ctx.textAlign = 'center';
    
    // Position each decade marker (every 10 years)
    for (let decade = 1; decade <= 8; decade++) {
        const decadeYear = decade * 10;
        // Adjust x position to align with the center of the circles
        const x = gridX + ((decadeYear - 0.5) * cellSize);
        
        // Year number text with slight vertical adjustment for consistency
        ctx.fillText(`${decadeYear}`, x, yearMarkersY + 3);
    }
    
    // Draw week markers to the left of the grid
    ctx.fillStyle = theme.weekLabels;
    ctx.globalAlpha = 0.7;
    ctx.font = `${markerSize}px ${FONTS.labels}`;
    ctx.textAlign = 'right';
    
    // Position week markers every 4 weeks
    for (let week = 4; week <= WEEKS_PER_YEAR; week += labelFrequency) {
        const y = gridY + ((week - 1) * cellSize) + (cellSize / 2);
        
        // Week number text
        ctx.fillText(`${week}`, gridX - scaleForResolution(10, width), y + 3);
    }
    
    // Reset opacity for grid
    ctx.globalAlpha = 1.0;
    
    // Draw grid - now 80 years wide and 52 weeks tall
    for (let week = 0; week < WEEKS_PER_YEAR; week++) {
        for (let year = 0; year < YEARS; year++) {
            const x = gridX + (year * cellSize) + (cellSize / 2);
            const y = gridY + (week * cellSize) + (cellSize / 2);
            
            // Calculate current position in the rotated grid
            const currentPosition = year * WEEKS_PER_YEAR + week;
            const isPastWeek = currentPosition < lifePosition.totalWeeksLived;
            const isCurrentWeek = currentPosition === lifePosition.totalWeeksLived;
            
            // Draw circles based on time
            if (isPastWeek) {
                // Past weeks
                ctx.fillStyle = theme.pastWeeks;
                ctx.beginPath();
                ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
                ctx.fill();
            } else if (isCurrentWeek) {
                // Current week - empty circle with thick border
                ctx.strokeStyle = theme.currentWeek;
                ctx.lineWidth = 4; // Increased from 3px to 4px to make it stand out more
                ctx.beginPath();
                ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Future weeks (outline only)
                ctx.strokeStyle = theme.futureWeeks;
                ctx.lineWidth = 1; // Thinner lines for future weeks
                ctx.beginPath();
                ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    // Draw quote after grid to ensure it's on top
    ctx.fillStyle = theme.text;
    ctx.font = `${quoteFontSize}px ${FONTS.quote}`;
    ctx.textAlign = 'center';
    ctx.fillText(quote, width / 2, quoteY);
    
    // Draw attribution
    ctx.fillStyle = theme.attribution;
    ctx.font = `italic ${attributionFontSize}px ${FONTS.attribution}`;
    ctx.fillText(`— ${attribution}`, width / 2, attributionY);
    
    // Add Tim Urban attribution centered below the grid
    const urbanCreditFontSize = Math.max(scaleForResolution(12, width), 10);
    ctx.font = `${urbanCreditFontSize}px "Georgia", "Garamond", "Source Serif Pro", serif`;
    
    // Use appropriate color based on theme
    const creditColor = config.theme === 'dark' ? '#B08D57' : '#4C3A2C'; // Dark chocolate serif for light theme
    ctx.fillStyle = creditColor;
    ctx.globalAlpha = 0.9;
    
    // Position it below the grid with spacing that scales with the grid size
    const gridBottom = gridY + gridHeight;
    // Calculate the space between grid bottom and screen bottom
    const spaceBelow = height - gridBottom;
    // Position the attribution at roughly 1/3 of the space between grid and bottom of screen
    // (closer to the grid than to the bottom)
    const urbanCreditY = gridBottom + (spaceBelow * 0.33);
    ctx.textAlign = 'center';
    ctx.fillText("Inspired by Tim Urban's 'Your Life in Weeks' — waitbutwhy.com", width / 2, urbanCreditY);
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
    
    // Save image in current directory
    const outputPath = path.join(process.cwd(), 'life_calendar_wallpaper.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Wallpaper saved to: ${outputPath} (${width}x${height})`);
    return outputPath;
}

/**
 * Set the Windows wallpaper
 * @param {string} imagePath - Path to the wallpaper image
 */
function setWallpaper(imagePath) {
    try {
        const absolutePath = path.resolve(imagePath);
        console.log('Setting wallpaper from:', absolutePath);
        
        // Verify the image exists
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Wallpaper image not found at: ${absolutePath}`);
        }

        // Use win-wallpaper to set the wallpaper
        console.log('Using win-wallpaper to set wallpaper...');
        winWallpaper.set(absolutePath);
        
        console.log('Wallpaper set successfully');
    } catch (error) {
        console.error('Error setting wallpaper:', error.message);
        throw error;
    }
}

/**
 * Main function to generate and set wallpaper
 */
async function main() {
    try {
        console.log('Loading configuration...');
        const config = loadConfig();
        
        // Check for test mode with future date simulation
        const testDate = process.env.TEST_DATE;
        if (testDate) {
            console.log(`TESTING MODE: Simulating date: ${testDate}`);
            // Mock the Date object for testing
            const originalDate = global.Date;
            const mockDate = new Date(testDate);
            
            // Override Date constructor
            global.Date = class extends originalDate {
                constructor(...args) {
                    if (args.length === 0) {
                        return mockDate; // Return the test date when called with no args
                    }
                    return new originalDate(...args);
                }
                
                // Ensure static methods work correctly
                static now() {
                    return mockDate.getTime();
                }
            };
            
            // Restore the original after 5 seconds to prevent memory leaks
            setTimeout(() => {
                global.Date = originalDate;
                console.log('TEST MODE: Restored original Date object');
            }, 5000);
        }
        
        // Check for multi-resolution test mode
        const testMultiRes = process.env.TEST_MULTIPLE_RESOLUTIONS;
        if (testMultiRes === 'true') {
            console.log('TESTING MODE: Testing multiple resolutions');
            
            // Top 10 most common screen resolutions globally
            const resolutions = [
                { width: 1920, height: 1080, name: 'Full HD (Rank #1)' },
                { width: 1366, height: 768, name: 'Laptop (Rank #2)' },
                { width: 1536, height: 864, name: 'Mid-range Laptop (Rank #3)' },
                { width: 1440, height: 900, name: 'MacBook (Rank #4)' },
                { width: 1280, height: 720, name: 'HD (Rank #5)' },
                { width: 1600, height: 900, name: 'Mid-tier Laptop (Rank #6)' },
                { width: 2560, height: 1440, name: 'QHD (Rank #7)' },
                { width: 1360, height: 768, name: 'Old Laptop (Rank #8)' },
                { width: 1024, height: 768, name: 'Legacy 4:3 (Rank #9)' },
                { width: 1680, height: 1050, name: 'Widescreen (Rank #10)' }
            ];
            
            // Create output directory if it doesn't exist
            const resolutionTestDir = path.join(process.cwd(), 'resolution_tests');
            if (!fs.existsSync(resolutionTestDir)) {
                fs.mkdirSync(resolutionTestDir);
            }
            
            // Generate wallpapers for each resolution
            console.log('Generating test wallpapers for multiple resolutions...');
            for (const res of resolutions) {
                // Override resolution detection
                process.env.TEST_RESOLUTION = `${res.width}x${res.height}`;
                
                console.log(`Testing ${res.name} (${res.width}x${res.height})...`);
                
                // Calculate life position
                const lifePosition = calculateLifePosition(config.birthdate);
                
                // Generate wallpaper with custom naming
                const canvas = createCanvas(res.width, res.height);
                const ctx = canvas.getContext('2d');
                const theme = getTheme(config.theme);
                
                // Get optimal sizing for this resolution
                const { cellSize, circleRadius } = calculateCellSize(res.width, res.height);
                
                // Add resolution info to the image
                ctx.fillStyle = theme.background;
                ctx.fillRect(0, 0, res.width, res.height);
                
                // Generate wallpaper
                await generateWallpaper(lifePosition, config);
                
                // Rename the file for this resolution
                const resFileName = `life_calendar_${res.width}x${res.height}.png`;
                const resFilePath = path.join(resolutionTestDir, resFileName);
                
                // Copy the generated file to the resolution test directory
                fs.copyFileSync(
                    path.join(process.cwd(), 'life_calendar_wallpaper.png'),
                    resFilePath
                );
                
                console.log(`Saved test wallpaper: ${resFilePath}`);
            }
            
            console.log('Multi-resolution test completed!');
            console.log(`Test wallpapers saved to: ${resolutionTestDir}`);
            
            // Clear the override
            process.env.TEST_RESOLUTION = '';
            
            return;
        }
        
        console.log('Calculating life position...');
        const lifePosition = calculateLifePosition(config.birthdate);
        console.log('Current life position:', {
            totalWeeksLived: lifePosition.totalWeeksLived,
            currentYearOfLife: lifePosition.currentYearOfLife,
            currentWeekOfYear: lifePosition.currentWeekOfYear,
            weeksUntilNextBirthday: lifePosition.weeksUntilNextBirthday
        });
        
        console.log('Generating wallpaper...');
        const wallpaperPath = await generateWallpaper(lifePosition, config);
        
        console.log('Setting wallpaper...');
        setWallpaper(wallpaperPath);
        
        console.log('Done! Your life calendar wallpaper has been set.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

// Export functions for testing
module.exports = {
    loadConfig,
    calculateLifePosition,
    getWeekOfYear,
    getCurrentDayOfWeek,
    getDayProgress,
    getTheme,
    generateWallpaper,
    setWallpaper
}; 