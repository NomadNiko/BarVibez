#!/usr/bin/env python3
"""
Resize all cocktail images to 400x400 pixels to reduce file sizes and improve load times.
Usage: python resize-cocktail-images.py
"""

import os
import sys
from PIL import Image, ImageOps
from pathlib import Path

def resize_images():
    # Paths
    script_dir = Path(__file__).parent
    cocktails_dir = script_dir.parent / 'assets' / 'cocktails'
    output_dir = script_dir.parent / 'assets' / 'cocktails-resized'
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    
    # Get all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    image_files = [f for f in cocktails_dir.iterdir() 
                   if f.suffix.lower() in image_extensions]
    
    print(f"Found {len(image_files)} images to resize...")
    
    for i, image_path in enumerate(image_files, 1):
        try:
            # Open and resize image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary (for PNG with transparency)
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize with proper aspect ratio handling
                img_resized = ImageOps.fit(img, (400, 400), Image.Resampling.LANCZOS)
                
                # Save with optimized quality
                output_path = output_dir / f"{image_path.stem}.jpg"
                img_resized.save(output_path, 'JPEG', quality=85, optimize=True)
                
                print(f"Resized {i}/{len(image_files)}: {image_path.name}")
                
        except Exception as e:
            print(f"Error processing {image_path.name}: {e}")
    
    print(f"\n✅ All images resized successfully!")
    print(f"Resized images saved to: {output_dir}")
    print("After verifying the resized images, replace the original folder.")

if __name__ == "__main__":
    try:
        resize_images()
    except KeyboardInterrupt:
        print("\n❌ Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)