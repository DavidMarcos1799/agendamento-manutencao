// server.js - Backend Cadastro + Agendamento + MySQL + Upload

// Carregar variáveis de ambiente do arquivo .env
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import nodemailer from "nodemailer";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configuração simplificada do CORS
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configuração para servir arquivos estáticos do frontend
const frontendPath = join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Rota raiz redireciona para index.html
app.get('/', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

// O middleware de CORS manual foi removido para evitar conflito com a configuração automática do CORS

// Captura erros de JSON inválido enviados no body (body-parser)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('JSON inválido recebido:', err.message);
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  // Express default error handler se não for parse error
  next(err);
});

// Criar diretório uploads se não existir
const uploadsDir = join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Diretório 'uploads' criado com sucesso!");
}

// Permite acessar as imagens via URL
app.use("/uploads", express.static(uploadsDir));

// Configuração para servir arquivos estáticos do frontend
const frontendDir = join(__dirname, "..", "frontend");
console.log('Diretório frontend:', frontendDir);

// Servir arquivos estáticos (CSS, JS, imagens, etc.)
app.use(express.static(frontendDir));

// Lista de rotas conhecidas do frontend
const frontendRoutes = [
  '/',
  '/login',
  '/cadastro',
  '/agendamento',
  '/minhas-ordens',
  '/recuperar-senha',
  '/alterar-senha'
];

// Rota para páginas do frontend
frontendRoutes.forEach(route => {
  app.get(route, (req, res) => {
    // Se for a rota raiz, envia o index.html
    if (route === '/') {
      return res.sendFile(join(frontendDir, 'index.html'));
    }
    // Para outras rotas, tenta enviar o arquivo correspondente
    const filePath = join(frontendDir, `${route}.html`);
    res.sendFile(filePath);
  });
});

// Configuração do multer (upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Conexão com MySQL
let db;
try {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "agendamento_pc",
  });
  console.log("Conectado ao MySQL com sucesso!");
  
  // Verificar se as tabelas existem
  try {
    await db.execute("SELECT 1 FROM clientes LIMIT 1");
    await db.execute("SELECT 1 FROM agendamentos LIMIT 1");
    console.log("Tabelas verificadas com sucesso!");
  } catch (erroTabela) {
    console.warn("AVISO: Tabelas não encontradas. Execute o script database.sql para criar as tabelas.");
  }
} catch (erro) {
  console.error("Erro ao conectar ao MySQL:", erro.message);
  console.error("Verifique se:");
  console.error("1. MySQL está rodando");
  console.error("2. O banco de dados 'agendamento_pc' existe");
  console.error("3. As credenciais estão corretas em server.js");
  process.exit(1);
}

// Validação CPF ou CNPJ
function validarDocumento(doc) {
  return /^(\d{11}|\d{14})$/.test(doc);
}

// Validação de e-mail
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Configuração do Nodemailer (opcional - pode ser desabilitado)
const emailConfig = {
  habilitado: process.env.EMAIL_ENABLED !== "false", // Por padrão habilitado, pode desabilitar com EMAIL_ENABLED=false
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER || "", // Seu e-mail
    pass: process.env.EMAIL_PASS || "", // Sua senha de app ou senha do e-mail
  },
};

// Criar transporter de e-mail (só se estiver habilitado)
let transporter = null;
if (emailConfig.habilitado && emailConfig.auth.user && emailConfig.auth.pass) {
  // Verificar se ainda são valores de exemplo
  if (emailConfig.auth.user.includes("seu_email") || emailConfig.auth.pass.includes("sua_senha")) {
    console.log("⚠ Serviço de e-mail não configurado.");
    console.log("  O arquivo .env contém valores de exemplo.");
    console.log("  Edite backend/.env e configure EMAIL_USER e EMAIL_PASS com valores reais.");
  } else {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
    console.log("✓ Serviço de e-mail configurado!");
    console.log(`  E-mail: ${emailConfig.auth.user}`);
  }
} else {
  console.log("⚠ Serviço de e-mail desabilitado ou não configurado.");
  if (!emailConfig.auth.user) {
    console.log("  EMAIL_USER não configurado no .env");
  }
  if (!emailConfig.auth.pass) {
    console.log("  EMAIL_PASS não configurado no .env");
  }
  console.log("  Para habilitar, edite backend/.env e configure:");
  console.log("    EMAIL_USER=seu_email@gmail.com");
  console.log("    EMAIL_PASS=sua_senha_de_app");
}

// Função para gerar token de confirmação
function gerarTokenConfirmacao() {
  return crypto.randomBytes(32).toString("hex");
}

// Função para enviar e-mail de confirmação
async function enviarEmailConfirmacao(email, nome, token) {
  if (!transporter) {
    console.log("⚠ E-mail não enviado: serviço de e-mail não configurado");
    return false;
  }

  const urlConfirmacao = `http://localhost:3000/confirmar-email?token=${token}`;

  const mailOptions = {
    from: `"Sistema de Agendamento" <${emailConfig.auth.user}>`,
    to: email,
    subject: "Confirme seu cadastro - Sistema de Agendamento",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirme seu Cadastro</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            <p>Obrigado por se cadastrar no nosso sistema de agendamento de manutenção.</p>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            <p style="text-align: center;">
              <a href="${urlConfirmacao}" class="button">Confirmar E-mail</a>
            </p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #007bff;">${urlConfirmacao}</p>
            <p><strong>Este link expira em 24 horas.</strong></p>
            <p>Se você não se cadastrou, pode ignorar este e-mail.</p>
          </div>
          <div class="footer">
            <p>Sistema de Agendamento de Manutenção</p>
            <p>Este é um e-mail automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá, ${nome}!
      
      Obrigado por se cadastrar no nosso sistema de agendamento de manutenção.
      
      Para ativar sua conta, acesse este link:
      ${urlConfirmacao}
      
      Este link expira em 24 horas.
      
      Se você não se cadastrou, pode ignorar este e-mail.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ E-mail de confirmação enviado para: ${email}`);
    return true;
  } catch (erro) {
    console.error("Erro ao enviar e-mail:", erro);
    return false;
  }
}
 

// Rota de teste
app.get("/api", (req, res) => {
  res.send("Servidor rodando perfeitamente!");
});

// Servir index.html como página inicial
app.get("/", (req, res) => {
  res.sendFile(join(frontendDir, "index.html"));
});

// ----------------------
// ROTA DE CADASTRO
// ----------------------
app.post("/cadastro", async (req, res) => {
  try {
    const { nome, documento, cep, endereco, bairro, telefone, email, senha } = req.body;

    console.log("=== DADOS RECEBIDOS NO CADASTRO ===");
    console.log("Nome:", nome);
    console.log("Documento (original):", documento);
    console.log("Documento (trim):", documento ? documento.trim() : "vazio");
    console.log("Email:", email);
    console.log("Telefone:", telefone);

    if (!nome || !documento || !cep || !endereco || !bairro || !telefone || !email || !senha) {
      return res.status(400).json({ erro: "Todos os campos são obrigatórios (incluindo CEP e bairro)." });
    }

    // Limpar documento (remover espaços e caracteres não numéricos)
    const documentoLimpo = documento.toString().replace(/\D/g, "");

    console.log("Documento limpo (apenas números):", documentoLimpo);
    console.log("Tamanho do documento:", documentoLimpo.length);

    // Validação de tamanho mínimo de senha
    if (senha.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
    }

    if (!validarDocumento(documentoLimpo)) {
      return res.status(400).json({ 
        erro: `CPF/CNPJ inválido. Use apenas números (11 dígitos para CPF ou 14 para CNPJ). Recebido: ${documentoLimpo.length} dígitos.` 
      });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({ erro: "E-mail inválido." });
    }

    // Verificar se documento já existe
    const [docExists] = await db.execute(
      "SELECT id FROM clientes WHERE documento = ?",
      [documentoLimpo]
    );
    
    console.log("Verificação de documento existente:", docExists.length, "registros encontrados");
    
    if (docExists.length > 0) {
      return res.status(400).json({
        erro: "Este CPF/CNPJ já está cadastrado. Use outro documento ou faça login.",
      });
    }

    // Verificar se e-mail já existe
    const emailLimpo = email.trim().toLowerCase();
    const [emailExists] = await db.execute(
      "SELECT id FROM clientes WHERE email = ?",
      [emailLimpo]
    );
    
    console.log("Verificação de email existente:", emailExists.length, "registros encontrados");
    
    if (emailExists.length > 0) {
      return res.status(400).json({
        erro: "Este e-mail já está cadastrado. Use outro e-mail ou faça login.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Gerar token de confirmação
    const tokenConfirmacao = gerarTokenConfirmacao();
    const tokenExpiracao = new Date();
    tokenExpiracao.setHours(tokenExpiracao.getHours() + 24); // Expira em 24 horas


    console.log("Tentando inserir cliente:", {
      nome: nome.trim(),
      documento: documentoLimpo,
      cep: cep,
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      email: emailLimpo,
      telefone: telefone.trim()
    });

    await db.execute(
      "INSERT INTO clientes (nome, documento, cep, endereco, bairro, telefone, email, senha, email_confirmado, token_confirmacao, token_expiracao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nome.trim(), documentoLimpo, cep.trim(), endereco.trim(), bairro.trim(), telefone.trim(), emailLimpo, senhaHash, false, tokenConfirmacao, tokenExpiracao]
    );

    console.log("✓ Cliente cadastrado com sucesso!");

    // Enviar e-mail de confirmação (opcional)
    const emailEnviado = await enviarEmailConfirmacao(emailLimpo, nome.trim(), tokenConfirmacao);

    if (emailEnviado) {
      res.json({ 
        mensagem: "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.",
        emailEnviado: true
      });
    } else {
      res.json({ 
        mensagem: "Cadastro realizado com sucesso! (E-mail de confirmação não foi enviado - serviço não configurado)",
        emailEnviado: false
      });
    }
  } catch (erro) {
    console.error("=== ERRO AO CADASTRAR ===");
    console.error("Código do erro:", erro.code);
    console.error("Mensagem do erro:", erro.message);
    console.error("Stack:", erro.stack);
    
    // Verificar se é erro de tabela não encontrada
    if (erro.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        erro: "Erro no banco de dados. Execute o script database.sql para criar as tabelas.",
      });
    }
    
    // Verificar se é erro de duplicata (APENAS se o código for ER_DUP_ENTRY)
    if (erro.code === "ER_DUP_ENTRY") {
      console.log("Erro de duplicata detectado, verificando qual campo...");
      
      // Tentar identificar qual campo causou o erro pela mensagem
      const mensagemErro = erro.message || "";
      if (mensagemErro.includes("documento") || (mensagemErro.includes("PRIMARY") && mensagemErro.includes("documento"))) {
        return res.status(400).json({
          erro: "Este CPF/CNPJ já está cadastrado. Use outro documento ou faça login.",
        });
      } else if (mensagemErro.includes("email")) {
        return res.status(400).json({
          erro: "Este e-mail já está cadastrado. Use outro e-mail ou faça login.",
        });
      }
      
      // Se não conseguir identificar pela mensagem, verificar novamente no banco
      try {
        const { documento, email } = req.body;
        const documentoLimpo = documento ? documento.toString().replace(/\D/g, "") : "";
        const emailLimpo = email ? email.trim().toLowerCase() : "";
        
        console.log("Verificando duplicata no banco...");
        const [docCheck] = await db.execute("SELECT id FROM clientes WHERE documento = ?", [documentoLimpo]);
        const [emailCheck] = await db.execute("SELECT id FROM clientes WHERE email = ?", [emailLimpo]);
        
        console.log("Documento encontrado:", docCheck.length);
        console.log("Email encontrado:", emailCheck.length);
        
        if (docCheck.length > 0) {
          return res.status(400).json({
            erro: "Este CPF/CNPJ já está cadastrado. Use outro documento ou faça login.",
          });
        }
        if (emailCheck.length > 0) {
          return res.status(400).json({
            erro: "Este e-mail já está cadastrado. Use outro e-mail ou faça login.",
          });
        }
      } catch (erroVerificacao) {
        console.error("Erro ao verificar duplicata:", erroVerificacao);
      }
      
      return res.status(400).json({
        erro: "Documento ou e-mail já cadastrado. Use outro documento ou e-mail.",
      });
    }
    
    // Para TODOS os outros erros, retornar mensagem genérica de erro
    console.error("Erro não é de duplicata. Tipo:", typeof erro.code, "Valor:", erro.code);
    res.status(500).json({
      erro: "Erro ao cadastrar. Verifique os logs do servidor para mais detalhes.",
      detalhes: erro.message || "Erro desconhecido"
    });
  }
});

// ----------------------
// ROTA: RECUPERAÇÃO DE SENHA
// Adiciona colunas necessárias na tabela `clientes` caso não existam
async function ensurePasswordResetColumns() {
  try {
    const [cols] = await db.execute("SHOW COLUMNS FROM clientes LIKE 'token_recuperacao'");
    if (cols.length === 0) {
      await db.execute(
        "ALTER TABLE clientes ADD COLUMN token_recuperacao VARCHAR(255) NULL, ADD COLUMN token_recuperacao_expiracao DATETIME NULL"
      );
      console.log('Colunas de recuperação de senha adicionadas à tabela clientes.');
    }
  } catch (err) {
    console.warn('Não foi possível garantir colunas de recuperação de senha:', err.message);
  }
}

await ensurePasswordResetColumns();

// Garantir colunas de endereço (cep, bairro) na tabela clientes caso faltem
async function ensureAddressColumns() {
  try {
    const [colsCep] = await db.execute("SHOW COLUMNS FROM clientes LIKE 'cep'");
    const [colsBairro] = await db.execute("SHOW COLUMNS FROM clientes LIKE 'bairro'");
    const alters = [];
    if (colsCep.length === 0) alters.push("ADD COLUMN cep VARCHAR(20) NULL");
    if (colsBairro.length === 0) alters.push("ADD COLUMN bairro VARCHAR(255) NULL");
    if (alters.length > 0) {
      const sql = `ALTER TABLE clientes ${alters.join(', ')}`;
      await db.execute(sql);
      console.log('Colunas de endereço adicionadas à tabela clientes:', alters.join(', '));
    }
  } catch (err) {
    console.warn('Não foi possível garantir colunas de endereço:', err.message);
  }
}

await ensureAddressColumns();

// Enviar e-mail de recuperação de senha
async function enviarEmailRecuperacao(email, nome, token) {
  if (!transporter) {
    console.log('⚠ E-mail de recuperação não enviado: serviço de e-mail não configurado');
    return false;
  }

  const urlReset = `http://localhost:3000/redefinir-senha.html?token=${token}`;

  const mailOptions = {
    from: `"Sistema de Agendamento" <${emailConfig.auth.user}>`,
    to: email,
    subject: 'Recuperação de senha - Sistema de Agendamento',
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:0 auto;">
        <h2>Recuperação de Senha</h2>
        <p>Olá, <strong>${nome}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <p style="text-align:center;"><a href="${urlReset}" style="display:inline-block;padding:12px 20px;background:#2e7d32;color:#fff;border-radius:6px;text-decoration:none;">Redefinir Senha</a></p>
        <p>Se preferir, copie e cole este link no seu navegador:</p>
        <p style="word-break:break-all;color:#2e7d32;">${urlReset}</p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>
    `,
    text: `Olá ${nome}, acesse: ${urlReset} (link válido por 1 hora)`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ E-mail de recuperação enviado para: ${email}`);
    return true;
  } catch (err) {
    console.error('Erro ao enviar e-mail de recuperação:', err);
    return false;
  }
}

// Rota para solicitar recuperação: envia e-mail com token
app.post('/recuperar-senha', async (req, res) => {
  try {
    console.log('POST /recuperar-senha recebido. body=', req.body);
    const { email } = req.body || {};
    if (!email || !validarEmail(email)) return res.status(400).json({ erro: 'E-mail inválido.' });

    const emailLimpo = email.trim().toLowerCase();
    const [rows] = await db.execute('SELECT id, nome FROM clientes WHERE email = ?', [emailLimpo]);
    if (rows.length === 0) return res.status(200).json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções para recuperar a senha.' });

    const cliente = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 1); // 1 hora

    await db.execute('UPDATE clientes SET token_recuperacao = ?, token_recuperacao_expiracao = ? WHERE id = ?', [token, expiracao, cliente.id]);

    console.log(`Gerado token para id=${cliente.id} email=${emailLimpo}`);
    const enviado = await enviarEmailRecuperacao(emailLimpo, cliente.nome, token);
    console.log('Resultado envio email:', enviado);
    if (enviado) {
      return res.json({ mensagem: 'Instruções de recuperação enviadas para o seu e-mail (se cadastrado).' });
    } else {
      return res.status(500).json({ erro: 'Não foi possível enviar o e-mail de recuperação. Verifique a configuração de e-mail.' });
    }
  } catch (err) {
    console.error('Erro em /recuperar-senha:', err);
    return res.status(500).json({ erro: 'Erro ao processar recuperação de senha.' });
  }
});

// Rota para obter agendamentos por data (retorna array de horários já ocupados)
app.get('/agendamentos', async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ erro: 'Parâmetro data é obrigatório (YYYY-MM-DD).' });
    // Busca horários já agendados na data fornecida
    const [rows] = await db.execute('SELECT horario FROM agendamentos WHERE data = ?', [data]);
    const horarios = rows.map(r => (typeof r.horario === 'string' ? r.horario : (r.horario && r.horario.toString ? r.horario.toString().slice(0,5) : r.horario)) );
    return res.json({ data, horarios });
  } catch (err) {
    console.error('Erro em GET /agendamentos:', err);
    return res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// Página de formulário para reset (serve HTML simples)
app.get('/reset-password', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Token não fornecido.');

  res.send(`
    <!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Redefinir Senha</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        :root{--primary:#2e7d32;--bg:#f7f9f8;--card:#fff;--muted:#666}
        *{box-sizing:border-box}
        body{font-family:'Poppins',sans-serif;background:var(--bg);margin:0;padding:40px;display:flex;align-items:center;justify-content:center;min-height:100vh}
        .reset-card{width:100%;max-width:900px;background:linear-gradient(180deg,var(--card),#fbfbfb);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.06);padding:36px;display:flex;gap:30px;align-items:stretch;justify-content:center}
        .reset-illustration{flex:0 0 240px;display:flex;align-items:center;justify-content:center}
        .reset-illustration img{max-width:100%;height:auto;display:block;border-radius:8px}
        .reset-body{flex:1;max-width:520px;margin:0 auto;display:flex;flex-direction:column;justify-content:center}
        h1{margin:0 0 8px;font-size:28px;color:#111;text-align:center}
        p.lead{margin:0 0 18px;color:var(--muted);text-align:center}
        form{display:block;max-width:760px;margin:0 auto;padding:0 12px}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;width:100%;margin:0 auto}
        .form-row > div{min-width:0}
        label{font-size:0.95rem;color:#333;font-weight:600;display:block;margin-bottom:8px}
        input[type=password]{width:100%;padding:14px;border:1px solid #e6e6e6;border-radius:10px;font-size:1rem;box-sizing:border-box}
        .help{font-size:0.9rem;color:var(--muted);margin-top:8px;text-align:center}
        .btn{display:block;margin:18px auto 0;padding:12px 18px;background:var(--primary);color:#fff;border-radius:10px;border:none;cursor:pointer;font-weight:600}
        .msg{margin-top:12px;padding:10px;border-radius:8px;display:none;text-align:center}
        .msg.error{background:rgba(255,0,0,0.06);color:crimson}
        .msg.success{background:rgba(46,125,50,0.06);color:var(--primary)}
        @media(max-width:800px){.reset-card{flex-direction:column;padding:24px}.reset-illustration{width:100%;flex:0 0 auto;margin-bottom:12px}}
      </style>
    </head>
    <body>
      <div class="reset-card">
        <div class="reset-illustration">
          <img src="/uploads/1765732933585-Imagem%20do%20WhatsApp%20de%202025-12-07%20%C3%A0(s)%2011.31.41_d77818ee.jpg" alt="Robô BH Notebooks" onerror="this.style.display='none'">
        </div>
        <div class="reset-body">
          <h1>Redefinir Senha</h1>
          <p class="lead">Escolha uma nova senha para sua conta. A senha deve ter no mínimo 6 caracteres.</p>

          <form method="POST" action="/reset-password" id="resetForm">
            <input type="hidden" name="token" value="${token}">
            <div class="form-row">
              <div>
                <label for="senha">Nova senha</label>
                <input id="senha" name="senha" type="password" required minlength="6" autocomplete="new-password">
              </div>
              <div>
                <label for="senhaConfirm">Confirmar senha</label>
                <input id="senhaConfirm" name="senhaConfirm" type="password" required minlength="6" autocomplete="new-password">
              </div>
            </div>
            <div class="help">Dica: use uma senha forte e evite reutilizar senhas de outros sites.</div>
            <button type="submit" class="btn">Redefinir senha</button>
            <div id="formMsg" class="msg" role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>

      <script>
        const form = document.getElementById('resetForm');
        const senha = document.getElementById('senha');
        const senhaConfirm = document.getElementById('senhaConfirm');
        const msg = document.getElementById('formMsg');

        function showMessage(text, isError){
          msg.style.display = 'block';
          msg.className = 'msg ' + (isError ? 'error' : 'success');
          msg.textContent = text;
        }

        form.addEventListener('submit', async function(e){
          e.preventDefault();
          msg.style.display = 'none';
          if (senha.value.length < 6){
            showMessage('A senha deve ter ao menos 6 caracteres.', true);
            senha.focus();
            return;
          }
          if (senha.value !== senhaConfirm.value){
            showMessage('As senhas não conferem. Por favor, confirme corretamente.', true);
            senhaConfirm.focus();
            return;
          }

          showMessage('Enviando...', false);

          try {
            const formData = new FormData(form);
            const resp = await fetch('/reset-password', {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
              body: formData
            });

            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const json = await resp.json();
              if (resp.ok && json.success) {
                showMessage(json.mensagem || 'Senha redefinida com sucesso!', false);
                setTimeout(() => { window.location.href = '/login.html'; }, 1500);
                return;
              } else {
                showMessage(json.erro || json.mensagem || 'Erro ao redefinir senha.', true);
                return;
              }
            } else {
              const text = await resp.text();
              // Se for HTML de sucesso, redireciona para login
              if (resp.ok && text.includes('Senha redefinida com sucesso')) {
                showMessage('Senha redefinida com sucesso!', false);
                setTimeout(() => { window.location.href = '/login.html'; }, 1500);
                return;
              }
              showMessage('Erro: ' + (text || resp.statusText), true);
            }
          } catch (err) {
            console.error(err);
            showMessage('Erro ao conectar com o servidor. Tente novamente.', true);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Processa redefinição (recebe multipart/form-data, form-urlencoded, json ou query params)
app.post('/reset-password', 
  upload.none(), // Processa multipart/form-data
  express.json(),
  express.urlencoded({ extended: true }), 
  async (req, res) => {
  try {
    console.log('Recebida requisição para /reset-password');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Query:', req.query);

    // Tenta obter o token do body (form/json) ou da query string
    const token = req.body.token || req.query.token;
    const { senha, senhaConfirm } = req.body;
    
    if (!token) {
      console.error('Token não fornecido');
      return res.status(400).json({ error: 'Token é obrigatório.' });
    }
    
    if (!senha || senha.length < 6) {
      console.error('Senha inválida');
      return res.status(400).json({ error: 'A senha deve ter ao menos 6 caracteres.' });
    }
    
    if (senha !== senhaConfirm) {
      console.error('Senhas não conferem');
      return res.status(400).json({ error: 'As senhas não conferem.' });
    }

    console.log('Procurando token no banco de dados...');
    const [rows] = await db.execute(
      'SELECT id, token_recuperacao_expiracao FROM clientes WHERE token_recuperacao = ?', 
      [token]
    );
    
    if (rows.length === 0) {
      console.error('Token não encontrado no banco de dados');
      return res.status(400).send('Token inválido ou expirado.');
    }

    const cliente = rows[0];
    const expiracao = cliente.token_recuperacao_expiracao ? new Date(cliente.token_recuperacao_expiracao) : null;
    
    if (!expiracao || new Date() > expiracao) {
      console.error('Token expirado');
      return res.status(400).send('Token expirado. Solicite recuperação novamente.');
    }

    console.log('Gerando hash da nova senha...');
    const hash = await bcrypt.hash(senha, 10);
    
    console.log('Atualizando senha no banco de dados...');
    await db.execute(
      'UPDATE clientes SET senha = ?, token_recuperacao = NULL, token_recuperacao_expiracao = NULL WHERE id = ?', 
      [hash, cliente.id]
    );
    
    console.log('Senha atualizada com sucesso para o usuário ID:', cliente.id);
    
    const wantsJson = (req.headers['x-requested-with'] === 'XMLHttpRequest') || 
                     (req.headers.accept && req.headers.accept.includes('application/json'));
    
    if (wantsJson) {
      return res.json({ success: true, mensagem: 'Senha redefinida com sucesso.' });
    }

    res.send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Senha redefinida</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
          h2 { color: #00A82D; }
          a { color: #00A82D; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h2>✓ Senha redefinida com sucesso!</h2>
        <p>Agora você pode fazer login com sua nova senha.</p>
        <p><a href="/login.html">Ir para login</a></p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Erro em /reset-password POST:', err);
    const errorResponse = {
      error: 'Erro ao redefinir senha',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    console.error('Detalhes do erro:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// ----------------------
// ROTA DE CONFIRMAÇÃO DE E-MAIL
// ----------------------
app.get("/confirmar-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Erro na Confirmação</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Token de confirmação não fornecido.</h1>
          <p><a href="/">Voltar para a página inicial</a></p>
        </body>
        </html>
      `);
    }

    // Buscar cliente pelo token
    const [rows] = await db.execute(
      "SELECT id, nome, email_confirmado, token_expiracao FROM clientes WHERE token_confirmacao = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Token Inválido</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Token de confirmação inválido ou expirado.</h1>
          <p><a href="/">Voltar para a página inicial</a></p>
        </body>
        </html>
      `);
    }

    const cliente = rows[0];

    // Verificar se já foi confirmado
    if (cliente.email_confirmado) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>E-mail Já Confirmado</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            .success { color: green; }
          </style>
        </head>
        <body>
          <h1 class="success">Seu e-mail já foi confirmado anteriormente!</h1>
          <p><a href="/login.html">Fazer login</a></p>
        </body>
        </html>
      `);
    }

    // Verificar se o token expirou
    const agora = new Date();
    const expiracao = new Date(cliente.token_expiracao);
    if (agora > expiracao) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Token Expirado</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Token de confirmação expirado.</h1>
          <p>Por favor, entre em contato com o suporte para reenviar o e-mail de confirmação.</p>
          <p><a href="/">Voltar para a página inicial</a></p>
        </body>
        </html>
      `);
    }

    // Confirmar e-mail
    await db.execute(
      "UPDATE clientes SET email_confirmado = TRUE, token_confirmacao = NULL, token_expiracao = NULL WHERE id = ?",
      [cliente.id]
    );

    console.log(`✓ E-mail confirmado para cliente ID: ${cliente.id}`);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>E-mail Confirmado</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          .success { color: green; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1 class="success">✓ E-mail confirmado com sucesso!</h1>
        <p>Olá, <strong>${cliente.nome}</strong>!</p>
        <p>Sua conta foi ativada. Agora você pode fazer login no sistema.</p>
        <a href="/login.html" class="button">Fazer Login</a>
      </body>
      </html>
    `);
  } catch (erro) {
    console.error("Erro ao confirmar e-mail:", erro);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Erro</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
          }
          .error { 
            color: #d32f2f;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            background-color: #d32f2f;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .btn:hover {
            background-color: #b71c1c;
          }
        </style>
      </head>
      <body>
        <h1 class="error">Erro ao processar sua requisição</h1>
        <p>Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.</p>
        <a href="/" class="btn">Voltar para a página inicial</a>
      </body>
      </html>
    `);
  }
});

// Rota para login
app.post("/login", async (req, res) => {
  console.log('\n=== NOVA TENTATIVA DE LOGIN ===');
  console.log('Recebida requisição POST em /login');
  
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Resposta para requisições OPTIONS (pré-voo)
  if (req.method === 'OPTIONS') {
    console.log('Requisição OPTIONS recebida');
    return res.status(200).end();
  }
  
  try {
    const { documento, senha } = req.body;
    
    console.log('Dados recebidos para login:', { 
      documento: documento ? '***' + documento.slice(-3) : 'não informado',
      senha: senha ? '***' : 'não informada' 
    });
    
    // Validação dos campos de entrada
    if (!documento || !senha) {
      const errorMsg = !documento && !senha 
        ? "Documento e senha são obrigatórios." 
        : !documento ? "O documento é obrigatório." : "A senha é obrigatória.";
      console.log('Erro de validação:', errorMsg);
      return res.status(400).json({ 
        sucesso: false,
        erro: errorMsg 
      });
    }
    
    console.log('Documento recebido:', documento ? '***' + documento.slice(-3) : 'não informado');

    // Normaliza o documento (remove caracteres não numéricos) para compatibilidade com o cadastro
    const documentoLimpo = documento.toString().replace(/\D/g, "");
    console.log('Documento limpo para consulta:', documentoLimpo);

    console.log('Executando consulta SQL...');
    const [rows] = await db.execute(
      "SELECT id, nome, email, senha, email_confirmado FROM clientes WHERE documento = ?",
      [documentoLimpo]
    );
    
    console.log('Resultado da consulta SQL:', JSON.stringify(rows, null, 2));
    
    if (!Array.isArray(rows)) {
      console.error('Erro: O resultado da consulta não é um array:', rows);
      return res.status(500).json({ 
        sucesso: false,
        erro: "Erro interno ao processar o login." 
      });
    }

    if (rows.length === 0) {
      return res.status(401).json({ 
        sucesso: false,
        erro: "Dados incorretos." 
      });
    }

    const cliente = rows[0];
    console.log('Cliente encontrado:', cliente ? 'Sim' : 'Não');
    
    if (!cliente) {
      console.log('Nenhum cliente encontrado com o documento fornecido');
      return res.status(401).json({ 
        sucesso: false,
        erro: "Dados incorretos." 
      });
    }
    
    console.log('Verificando senha...');
    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    console.log('Senha válida:', senhaValida ? 'Sim' : 'Não');

    if (!senhaValida) {
      return res.status(401).json({ 
        sucesso: false,
        erro: "Dados incorretos." 
      });
    }

    // Verificar se o e-mail está presente
    if (!cliente.email) {
      console.error('Erro: E-mail não encontrado para o usuário:', cliente.id);
      return res.status(500).json({ 
        sucesso: false,
        erro: "Dados do usuário incompletos. Por favor, entre em contato com o suporte." 
      });
    }
    
    // Verificar se o e-mail foi confirmado
    if (cliente.email_confirmado !== 1) {
      console.log('E-mail não confirmado para o usuário:', cliente.id);
      return res.status(403).json({ 
        sucesso: false,
        erro: "Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.",
        emailNaoConfirmado: true
      });
    }

    console.log('Cliente autenticado com sucesso:', {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email
    });

    // Preparar resposta de sucesso
    const responseData = { 
      sucesso: true,
      mensagem: "Login realizado com sucesso!",
      userId: cliente.id,
      nome: cliente.nome,
      email: cliente.email || ''
    };

    console.log('Enviando resposta de sucesso:', JSON.stringify(responseData, null, 2));
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Erro no servidor durante o login:', error);
    return res.status(500).json({ 
      sucesso: false,
      erro: "Erro interno do servidor. Por favor, tente novamente mais tarde." 
    });
  }
});

// ----------------------
// ROTA DE AGENDAMENTO (com upload - aceita FormData com até 5 imagens)
// ----------------------
app.post("/agendar", upload.array("imagem", 5), async (req, res) => {
  try {
    // Multer processa FormData e coloca os campos em req.body
    const {
      data,
      horario,
      marca,
      modelo,
      serial,
      tipo,
      descricao,
      clienteId,
    } = req.body;

    // req.files será um array quando upload.array for usado
    const imagens = Array.isArray(req.files) ? req.files.map(f => f.filename) : [];
    // Armazenar nomes das imagens como JSON para flexibilidade
    const imagemField = imagens.length > 0 ? JSON.stringify(imagens) : null;

    // Validação dos campos obrigatórios
    const camposFaltando = [];
    if (!data) camposFaltando.push("data");
    if (!horario) camposFaltando.push("horário");
    if (!marca) camposFaltando.push("marca");
    if (!modelo) camposFaltando.push("modelo");
    if (!tipo) camposFaltando.push("tipo");
    if (!clienteId) camposFaltando.push("clienteId (faça login novamente)");

    if (camposFaltando.length > 0) {
      return res.status(400).json({ 
        erro: `Campos obrigatórios faltando: ${camposFaltando.join(", ")}` 
      });
    }

    // Verificar conflito de horário: impedir double-booking
    if (data && horario) {
      const [exists] = await db.execute('SELECT id FROM agendamentos WHERE data = ? AND horario = ?', [data, horario]);
      if (exists.length > 0) {
        return res.status(409).json({ erro: 'Horário já agendado para a data selecionada. Escolha outro horário.' });
      }
    }

    // Serial e descricao são opcionais, mas se não vierem, usar string vazia
    const serialValue = serial || "";
    const descricaoValue = descricao || "";

    await db.execute(
      "INSERT INTO agendamentos (data, horario, marca, modelo, serial, tipo, descricao, imagem, clienteId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [data, horario, marca, modelo, serialValue, tipo, descricaoValue, imagemField, clienteId]
    );

    res.json({ mensagem: "Agendamento realizado com sucesso!", imagens: imagens });
  } catch (erro) {
    console.error("Erro ao agendar:", erro);
    res.status(500).json({ 
      erro: "Erro ao agendar. Verifique os dados e tente novamente.",
      detalhes: process.env.NODE_ENV === "development" ? erro.message : undefined
    });
  }
});

// ----------------------
// ROTAS DE ORDENS DE SERVIÇO
// ----------------------

// Rota para obter ordens de serviço do usuário
app.get("/api/ordens/usuario/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const [users] = await db.execute(
      "SELECT id FROM clientes WHERE id = ?",
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    
    // Buscar as ordens do usuário (todas, sem filtro de status)
    const [ordens] = await db.execute(
      `SELECT a.*, 
              c.nome as cliente_nome, 
              c.email as cliente_email,
              c.telefone as cliente_telefone
       FROM agendamentos a
       JOIN clientes c ON a.clienteId = c.id
       WHERE a.clienteId = ?
       ORDER BY a.data DESC, a.horario DESC`,
      [userId]
    );
    
    // Formatar os dados para o frontend
    const ordensFormatadas = ordens.map(ordem => {
      // Processar imagens se existirem
      let imagens = [];
      if (ordem.imagens) {
        try {
          // Se for uma string JSON, fazer parse
          if (typeof ordem.imagens === 'string') {
            imagens = JSON.parse(ordem.imagens);
          } else if (Array.isArray(ordem.imagens)) {
            imagens = ordem.imagens;
          }
          // Garantir que as imagens tenham o caminho completo
          imagens = imagens.map(img => {
            if (img && !img.startsWith('http')) {
              return `http://localhost:3000/uploads/${img}`;
            }
            return img;
          });
        } catch (e) {
          console.error('Erro ao processar imagens:', e);
          imagens = [];
        }
      }
      
      return {
        id: ordem.id,
        equipamento: ordem.equipamento || 'Não informado',
        marca: ordem.marca || null,
        modelo: ordem.modelo || null,
        serial: ordem.serial || null,
        tipo: ordem.tipo || null,
        descricao: ordem.descricao || 'Sem descrição',
        data: ordem.data,
        horario: ordem.horario,
        status: ordem.status || 'PENDENTE',
        observacoes: ordem.observacoes || null,
        motivo_cancelamento: ordem.motivo_cancelamento || null,
        data_criacao: ordem.data_criacao,
        imagens: imagens,
        cliente: {
          nome: ordem.cliente_nome,
          email: ordem.cliente_email,
          telefone: ordem.cliente_telefone
        }
      };
    });
    
    res.json(ordensFormatadas);
    
  } catch (erro) {
    console.error("Erro ao buscar ordens:", erro);
    res.status(500).json({ erro: "Erro interno ao buscar ordens de serviço" });
  }
});

// Rota para cancelar uma ordem de serviço
app.post("/api/ordens/:ordemId/cancelar", async (req, res) => {
  try {
    const { ordemId } = req.params;
    const { motivo } = req.body;
    
    console.log('=== EXCLUSÃO DE ORDEM ===');
    console.log('ID da Ordem:', ordemId);
    console.log('Motivo:', motivo);
    console.log('Body completo:', req.body);
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    
    // Validar ordemId
    if (!ordemId || isNaN(ordemId)) {
      console.log('ID da ordem inválido:', ordemId);
      return res.status(400).json({ erro: "ID da ordem inválido" });
    }
    
    // Validar motivo
    if (!motivo || motivo.trim().length === 0) {
      console.log('Motivo da exclusão não fornecido ou vazio');
      return res.status(400).json({ erro: "O motivo da exclusão é obrigatório" });
    }
    
    console.log('Buscando ordem no banco de dados...');
    // Verificar se a ordem existe
    const [ordens] = await db.execute(
      "SELECT * FROM agendamentos WHERE id = ?",
      [ordemId]
    );
    
    console.log('Resultado da busca:', ordens.length, 'ordens encontradas');
    
    if (ordens.length === 0) {
      console.log('Ordem não encontrada:', ordemId);
      return res.status(404).json({ erro: "Ordem de serviço não encontrada" });
    }
    
    const ordem = ordens[0];
    console.log('Ordem encontrada:', {
      id: ordem.id,
      status: ordem.status,
      clienteId: ordem.clienteId
    });
    
    console.log('Executando DELETE direto no banco...');
    // Excluir a ordem diretamente sem verificar status
    const [result] = await db.execute(
      "DELETE FROM agendamentos WHERE id = ?",
      [ordemId]
    );
    
    console.log('Resultado do DELETE:', result);
    console.log('Linhas afetadas:', result.affectedRows);
    console.log('Server info:', result.serverStatus, result.info, result.warningCount);
    
    // Verificar se a exclusão realmente funcionou
    const [verificacao] = await db.execute(
      "SELECT COUNT(*) as total FROM agendamentos WHERE id = ?",
      [ordemId]
    );
    
    console.log('Verificação pós-DELETE:', verificacao[0].total, 'registros restantes com este ID');
    
    if (result.affectedRows === 0) {
      console.log('ERRO: Nenhuma linha foi afetada na exclusão');
      console.log('Verificação pós-DELETE:', verificacao[0].total, 'registros restantes com este ID');
      return res.status(500).json({ erro: "Não foi possível excluir a ordem de serviço do banco de dados" });
    }
    
    console.log('SUCESSO: Ordem cancelada e excluída permanentemente do banco de dados!');
    res.json({ mensagem: "Ordem cancelada e excluída com sucesso" });
    
  } catch (erro) {
    console.error("ERRO ao excluir ordem:", erro);
    console.error("Stack trace:", erro.stack);
    res.status(500).json({ erro: "Erro interno ao excluir a ordem de serviço: " + erro.message });
  }
});

// ----------------------
// Rota de teste para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'Servidor está funcionando corretamente' });
});

// Rota para lidar com rotas não encontradas
app.use((req, res) => {
  // Se for uma rota de API, retorna JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      status: 'erro',
      mensagem: 'Rota da API não encontrada',
      path: req.path,
      method: req.method
    });
  }
  
  // Para rotas do frontend não encontradas, envia o index.html para suporte a SPA
  res.sendFile(join(frontendDir, 'index.html'), (err) => {
    if (err) {
      console.error('Erro ao enviar index.html:', err);
      res.status(500).send('Erro ao carregar a aplicação');
    }
  });
});

// Rota para lidar com rotas não encontradas (não deve ser alcançada devido à rota * acima)
app.use((req, res) => {
  res.status(404).json({ 
    status: 'erro', 
    mensagem: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Manipulador de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Se for um erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'erro',
      mensagem: 'Erro de validação',
      erros: err.errors
    });
  }
  
  // Se for um erro de autenticação
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'erro',
      mensagem: 'Não autorizado',
      detalhes: err.message
    });
  }
  
  // Erro interno do servidor
  res.status(500).json({
    status: 'erro',
    mensagem: 'Erro interno do servidor',
    erro: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Lidar com erros não tratados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado (unhandledRejection):', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Erro não tratado (uncaughtException):', err);
  server.close(() => process.exit(1));
});
