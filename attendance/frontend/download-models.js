// download-models.js — downloads face-api.js model weights to public/models/
// Run automatically via: npm run postinstall
// Or manually via: node download-models.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

function download(filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(MODEL_DIR, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`  ✓ ${filename} (already exists)`);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    const url = `${BASE_URL}/${filename}`;

    function get(url) {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${filename}: HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  ✓ ${filename} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }
    get(url);
  });
}

async function main() {
  console.log('\nDownloading face-api.js model weights to public/models/ ...\n');
  for (const file of FILES) {
    try {
      await download(file);
    } catch (err) {
      console.warn(`  ⚠ Could not download ${file}: ${err.message}`);
    }
  }
  console.log('\nDone! Models ready.\n');
}

main();
