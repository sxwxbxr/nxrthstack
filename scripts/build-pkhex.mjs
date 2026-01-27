#!/usr/bin/env node

/**
 * Cross-platform build script for PKHeX.NxrthStack WASM
 * Works on Windows, Linux, macOS, and Vercel
 * Requires: .NET 9.0 SDK
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const blazorDir = join(projectRoot, 'pkhex-blazor');
const webProjectDir = join(blazorDir, 'src', 'PKHeX.NxrthStack.Web');
const outputDir = join(projectRoot, 'nxrthstack', 'public', 'pkhex');

// Check for .NET in home directory (Vercel installs here)
const homeDotnet = join(homedir(), '.dotnet');
const dotnetPath = existsSync(join(homeDotnet, 'dotnet')) ? join(homeDotnet, 'dotnet') : 'dotnet';

// Set up environment for Vercel
const env = { ...process.env };
if (existsSync(homeDotnet)) {
  env.DOTNET_ROOT = homeDotnet;
  env.PATH = `${homeDotnet}${process.platform === 'win32' ? ';' : ':'}${env.PATH}`;
}

function run(cmd, cwd = process.cwd()) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', env });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

function checkDotnet() {
  try {
    const version = execSync(`"${dotnetPath}" --version`, { encoding: 'utf-8', env }).trim();
    const major = parseInt(version.split('.')[0]);
    if (major < 9) {
      console.warn(`WARNING: .NET ${version} detected. .NET 9.0+ is recommended.`);
    }
    console.log(`Found .NET SDK version: ${version}`);
    return true;
  } catch {
    console.warn('WARNING: .NET SDK not found. PKHeX WASM will not be built.');
    console.warn('Install .NET 9.0 SDK from https://dotnet.microsoft.com/download');
    return false;
  }
}

function createPlaceholderPage() {
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
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; padding: 2rem; max-width: 500px; }
    h1 { color: #a855f7; margin-bottom: 1rem; }
    p { color: #a1a1aa; margin: 0.5rem 0; }
    code { background: #171717; padding: 0.5rem 1rem; border-radius: 0.5rem; display: block; margin: 1rem 0; color: #fafafa; }
    a { color: #a855f7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>PKHeX Save Editor</h1>
    <p>The PKHeX WASM build is not available.</p>
    <p>To build it locally, install .NET 9.0 SDK and run:</p>
    <code>npm run build:pkhex</code>
    <p>Or visit <a href="https://pkhex-web.github.io">pkhex-web.github.io</a> directly.</p>
  </div>
</body>
</html>
  `.trim());
}

async function main() {
  console.log('Building PKHeX.NxrthStack WASM...\n');

  // Check for .NET SDK
  if (!checkDotnet()) {
    createPlaceholderPage();
    return;
  }

  // Check if Blazor project exists
  if (!existsSync(join(webProjectDir, 'PKHeX.NxrthStack.Web.csproj'))) {
    console.error('ERROR: Blazor project not found at', webProjectDir);
    console.error('Make sure the pkhex-blazor directory exists with the solution.');
    createPlaceholderPage();
    return;
  }

  // Restore dependencies
  console.log('\nRestoring NuGet packages...');
  run(`"${dotnetPath}" restore`, blazorDir);

  // Build and publish
  console.log('\nPublishing Blazor WASM...');
  run(`"${dotnetPath}" publish -c Release -o "${join(blazorDir, 'publish')}"`, webProjectDir);

  // Copy to public folder
  console.log('\nCopying to public/pkhex...');
  const publishDir = join(blazorDir, 'publish', 'wwwroot');

  if (!existsSync(publishDir)) {
    console.error('ERROR: Publish output not found at', publishDir);
    process.exit(1);
  }

  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });
  cpSync(publishDir, outputDir, { recursive: true });

  // Fix base href for subdirectory serving
  const indexPath = join(outputDir, 'index.html');
  if (existsSync(indexPath)) {
    let indexContent = readFileSync(indexPath, 'utf-8');
    indexContent = indexContent.replace('<base href="/" />', '<base href="/pkhex/" />');
    indexContent = indexContent.replace('<base href="/"/>', '<base href="/pkhex/"/>');
    writeFileSync(indexPath, indexContent);
  }

  console.log('\n✓ Done! PKHeX WASM files are now in public/pkhex/');
  console.log('  Run "npm run dev" to test the editor.');
}

main().catch(console.error);
