const { spawn } = require('child_process');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');
const httpServerPath = path.join(process.env.APPDATA, 'npm', 'http-server.cmd');

console.log('Iniciando frontend...');
console.log('Diretório:', frontendPath);
console.log('HTTP Server:', httpServerPath);

const child = spawn(httpServerPath, [frontendPath, '-p', '8080'], {
  cwd: __dirname,
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(`[Frontend] ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`[Frontend Error] ${data}`);
});

child.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});
