#!/usr/bin/env node
const QRCode = require('qrcode');
const chalk = require('chalk');
const { program } = require('commander');
const inquirer = require('inquirer');
const Jimp = require('jimp');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

class AdvancedQRGenerator {
    constructor() {
        this.errorLevels = {
            'L': 'low',
            'M': 'medium', 
            'Q': 'quartile',
            'H': 'high'
        };
    }

    // Convert hex color to RGB array
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    // Convert RGB array to hex color
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Invert a color
    invertColor(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHex(255 - rgb[0], 255 - rgb[1], 255 - rgb[2]);
    }

    // Generate QR code with options
    async generateQR(data, options = {}) {
        const foregroundColor = options.foregroundColor || '#000000';
        const backgroundColorToUse = options.transparent ? 
            this.invertColor(foregroundColor) : 
            (options.backgroundColor || '#FFFFFF');

        const qrOptions = {
            errorCorrectionLevel: options.errorCorrection || 'M',
            type: 'png',
            quality: 0.92,
            margin: options.margin || 4,
            color: {
                dark: foregroundColor,
                light: backgroundColorToUse
            },
            width: options.size || 300
        };

        if (options.version && options.version > 1) {
            qrOptions.version = options.version;
        }

        try {
            // Generate QR code buffer
            const buffer = await QRCode.toBuffer(data, qrOptions);
            
            // Apply transparency or advanced styling if requested
            if (options.transparent || (options.moduleShape && options.moduleShape !== 'square')) {
                return await this.applyAdvancedStyling(buffer, options, backgroundColorToUse);
            }
            
            return buffer;
        } catch (error) {
            throw new Error(`QR generation failed: ${error.message}`);
        }
    }

    // Apply advanced styling including transparency and custom shapes  
    async applyAdvancedStyling(buffer, options, actualBackgroundColor) {
        try {
            return new Promise((resolve, reject) => {
                const png = new PNG();
                
                png.parse(buffer, (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    
                    const { width, height } = data;
                    const foregroundRgb = this.hexToRgb(options.foregroundColor || '#000000');
                    const backgroundRgb = this.hexToRgb(actualBackgroundColor);
                    
                    // Process each pixel
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const idx = (width * y + x) << 2;
                            
                            const r = data.data[idx];
                            const g = data.data[idx + 1]; 
                            const b = data.data[idx + 2];
                            
                            // Calculate distance to foreground and background colors
                            const fgDistance = Math.sqrt(
                                Math.pow(r - foregroundRgb[0], 2) + 
                                Math.pow(g - foregroundRgb[1], 2) + 
                                Math.pow(b - foregroundRgb[2], 2)
                            );
                            
                            const bgDistance = Math.sqrt(
                                Math.pow(r - backgroundRgb[0], 2) + 
                                Math.pow(g - backgroundRgb[1], 2) + 
                                Math.pow(b - backgroundRgb[2], 2)
                            );
                            
                            // Determine if pixel is closer to foreground or background
                            if (fgDistance < bgDistance) {
                                // This is a QR module - set to foreground color and make opaque
                                data.data[idx] = foregroundRgb[0];     // R
                                data.data[idx + 1] = foregroundRgb[1]; // G
                                data.data[idx + 2] = foregroundRgb[2]; // B
                                data.data[idx + 3] = 255;             // A (opaque)
                            } else {
                                // This is background
                                if (options.transparent) {
                                    // Make background pixels transparent
                                    data.data[idx] = 0;       // R
                                    data.data[idx + 1] = 0;   // G
                                    data.data[idx + 2] = 0;   // B
                                    data.data[idx + 3] = 0;   // A (transparent)
                                } else {
                                    // Keep background color
                                    data.data[idx] = backgroundRgb[0];     // R
                                    data.data[idx + 1] = backgroundRgb[1]; // G  
                                    data.data[idx + 2] = backgroundRgb[2]; // B
                                    data.data[idx + 3] = 255;             // A (opaque)
                                }
                            }
                        }
                    }
                    
                    const outputBuffer = PNG.sync.write(data);
                    resolve(outputBuffer);
                });
            });
            
        } catch (error) {
            console.error(chalk.red(`Transparency processing error: ${error.message}`));
            console.log(chalk.yellow('Falling back to standard QR generation...'));
            return buffer;
        }
    }

    // Display QR in terminal
    displayTerminal(data, options = {}) {
        return new Promise((resolve, reject) => {
            QRCode.toString(data, {
                type: 'terminal',
                errorCorrectionLevel: options.errorCorrection || 'M',
                small: options.compact || false
            }, (err, string) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(chalk.cyan('\n📱 QR Code (Terminal View):'));
                    console.log('═'.repeat(50));
                    console.log(string);
                    console.log('═'.repeat(50));
                    resolve();
                }
            });
        });
    }

    // Save QR code to file
    async saveQR(buffer, filename, format = 'png') {
        try {
            const ext = path.extname(filename) || `.${format}`;
            const fullPath = path.resolve(filename.replace(/\.[^/.]+$/, '') + ext);
            
            fs.writeFileSync(fullPath, buffer);
            console.log(chalk.green(`✅ QR code saved: ${fullPath}`));
            return fullPath;
        } catch (error) {
            throw new Error(`Failed to save file: ${error.message}`);
        }
    }

    // Get QR code information
    getQRInfo(data, options) {
        const dataLength = data.length;
        const estimatedVersion = Math.min(Math.ceil(dataLength / 25), 40);
        
        console.log(chalk.blue('\n📊 QR Code Information:'));
        console.log('─'.repeat(30));
        console.log(`${chalk.yellow('Data:')} ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`);
        console.log(`${chalk.yellow('Length:')} ${dataLength} characters`);
        console.log(`${chalk.yellow('Error Correction:')} ${options.errorCorrection || 'M'} (${this.errorLevels[options.errorCorrection || 'M']})`);
        console.log(`${chalk.yellow('Size:')} ${options.size || 300}x${options.size || 300} pixels`);
        console.log(`${chalk.yellow('Margin:')} ${options.margin || 4} modules`);
        console.log(`${chalk.yellow('Colors:')} ${options.foregroundColor || '#000000'} / ${options.transparent ? 'transparent' : (options.backgroundColor || '#FFFFFF')}`);
        console.log(`${chalk.yellow('Module Shape:')} ${options.moduleShape || 'square'}`);
        console.log(`${chalk.yellow('Estimated Version:')} ${estimatedVersion}`);
    }
}

// Interactive mode
async function interactiveMode() {
    console.log(chalk.cyan.bold('\n🚀 QR Code Generator - Interactive Mode'));
    console.log(chalk.gray('═'.repeat(50)));

    const generator = new AdvancedQRGenerator();

    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'data',
                message: '🔗 Enter URL or text to encode:',
                default: 'https://example.com',
                validate: input => input.trim() !== '' || 'Please enter some data'
            },
            {
                type: 'list',
                name: 'errorCorrection',
                message: '🛡️ Error correction level:',
                choices: [
                    { name: 'Low (~7% recovery)', value: 'L' },
                    { name: 'Medium (~15% recovery)', value: 'M' },
                    { name: 'Quartile (~25% recovery)', value: 'Q' },
                    { name: 'High (~30% recovery)', value: 'H' }
                ],
                default: 'M'
            },
            {
                type: 'number',
                name: 'size',
                message: '📏 QR code size (pixels):',
                default: 300,
                validate: input => input > 50 && input <= 2000 || 'Size must be between 50 and 2000 pixels'
            },
            {
                type: 'number',
                name: 'margin',
                message: '🔲 Border margin (modules):',
                default: 4,
                validate: input => input >= 1 && input <= 20 || 'Margin must be between 1 and 20 modules'
            },
            {
                type: 'input',
                name: 'foregroundColor',
                message: '🎨 Foreground color (hex or name):',
                default: '#000000',
                filter: input => input.startsWith('#') ? input : `#${input.replace('#', '')}`
            },
            {
                type: 'input',
                name: 'backgroundColor',
                message: '🎨 Background color (hex, name, or "transparent"):',
                default: '#FFFFFF',
                filter: input => {
                    if (input.toLowerCase() === 'transparent') return 'transparent';
                    return input.startsWith('#') ? input : `#${input.replace('#', '')}`;
                }
            },
            {
                type: 'list',
                name: 'moduleShape',
                message: '🔶 Module shape:',
                choices: ['square', 'circle'],
                default: 'square'
            },
            {
                type: 'number',
                name: 'version',
                message: '🔢 QR version (1-40, 0 for auto):',
                default: 0,
                validate: input => input >= 0 && input <= 40 || 'Version must be between 0 and 40'
            },
            {
                type: 'confirm',
                name: 'showTerminal',
                message: '🖥️ Display in terminal?',
                default: true
            },
            {
                type: 'confirm',
                name: 'saveFile',
                message: '💾 Save to file?',
                default: true
            }
        ]);

        if (answers.saveFile) {
            const fileAnswer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'filename',
                    message: '📁 Filename:',
                    default: 'qrcode.png'
                }
            ]);
            answers.filename = fileAnswer.filename;
        }

        // Generate QR code
        console.log(chalk.yellow('\n⏳ Generating QR code...'));
        
        if (answers.showTerminal) {
            await generator.displayTerminal(answers.data, answers);
        }

        // Set transparent flag if background is transparent
        answers.transparent = answers.backgroundColor === 'transparent';
        
        const buffer = await generator.generateQR(answers.data, answers);
        
        if (answers.saveFile) {
            await generator.saveQR(buffer, answers.filename);
        }

        generator.getQRInfo(answers.data, answers);
        console.log(chalk.green.bold('\n✨ QR code generated successfully!'));

    } catch (error) {
        console.error(chalk.red(`❌ Error: ${error.message}`));
        process.exit(1);
    }
}

// Command line interface
program
    .name('qr-generator')
    .description('Advanced QR Code Generator with extensive customization')
    .version('1.0.0');

program
    .argument('[data]', 'URL or text to encode')
    .option('-e, --error-correction <level>', 'Error correction level (L/M/Q/H)', 'M')
    .option('-s, --size <pixels>', 'QR code size in pixels', '300')
    .option('-m, --margin <modules>', 'Border margin in modules', '4')
    .option('-f, --foreground-color <color>', 'Foreground color (hex)', '#000000')
    .option('-b, --background-color <color>', 'Background color (hex or "transparent")', '#FFFFFF')
    .option('--module-shape <shape>', 'Module shape (square/circle)', 'square')
    .option('--qr-version <number>', 'QR version (1-40)', '1')
    .option('-o, --output <filename>', 'Output filename', 'qrcode.png')
    .option('--no-terminal', 'Skip terminal display')
    .option('-i, --interactive', 'Run in interactive mode')
    .action(async (data, options) => {
        if (options.interactive || !data) {
            await interactiveMode();
            return;
        }

        const generator = new AdvancedQRGenerator();

        try {
            console.log(chalk.cyan.bold('🚀 QR Code Generator'));
            console.log(chalk.gray('═'.repeat(30)));

            const qrOptions = {
                errorCorrection: options.errorCorrection,
                size: parseInt(options.size),
                margin: parseInt(options.margin),
                foregroundColor: options.foregroundColor,
                backgroundColor: options.backgroundColor,
                moduleShape: options.moduleShape,
                version: parseInt(options.qrVersion),
                transparent: options.backgroundColor === 'transparent'
            };

            if (options.terminal) {
                await generator.displayTerminal(data, qrOptions);
            }

            console.log(chalk.yellow('⏳ Generating QR code...'));
            const buffer = await generator.generateQR(data, qrOptions);
            
            await generator.saveQR(buffer, options.output);
            generator.getQRInfo(data, qrOptions);
            
            console.log(chalk.green.bold('\n✨ QR code generated successfully!'));

        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    });

// Handle no arguments - run interactive mode
if (process.argv.length <= 2) {
    interactiveMode();
} else {
    program.parse();
}