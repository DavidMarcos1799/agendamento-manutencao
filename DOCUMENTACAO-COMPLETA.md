# Documentação Completa - Sistema de Agendamento de Manutenção PC

## Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Backend - API](#backend---api)
4. [Frontend - Páginas](#frontend---páginas)
5. [Banco de Dados](#banco-de-dados)
6. [Tecnologias Utilizadas](#tecnologias-utilizadas)
7. [Instalação e Configuração](#instalação-e-configuração)
8. [Guia de Uso](#guia-de-uso)

---

## Visão Geral

Sistema completo de agendamento de manutenção para computadores e notebooks, desenvolvido com Node.js, Express, MySQL e frontend HTML/CSS/JavaScript.

### Funcionalidades Principais
- Cadastro e autenticação de usuários
- Agendamento online de manutenção (preventiva/corretiva)
- Upload de imagens dos equipamentos
- Confirmação de e-mail
- Recuperação de senha
- Painel do usuário com histórico de ordens
- Cancelamento de ordens de serviço

---

## Estrutura do Projeto

```
agendamento-manutenção/
|
|--- backend/                    # Servidor Node.js
|    |--- server.js             # Servidor principal Express
|    |--- database.sql          # Script do banco de dados
|    |--- verificar-banco.js   # Utilitário de verificação
|    |--- uploads/              # Arquivos de upload
|    |--- .env                  # Variáveis de ambiente
|    |--- package.json          # Dependências backend
|
|--- frontend/                   # Interface web
|    |--- index.html            # Página inicial
|    |--- login-new.html        # Login
|    |--- cadastro.html         # Cadastro
|    |--- agendamento.html      # Formulário de agendamento
|    |--- minhas-ordens.html    # Painel do usuário
|    |--- recuperar-senha.html  # Recuperação de senha
|    |--- alterar-senha.html    # Alteração de senha
|    |--- redefinir-senha.html  # Redefinição com token
|    |--- css/                  # Estilos
|    |--- js/                   # JavaScript frontend
|
|--- scripts/                    # Scripts utilitários
|--- package.json               # Dependências gerais
|--- check_table.js            # Verificação de tabelas
```

---

## Backend - API

### Rotas da API

#### Autenticação
- `POST /login` - Login de usuário
- `POST /cadastro` - Cadastro de novo usuário
- `GET /confirmar-email` - Confirmação de e-mail com token
- `POST /recuperar-senha` - Solicitar recuperação de senha
- `POST /reset-password` - Redefinir senha
- `GET /reset-password` - Página de redefinição

#### Agendamentos
- `POST /agendar` - Criar novo agendamento (com upload de até 5 imagens)
- `GET /agendamentos` - Consultar horários ocupados por data
- `GET /api/ordens/usuario/:userId` - Listar ordens do usuário
- `POST /api/ordens/:ordemId/cancelar` - Cancelar ordem de serviço

#### Utilitários
- `GET /api` - Rota de teste do servidor
- `GET /api/health` - Verificação de saúde do sistema
- `GET /` - Página inicial (serve index.html)

### Estrutura das Requisições

#### POST /cadastro
```json
{
  "nome": "Nome do Cliente",
  "documento": "12345678901",
  "cep": "00000000",
  "endereco": "Rua Exemplo, 123",
  "bairro": "Centro",
  "telefone": "11999999999",
  "email": "cliente@email.com",
  "senha": "senha123"
}
```

#### POST /login
```json
{
  "email": "cliente@email.com",
  "senha": "senha123"
}
```

#### POST /agendar (FormData)
```
data: 2024-12-25
horario: 14:00
marca: Dell
modelo: Inspiron 15
serial: ABC123
tipo: preventiva
descricao: Formatação e limpeza
imagem: [arquivo1.jpg, arquivo2.jpg]
```

### Middleware e Configurações

- **CORS**: Configurado para permitir requisições do frontend
- **Multer**: Upload de arquivos (máximo 5 imagens, 10MB cada)
- **JSON Parser**: Processar corpo das requisições
- **Static Files**: Servir arquivos estáticos do frontend
- **Logging**: Middleware para log de requisições

---

## Frontend - Páginas

### Página Inicial (`index.html`)
- Landing page com informações do serviço
- Links para login e cadastro
- Design responsivo

### Login (`login-new.html`)
- Formulário de autenticação
- Validação de e-mail e senha
- Redirecionamento após login

### Cadastro (`cadastro.html`)
- Formulário completo de cadastro
- Validação de CPF/CNPJ
- Máscara para CEP e telefone
- Verificação de e-mail duplicado

### Agendamento (`agendamento.html`)
- Formulário de agendamento de manutenção
- Calendário interativo para seleção de data
- Upload de múltiplas imagens
- Tipos de manutenção (preventiva/corretiva)

### Painel do Usuário (`minhas-ordens.html`)
- Lista de ordens de serviço
- Status das ordens (pendente/confirmada/cancelada)
- Detalhes completos de cada ordem
- Opção de cancelamento

### Recuperação de Senha
- `recuperar-senha.html`: Solicitar recuperação
- `redefinir-senha.html`: Redefinir com token
- `alterar-senha.html`: Alteração direta

### Estilos e JavaScript
- **CSS**: Design moderno com animações
- **JavaScript**: Validações, máscaras, interações
- **Responsivo**: Funciona em mobile e desktop

---

## Banco de Dados

### Estrutura MySQL

#### Tabela: clientes
```sql
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(14) NOT NULL UNIQUE,
    endereco TEXT NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    email_confirmado BOOLEAN DEFAULT FALSE,
    token_confirmacao VARCHAR(255) NULL,
    token_expiracao DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: agendamentos
```sql
CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    serial VARCHAR(100) NOT NULL,
    tipo ENUM('preventiva', 'corretiva') NOT NULL,
    descricao TEXT NOT NULL,
    imagem TEXT NULL,
    clienteId INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
);
```

### Índices de Performance
- `idx_cliente_documento`: Otimiza busca por CPF/CNPJ
- `idx_cliente_email`: Otimiza busca por e-mail
- `idx_agendamento_cliente`: Otimiza busca por cliente
- `idx_agendamento_data`: Otimiza busca por data

### Relacionamentos
- Um cliente pode ter múltiplos agendamentos
- Exclusão em cascata: cliente deletado remove seus agendamentos

---

## Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **MySQL2**: Driver do banco de dados
- **Bcrypt**: Criptografia de senhas
- **JWT**: Tokens de autenticação
- **Multer**: Upload de arquivos
- **Nodemailer**: Envio de e-mails
- **Crypto**: Geração de tokens
- **CORS**: Compartilhamento de recursos
- **Dotenv**: Variáveis de ambiente

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com animações
- **JavaScript ES6+**: Lógica e interações
- **Font Awesome**: Ícones
- **Google Fonts**: Tipografia

### Banco de Dados
- **MySQL**: Sistema de gerenciamento
- **XAMPP**: Pacote de desenvolvimento

### Ferramentas
- **NPM**: Gerenciador de pacotes
- **VS Code**: Editor de código
- **Git**: Controle de versão

---

## Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- XAMPP com MySQL
- Navegador web moderno

### Passo a Passo

1. **Clonar o projeto**
```bash
git clone [repositório]
cd agendamento-manutenção
```

2. **Instalar dependências**
```bash
npm install
cd backend
npm install
```

3. **Configurar XAMPP**
- Iniciar o serviço MySQL
- Criar banco de dados `agendamento_pc`
- Executar o script `backend/database.sql`

4. **Configurar variáveis de ambiente**
Criar arquivo `backend/.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
EMAIL_ENABLED=true
```

5. **Verificar banco de dados**
```bash
node backend/verificar-banco.js
```

6. **Iniciar servidor**
```bash
npm start
```

7. **Acessar sistema**
```
http://localhost:3000
```

---

## Guia de Uso

### Para Usuários

1. **Cadastro**
   - Acessar página inicial
   - Clicar em "Cadastre-se"
   - Preencher formulário completo
   - Confirmar e-mail recebido

2. **Login**
   - Usar e-mail e senha cadastrados
   - Será redirecionado para o painel

3. **Agendamento**
   - Preencher dados do equipamento
   - Selecionar data e horário disponíveis
   - Anexar fotos se necessário
   - Confirmar agendamento

4. **Painel**
   - Visualizar ordens de serviço
   - Ver status de cada ordem
   - Cancelar se necessário

### Para Administradores

1. **Acesso ao banco**
```bash
mysql -u root -p
USE agendamento_pc;
```

2. **Consultar agendamentos**
```sql
SELECT * FROM agendamentos WHERE data = CURDATE();
```

3. **Verificar usuários**
```sql
SELECT nome, email, created_at FROM clientes ORDER BY created_at DESC;
```

### Manutenção do Sistema

1. **Backup do banco**
```bash
mysqldump -u root -p agendamento_pc > backup.sql
```

2. **Limpar uploads antigos**
```bash
# Manualmente em backend/uploads/
```

3. **Verificar logs**
- Console do servidor Node.js
- Logs de erro do MySQL

---

## Considerações de Segurança

- Senhas criptografadas com bcrypt
- Tokens JWT para sessão
- Validação de dados no backend
- Upload restrito a imagens
- Proteção contra SQL injection
- CORS configurado

---

## Problemas Comuns

### MySQL não conecta
- Verificar se XAMPP está rodando
- Confirmar banco `agendamento_pc` existe
- Verificar usuário/senha MySQL

### Upload não funciona
- Verificar pasta `backend/uploads/`
- Confirmar permissões de escrita
- Limitar tamanho dos arquivos

### E-mails não enviam
- Configurar `.env` corretamente
- Verificar configuração SMTP
- Usar senha de app Gmail

---

## Desenvolvimento Futuro

Sugestões de melhorias:
- Sistema de notificações
- Chat online com suporte
- Integração com pagamento
- App mobile
- Dashboard administrativo
- Relatórios e estatísticas

---

*Documentação gerada automaticamente - Sistema de Agendamento de Manutenção PC v1.0*
