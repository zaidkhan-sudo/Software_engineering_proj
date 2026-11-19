const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsDir = path.resolve(__dirname, '../assets');
const pngPath = path.join(assetsDir, 'icon.png');
const iconsetDir = path.join(assetsDir, 'icon.iconset');
const icnsPath = path.join(assetsDir, 'icon.icns');
const icoPath = path.join(assetsDir, 'icon.ico');

// 1. Generate an SVG icon (civic landmark / courthouse symbol in deep blue #1E4FD8)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="220" fill="#1E4FD8"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" transform="translate(160, 160) scale(0.6875)">
    <!-- Classical Municipal Pediment & Columns -->
    <path d="M512 80 L960 320 L64 320 Z" fill="#FFFFFF"/>
    <rect x="128" y="320" width="768" height="64" fill="#FFFFFF"/>
    <!-- 4 Columns -->
    <rect x="160" y="440" width="80" height="360" rx="16" fill="#FFFFFF"/>
    <rect x="360" y="440" width="80" height="360" rx="16" fill="#FFFFFF"/>
    <rect x="584" y="440" width="80" height="360" rx="16" fill="#FFFFFF"/>
    <rect x="784" y="440" width="80" height="360" rx="16" fill="#FFFFFF"/>
    <!-- Base plinth -->
    <rect x="64" y="840" width="896" height="80" rx="20" fill="#FFFFFF"/>
  </g>
</svg>`;

const svgPath = path.join(assetsDir, 'temp_icon.svg');
fs.writeFileSync(svgPath, svgContent);

console.log('Generating macOS and Windows icon assets...');

try {
  // Use macOS qlmanage or sips or rsvg if available, or generate PNG via python/canvas/sips
  // In macOS, sips can convert image formats. Let's see if we can render the SVG or create PNG directly with python
  execSync(`python3 -c "
import urllib.request
# If PIL is available:
try:
    from PIL import Image, ImageDraw
    img = Image.new('RGBA', (1024, 1024), color=(30, 79, 216, 255))
    draw = ImageDraw.Draw(img)
    # Draw simple civic landmark
    draw.polygon([(512, 180), (840, 360), (184, 360)], fill=(255, 255, 255, 255))
    draw.rectangle([(200, 360), (824, 400)], fill=(255, 255, 255, 255))
    # Columns
    for x in [240, 400, 560, 720]:
        draw.rounded_rectangle([(x, 430), (x + 64, 760)], radius=10, fill=(255, 255, 255, 255))
    # Base
    draw.rounded_rectangle([(160, 780), (864, 840)], radius=12, fill=(255, 255, 255, 255))
    img.save('${pngPath}')
    print('Generated 1024x1024 icon.png via PIL')
except ImportError:
    # Fallback to minimal valid 1024x1024 PNG creation
    print('PIL not available, will use sips')
"`, { stdio: 'inherit' });
} catch (e) {
  console.log('Python PIL failed, creating via sips fallback');
}

// Check if icon.png exists; if not, create a placeholder PNG
if (!fs.existsSync(pngPath)) {
  // Create a minimal 1x1 png and scale it to 1024 with sips
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
  fs.writeFileSync(pngPath, Buffer.from(base64Png, 'base64'));
  execSync(`sips -z 1024 1024 "${pngPath}" --out "${pngPath}"`, { stdio: 'ignore' });
}

// Generate macOS .icns using iconutil
try {
  if (fs.existsSync(iconsetDir)) fs.rmSync(iconsetDir, { recursive: true, force: true });
  fs.mkdirSync(iconsetDir, { recursive: true });

  const appleSizes = [
    { name: 'icon_16x16.png', size: 16 },
    { name: 'icon_16x16@2x.png', size: 32 },
    { name: 'icon_32x32.png', size: 32 },
    { name: 'icon_32x32@2x.png', size: 64 },
    { name: 'icon_128x128.png', size: 128 },
    { name: 'icon_128x128@2x.png', size: 256 },
    { name: 'icon_256x256.png', size: 256 },
    { name: 'icon_256x256@2x.png', size: 512 },
    { name: 'icon_512x512.png', size: 512 },
    { name: 'icon_512x512@2x.png', size: 1024 }
  ];

  for (const item of appleSizes) {
    execSync(`sips -z ${item.size} ${item.size} "${pngPath}" --out "${path.join(iconsetDir, item.name)}"`, { stdio: 'ignore' });
  }

  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'ignore' });
  fs.rmSync(iconsetDir, { recursive: true, force: true });
  console.log('Successfully generated official macOS icon.icns via iconutil');
} catch (err) {
  console.log('iconutil failed, falling back:', err.message);
  fs.copyFileSync(pngPath, icnsPath);
}

// Create icon.ico placeholder
try {
  // A copy of png works for electron-builder if sips or ico tool is not present, or create valid ico
  fs.copyFileSync(pngPath, icoPath);
  console.log('Created icon.ico');
} catch (err) {
  console.log('Error creating ico', err);
}

if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
console.log('Icon assets ready in desktop/assets/');
