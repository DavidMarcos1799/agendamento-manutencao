// Script para verificar se o banco de dados está configurado corretamente

import mysql from "mysql2/promise";

async function verificarBanco() {
  try {
    console.log("Conectando ao MySQL...");
    
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "agendamento_pc",
    });

    console.log("✓ Conectado ao MySQL com sucesso!\n");

    // Verificar se a tabela clientes existe
    try {
      const [tabelas] = await db.execute("SHOW TABLES LIKE 'clientes'");
      if (tabelas.length > 0) {
        console.log("✓ Tabela 'clientes' existe");
        
        // Verificar estrutura da tabela
        const [estrutura] = await db.execute("DESCRIBE clientes");
        console.log("\nEstrutura da tabela 'clientes':");
        estrutura.forEach(col => {
          console.log(`  - ${col.Field} (${col.Type})`);
        });
        
        // Contar registros
        const [contagem] = await db.execute("SELECT COUNT(*) as total FROM clientes");
        console.log(`\n✓ Total de clientes cadastrados: ${contagem[0].total}`);
      } else {
        console.log("✗ Tabela 'clientes' NÃO existe!");
        console.log("  Execute o script database.sql para criar as tabelas.");
      }
    } catch (erro) {
      console.log("✗ Erro ao verificar tabela 'clientes':", erro.message);
    }

    // Verificar se a tabela agendamentos existe
    try {
      const [tabelas] = await db.execute("SHOW TABLES LIKE 'agendamentos'");
      if (tabelas.length > 0) {
        console.log("\n✓ Tabela 'agendamentos' existe");
        
        // Contar registros
        const [contagem] = await db.execute("SELECT COUNT(*) as total FROM agendamentos");
        console.log(`✓ Total de agendamentos: ${contagem[0].total}`);
      } else {
        console.log("\n✗ Tabela 'agendamentos' NÃO existe!");
        console.log("  Execute o script database.sql para criar as tabelas.");
      }
    } catch (erro) {
      console.log("\n✗ Erro ao verificar tabela 'agendamentos':", erro.message);
    }

    await db.end();
    console.log("\n✓ Verificação concluída!");
    
  } catch (erro) {
    console.error("\n✗ ERRO:", erro.message);
    console.error("\nVerifique se:");
    console.error("1. MySQL está rodando");
    console.error("2. O banco de dados 'agendamento_pc' existe");
    console.error("3. As credenciais estão corretas");
    process.exit(1);
  }
}

verificarBanco();

