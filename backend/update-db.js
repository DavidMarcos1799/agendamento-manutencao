import { createConnection } from 'mysql2/promise';

async function updateDatabase() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agendamento_pc'
  });

  try {
    console.log('Conectado ao banco de dados. Atualizando estrutura...');
    
    // Adicionar colunas faltantes na tabela clientes
    await connection.execute(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS cep VARCHAR(20) NULL AFTER endereco,
      ADD COLUMN IF NOT EXISTS bairro VARCHAR(255) NULL AFTER cep,
      ADD COLUMN IF NOT EXISTS token_recuperacao VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS expiracao_token_recuperacao DATETIME NULL
    `);
    
    console.log('Estrutura do banco de dados atualizada com sucesso!');
    
  } catch (error) {
    console.error('Erro ao atualizar o banco de dados:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateDatabase().catch(console.error);
