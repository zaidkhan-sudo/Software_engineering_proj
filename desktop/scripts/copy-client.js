const fs = require('fs');
const path = require('path');

const clientDist = path.resolve(__dirname, '../../client/dist');
const desktopDist = path.resolve(__dirname, '../dist');

console.log(`Copying built client assets from:\n  ${clientDist}\nto:\n  ${desktopDist}`);

if (!fs.existsSync(clientDist)) {
  console.error(`\nError: client build directory not found at ${clientDist}`);
  console.error('Please run "npm run build" in the client directory first.');
  process.exit(1);
}

// Clean target directory
if (fs.existsSync(desktopDist)) {
  fs.rmSync(desktopDist, { recursive: true, force: true });
}

fs.mkdirSync(desktopDist, { recursive: true });
fs.cpSync(clientDist, desktopDist, { recursive: true });

console.log('Successfully copied client assets into desktop/dist.');
