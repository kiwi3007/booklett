#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get version from command line argument or increment patch version
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Please provide a version number. Usage: node update-version.js 1.0.1');
  process.exit(1);
}

// Update version.ts
const versionFile = path.join(__dirname, 'src', 'app', 'version.ts');
const versionContent = `/**
 * Application version
 * Update this when deploying new versions to force PWA updates
 */
export const APP_VERSION = '${newVersion}';
export const BUILD_DATE = new Date().toISOString();
`;

fs.writeFileSync(versionFile, versionContent);
console.log(`✅ Updated version.ts to ${newVersion}`);

// Update ngsw-config.json
const ngswConfigPath = path.join(__dirname, 'ngsw-config.json');
const ngswConfig = JSON.parse(fs.readFileSync(ngswConfigPath, 'utf8'));
ngswConfig.appData.version = newVersion;
fs.writeFileSync(ngswConfigPath, JSON.stringify(ngswConfig, null, 2) + '\n');
console.log(`✅ Updated ngsw-config.json to ${newVersion}`);

// Update package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ Updated package.json to ${newVersion}`);

console.log(`\n🎉 Version updated to ${newVersion}`);
console.log('Remember to build and deploy the app for the update to take effect.');
