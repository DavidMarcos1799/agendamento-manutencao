import mysql from 'mysql2/promise';

async function testarDelete() {
  try {
    console.log('=== TESTANDO DELETE NA TABELA ===');
    
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agendamento_pc'
    });
    
    // 1. Verificar estado atual
    const [antes] = await db.execute("SELECT COUNT(*) as total FROM agendamentos");
    console.log('Registros antes:', antes[0].total);
    
    // 2. Inserir um registro de teste
    console.log('\nInserindo registro de teste...');
    const [insertResult] = await db.execute(
      `INSERT INTO agendamentos 
       (data, horario, marca, modelo, serial, tipo, descricao, clienteId, status, data_criacao) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      ['2026-02-01', '14:00:00', 'Teste', 'Modelo Teste', '123456', 'preventiva', 'Descrição teste', 1, 'PENDENTE', '2026-02-01 12:00:00']
    );
    
    console.log('Insert Result:', insertResult);
    console.log('ID inserido:', insertResult.insertId);
    
    const testId = insertResult.insertId;
    
    // 3. Verificar se foi inserido
    const [posInsert] = await db.execute("SELECT * FROM agendamentos WHERE id = ?", [testId]);
    console.log('Registro inserido:', posInsert[0]);
    
    // 4. Tentar excluir
    console.log('\nTentando excluir registro ID:', testId);
    const [deleteResult] = await db.execute("DELETE FROM agendamentos WHERE id = ?", [testId]);
    console.log('Delete Result:', deleteResult);
    console.log('Linhas afetadas:', deleteResult.affectedRows);
    
    // 5. Verificar se foi excluído
    const [posDelete] = await db.execute("SELECT COUNT(*) as total FROM agendamentos WHERE id = ?", [testId]);
    console.log('Registros restantes com este ID:', posDelete[0].total);
    
    // 6. Verificar estado final
    const [final] = await db.execute("SELECT COUNT(*) as total FROM agendamentos");
    console.log('Registros finais:', final[0].total);
    
    await db.end();
    console.log('\n✅ Teste DELETE concluído!');
    
    if (deleteResult.affectedRows > 0 && posDelete[0].total === 0) {
      console.log('✅ DELETE funcionando corretamente!');
    } else {
      console.log('❌ DELETE não está funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarDelete();
