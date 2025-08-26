#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

import { existsSync, rmSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync, createWriteStream } from 'fs';
import { join } from 'path';

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
  if (existsSync(BUILD_DIR)) {
    console.log('🧹 Cleaning existing build directory...');
    rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  
  console.log('📁 Creating build directory...');
  mkdirSync(BUILD_DIR, { recursive: true });
}

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const items = readdirSync(src);
  
  for (const item of items) {
    const srcPath = join(src, item);
    const destPath = join(dest, item);
    
    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
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
    const filePath = join(BUILD_DIR, file);
    
    if (existsSync(filePath)) {
      console.log(`  📝 Updating ${file}...`);
      let content = readFileSync(filePath, 'utf8');
      content = replaceUrls(content);
      writeFileSync(filePath, content);
    } else {
      console.log(`  ⚠️  Warning: ${file} not found in build directory`);
    }
  }
}

// Create production manifest
function updateManifest() {
  const manifestPath = join(BUILD_DIR, 'manifest.json');
  
  if (existsSync(manifestPath)) {
    console.log('📋 Updating manifest.json...');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    // Keep version clean for extension loading
    // manifest.version stays the same
    manifest.description = `${manifest.description} (Production Build)`;
    
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
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
  
  const buildInfoPath = join(BUILD_DIR, 'BUILD_INFO.json');
  writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('📊 Created BUILD_INFO.json');
}

// Create zip file
function createZip() {
  console.log('📦 Creating zip file...');
  const archiver = require('archiver');
  const output = createWriteStream(`${BUILD_DIR}.zip`);
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
    if (!existsSync(SOURCE_DIR)) {
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
