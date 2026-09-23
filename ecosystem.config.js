module.exports = {
  apps: [
    {
      name: 'agendamento-backend',
      script: './server.js',
      cwd: 'C:\\Users\\David\\Documents\\GitHub\\agendamento-manutencao\\backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'agendamento-frontend',
      script: 'C:\\Users\\David\\Documents\\GitHub\\agendamento-manutencao\\start-frontend.js',
      cwd: 'C:\\Users\\David\\Documents\\GitHub\\agendamento-manutencao',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
