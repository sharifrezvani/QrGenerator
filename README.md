# QR Code Generator

A comprehensive Node.js QR code generator with extensive customization options, including transparent backgrounds and advanced styling.

## Features

- **✨ Transparent Backgrounds**: Create QR codes with transparent backgrounds for overlays
- **🛡️ Multiple Error Correction Levels**: L (~7%), M (~15%), Q (~25%), H (~30%)  
- **📏 Size Customization**: Custom pixel dimensions, border width, QR versions 1-40
- **🎨 Advanced Colors**: Hex colors, named colors, or transparent backgrounds
- **🔶 Module Shapes**: Square modules or circular modules
- **💻 Dual Interfaces**: Interactive prompts or command-line arguments
- **📱 Terminal Preview**: Live QR display in your terminal
- **💾 PNG Export**: High-quality PNG files with transparency support
- **🌐 Web Version**: Included HTML version for browser use

## Installation

```bash
npm install
```

## Usage

### Interactive Mode (Recommended)
```bash
node qr-generator.js
# or
npm start
```

### Command Line Mode
```bash
# Basic usage
node qr-generator.js "https://example.com"

# Advanced customization
node qr-generator.js "https://github.com" \
  -e H \
  -s 400 \
  -f "#FF0000" \
  -b "transparent" \
  --module-shape circle \
  -o github-transparent.png
```

### Command Line Options

- `-e, --error-correction <level>`: Error correction (L/M/Q/H)
- `-s, --size <pixels>`: QR code size in pixels (default: 300)
- `-m, --margin <modules>`: Border margin in modules (default: 4) 
- `-f, --foreground-color <color>`: Foreground color (hex)
- `-b, --background-color <color>`: Background color (hex or "transparent")
- `--module-shape <shape>`: Module shape (square/circle)
- `--qr-version <number>`: QR version 1-40 (default: 1)
- `-o, --output <filename>`: Output filename (default: qrcode.png)
- `--no-terminal`: Skip terminal display
- `-i, --interactive`: Force interactive mode

## Examples

### Transparent QR Codes
```bash
# Transparent background with black modules
node qr-generator.js "https://example.com" -b transparent -o overlay.png

# Colored modules with transparent background
node qr-generator.js "Visit our site!" -f "#2196F3" -b transparent -o blue-transparent.png

# Circular modules with transparency
node qr-generator.js "https://github.com" -b transparent --module-shape circle -o round-transparent.png
```

### Styled QR Codes  
```bash
# High error correction with custom colors
node qr-generator.js "https://github.com" -e H -f "#FF5722" -b "#FFF3E0" -o orange-theme.png

# Large circular QR code
node qr-generator.js "Hello World" -s 500 --module-shape circle -f "#4CAF50" -o large-green-circles.png

# Compact QR with custom margin
node qr-generator.js "Short text" -s 200 -m 2 -f "#9C27B0" -b "#F3E5F5" -o compact-purple.png
```

## Web Version

Open `qr_generator.html` in your browser for a full-featured web interface with:
- Real-time preview
- All customization options
- Drag & drop image export
- Copy to clipboard functionality

## Technical Details

- **Dependencies**: qrcode, chalk, inquirer, commander, jimp
- **Image Processing**: Advanced styling with Jimp for transparency and shapes
- **Terminal Display**: Color-coded QR preview in console
- **Error Handling**: Comprehensive error messages and fallbacks
- **Performance**: Optimized for both small and large QR codes

## Supported Formats

- **Input**: URLs, text, any UTF-8 string
- **Output**: PNG files with full transparency support
- **Colors**: Hex codes (#FF0000), named colors, "transparent" keyword
- **Sizes**: 50px to 2000px recommended range