const mysql = require('mysql2/promise');

async function checkTable() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agendamento_pc'
    });
    
    console.log('Verificando estrutura da tabela agendamentos...');
    const [columns] = await db.execute('DESCRIBE agendamentos');
    console.log('Colunas da tabela agendamentos:');
    columns.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
    
    // Verificar se a coluna motivo_cancelamento existe
    const hasMotivoColumn = columns.some(col => col.Field === 'motivo_cancelamento');
    console.log(`\nColuna 'motivo_cancelamento' existe: ${hasMotivoColumn}`);
    
    if (!hasMotivoColumn) {
      console.log('Adicionando coluna motivo_cancelamento...');
      await db.execute('ALTER TABLE agendamentos ADD COLUMN motivo_cancelamento TEXT NULL');
      console.log('Coluna motivo_cancelamento adicionada com sucesso!');
    }
    
    await db.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkTable();
