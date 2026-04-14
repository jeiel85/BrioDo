import Jimp from 'jimp';

async function removeBg() {
  const image = await Jimp.read('d:/Project/BrioDo/generated_app_icon_identity.png');
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  // Use top-left pixel as background color
  const bgColor = Jimp.intToRGBA(image.getPixelColor(0, 0));
  const threshold = 30; // tolerance
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (Math.abs(color.r - bgColor.r) < threshold && 
          Math.abs(color.g - bgColor.g) < threshold && 
          Math.abs(color.b - bgColor.b) < threshold) {
        // Set transparent
        image.setPixelColor(Jimp.rgbaToInt(color.r, color.g, color.b, 0), x, y);
      }
    }
  }
  
  await image.writeAsync('d:/Project/BrioDo/assets/icon.png');
  console.log("Background removed!");
}

removeBg().catch(console.error);
