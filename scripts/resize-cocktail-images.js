const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // npm install sharp

const cocktailsDir = path.join(__dirname, '../assets/cocktails');
const outputDir = path.join(__dirname, '../assets/cocktails-resized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function resizeImages() {
  try {
    const files = fs.readdirSync(cocktailsDir);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.png')
    );

    console.log(`Found ${imageFiles.length} images to resize...`);

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const inputPath = path.join(cocktailsDir, file);
      const outputPath = path.join(outputDir, file);

      await sharp(inputPath)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      console.log(`Resized ${i + 1}/${imageFiles.length}: ${file}`);
    }

    console.log('✅ All images resized successfully!');
    console.log(`Resized images saved to: ${outputDir}`);
    console.log('After verifying the resized images, replace the original folder.');
    
  } catch (error) {
    console.error('Error resizing images:', error);
  }
}

resizeImages();