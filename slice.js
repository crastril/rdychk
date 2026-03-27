const sharp = require('sharp');
const fs = require('fs');
const dir = './public/avatars';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function slice() {
  const imgPath = 'C:\\\\Users\\\\cyci_\\\\.gemini\\\\antigravity\\\\brain\\\\d7959609-cf0b-4371-b452-8aa3f82a3579\\\\neobrutalist_avatars_grid_1774618187404.png';
  const meta = await sharp(imgPath).metadata();
  const w = Math.floor(meta.width / 4);
  const h = Math.floor(meta.height / 2);

  let idx = 1;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      await sharp(imgPath)
        .extract({ left: col * w, top: row * h, width: w, height: h })
        .toFile(`${dir}/avatar-${idx}.png`);
      idx++;
    }
  }
  console.log('Done!');
}
slice().catch(console.error);
