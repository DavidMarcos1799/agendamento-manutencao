const fs = require('fs');
const path = require('path');

const srcDir = process.argv[2];
if (!srcDir) {
  console.error('Usage: node copy-from-external.js <source-directory>');
  process.exit(1);
}

const absSrc = path.resolve(srcDir);
const destDir = path.join(__dirname, '..', 'frontend', 'assets');
const dest = path.join(destDir, 'robot.jpg');

try {
  if (!fs.existsSync(absSrc)) {
    console.error('Pasta não encontrada:', absSrc);
    process.exit(2);
  }

  const files = fs.readdirSync(absSrc)
    .map(f => ({ name: f, full: path.join(absSrc, f) }))
    .filter(f => {
      const ext = path.extname(f.name).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) && fs.statSync(f.full).isFile();
    });

  if (!files.length) {
    console.error('Nenhuma imagem encontrada em', absSrc);
    process.exit(3);
  }

  files.sort((a, b) => fs.statSync(b.full).mtimeMs - fs.statSync(a.full).mtimeMs);
  const latest = files[0].full;

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(latest, dest);
  console.log('Imagem copiada:', latest);
  console.log('Destino:', dest);
} catch (err) {
  console.error('Erro:', err.message);
  process.exit(10);
}
