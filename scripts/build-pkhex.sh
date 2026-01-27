#!/bin/bash

# Build PKHeX.Everywhere WASM and copy to Next.js public folder
# Requires: .NET 9.0 SDK

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PKHEX_DIR="$PROJECT_ROOT/external/PKHeX.Everywhere"
OUTPUT_DIR="$PROJECT_ROOT/nxrthstack/public/pkhex"

echo "Building PKHeX.Everywhere..."

# Check if submodule exists
if [ ! -d "$PKHEX_DIR/src" ]; then
    echo "Initializing PKHeX.Everywhere submodule..."
    cd "$PROJECT_ROOT"
    git submodule update --init --recursive
fi

# Restore and build
cd "$PKHEX_DIR"
dotnet restore
cd src/PKHeX.Web
dotnet publish -c Release -o ../../publish

# Copy to public folder
echo "Copying to public/pkhex..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -r "$PKHEX_DIR/publish/wwwroot/"* "$OUTPUT_DIR/"

# Fix base href for subdirectory
sed -i 's|<base href="/"/>|<base href="/pkhex/"/>|g' "$OUTPUT_DIR/index.html"

echo "Done! PKHeX WASM files are now in public/pkhex/"
echo "Size: $(du -sh "$OUTPUT_DIR" | cut -f1)"
