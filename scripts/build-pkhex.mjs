#!/usr/bin/env node

/**
 * Cross-platform build script for PKHeX.Everywhere WASM
 * Works on Windows, Linux, and macOS
 * Requires: .NET 9.0 SDK
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const pkhexDir = join(projectRoot, 'external', 'PKHeX.Everywhere');
const outputDir = join(projectRoot, 'nxrthstack', 'public', 'pkhex');

function run(cmd, cwd = process.cwd()) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

function checkDotnet() {
  try {
    const version = execSync('dotnet --version', { encoding: 'utf-8' }).trim();
    console.log(`Found .NET SDK version: ${version}`);
    return true;
  } catch {
    console.warn('WARNING: .NET SDK not found. PKHeX WASM will not be built.');
    console.warn('Install .NET 9.0 SDK from https://dotnet.microsoft.com/download');
    return false;
  }
}

async function main() {
  console.log('Building PKHeX.Everywhere WASM...\n');

  // Check for .NET SDK
  if (!checkDotnet()) {
    // Create placeholder page if .NET is not available
    console.log('Creating placeholder page...');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(join(outputDir, 'index.html'), `
<!DOCTYPE html>
<html>
<head>
  <title>PKHeX Editor - Build Required</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
    .container { text-align: center; padding: 2rem; }
    h1 { color: #a855f7; }
    code { background: #333; padding: 0.5rem 1rem; border-radius: 0.5rem; display: block; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>PKHeX Editor</h1>
    <p>The PKHeX WASM build is not available.</p>
    <p>To build it locally, install .NET 9.0 SDK and run:</p>
    <code>npm run build:pkhex</code>
    <p>Or visit <a href="https://pkhex-web.github.io" style="color: #a855f7;">pkhex-web.github.io</a> directly.</p>
  </div>
</body>
</html>
    `.trim());
    return;
  }

  // Check if submodule exists
  if (!existsSync(join(pkhexDir, 'src'))) {
    console.log('Initializing PKHeX.Everywhere submodule...');
    run('git submodule update --init --recursive', projectRoot);
  }

  // Restore dependencies
  console.log('\nRestoring NuGet packages...');
  run('dotnet restore', pkhexDir);

  // Build PKHeX.Web
  console.log('\nBuilding PKHeX.Web...');
  const webProjectDir = join(pkhexDir, 'src', 'PKHeX.Web');
  run('dotnet publish -c Release -o ../../publish', webProjectDir);

  // Copy to public folder
  console.log('\nCopying to public/pkhex...');
  const publishDir = join(pkhexDir, 'publish', 'wwwroot');

  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });
  cpSync(publishDir, outputDir, { recursive: true });

  // Fix base href for subdirectory
  const indexPath = join(outputDir, 'index.html');
  let indexContent = readFileSync(indexPath, 'utf-8');
  indexContent = indexContent.replace('<base href="/"/>', '<base href="/pkhex/"/>');
  writeFileSync(indexPath, indexContent);

  console.log('\nDone! PKHeX WASM files are now in public/pkhex/');
}

main().catch(console.error);
