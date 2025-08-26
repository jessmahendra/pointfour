#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = './browser-extension';
const BUILD_DIR = './browser-extension-production';
const PRODUCTION_URL = 'https://pointfour.in';
const LOCALHOST_URL = 'http://localhost:3000';

// Files that need URL replacement
const FILES_TO_UPDATE = [
  'background.js',
  'content-script.js',
  'popup.js',
  'settings.js'
];

console.log('🚀 Building production extension...');
console.log(`📁 Source: ${SOURCE_DIR}`);
console.log(`📁 Build: ${BUILD_DIR}`);
console.log(`🔗 Production URL: ${PRODUCTION_URL}`);

// Clean and create build directory
function cleanBuildDir() {
  if (fs.existsSync(BUILD_DIR)) {
    console.log('🧹 Cleaning existing build directory...');
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  
  console.log('📁 Creating build directory...');
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Replace URLs in file content
function replaceUrls(content) {
  return content.replace(new RegExp(LOCALHOST_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), PRODUCTION_URL);
}

// Update files with production URLs
function updateFiles() {
  console.log('🔄 Updating files with production URLs...');
  
  for (const file of FILES_TO_UPDATE) {
    const filePath = path.join(BUILD_DIR, file);
    
    if (fs.existsSync(filePath)) {
      console.log(`  📝 Updating ${file}...`);
      let content = fs.readFileSync(filePath, 'utf8');
      content = replaceUrls(content);
      fs.writeFileSync(filePath, content);
    } else {
      console.log(`  ⚠️  Warning: ${file} not found in build directory`);
    }
  }
}

// Create production manifest
function updateManifest() {
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    console.log('📋 Updating manifest.json...');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Update version to indicate it's a production build
    manifest.version = `${manifest.version}`;
    manifest.description = `${manifest.description} (Production Build)`;
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

// Create build info file
function createBuildInfo() {
  const buildInfo = {
    buildDate: new Date().toISOString(),
    productionUrl: PRODUCTION_URL,
    sourceVersion: require('./package.json').version,
    buildType: 'production'
  };
  
  const buildInfoPath = path.join(BUILD_DIR, 'BUILD_INFO.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('📊 Created BUILD_INFO.json');
}

// Create zip file
function createZip() {
  console.log('📦 Creating zip file...');
  const archiver = require('archiver');
  const output = fs.createWriteStream(`${BUILD_DIR}.zip`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`📦 Created ${BUILD_DIR}.zip (${size} MB)`);
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(BUILD_DIR, false);
    archive.finalize();
  });
}

// Main build process
async function build() {
  try {
    // Check if source directory exists
    if (!fs.existsSync(SOURCE_DIR)) {
      console.error(`❌ Error: Source directory '${SOURCE_DIR}' not found!`);
      console.log('💡 Make sure you\'re running this script from the fashion-recommendations directory');
      process.exit(1);
    }
    
    cleanBuildDir();
    copyDirectory(SOURCE_DIR, BUILD_DIR);
    updateFiles();
    updateManifest();
    createBuildInfo();
    
    // Create zip file (archiver is required)
    await createZip();
    
    console.log('\n✅ Production extension build complete!');
    console.log(`📁 Build directory: ${BUILD_DIR}`);
    console.log(`📦 Zip file: ${BUILD_DIR}.zip`);
    console.log(`🔗 Production URL: ${PRODUCTION_URL}`);
    console.log('\n📋 Next steps:');
    console.log('1. Test the extension in the build directory');
    console.log('2. Send the zip file to friends');
    console.log('3. They can load it as an unpacked extension');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
build();
