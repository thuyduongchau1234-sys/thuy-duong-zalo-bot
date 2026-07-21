import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const imagePath = 'C:/Users/ABC/.gemini/antigravity-ide/brain/8f61be5c-e31e-4e93-a065-8ec8da016afc/self_massage_instruction_1782450536122.png';
  const outputPath = './data/daily_posts/03_forehead_relaxation.png';

  if (!fs.existsSync(imagePath)) {
    console.error('Base image not found:', imagePath);
    return;
  }

  const svgOverlay = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <!-- Cover the bottom bar with solid white -->
      <rect x="0" y="720" width="800" height="80" fill="#ffffff" />
      
      <!-- New text with smaller font-size to avoid cut-off -->
      <text x="400" y="765" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">
        ẤN GIỮ HUYỆT ẤN ĐƯỜNG - GIÃN MỀM CƠ TRÁN (30 GIÂY)
      </text>
    </svg>
  `;

  try {
    await sharp(imagePath)
      .resize(800, 800)
      .composite([{
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      }])
      .toFile(outputPath);

    console.log('Successfully generated fixed 800x800 forehead image at:', outputPath);
  } catch (error) {
    console.error('Error modifying image:', error);
  }
}

main();
