const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'backend', 'uploads', '1765732933585-Imagem do WhatsApp de 2025-12-07 Ã (s) 11.31.41_d77818ee.jpg');
const destDir = path.join(__dirname, '..', 'frontend', 'assets');
const dest = path.join(destDir, 'robot.jpg');

if (!fs.existsSync(src)) {
  console.error('Arquivo de origem não encontrado:', src);
  process.exit(1);
}

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

fs.copyFileSync(src, dest);
console.log('Imagem copiada para', dest);
