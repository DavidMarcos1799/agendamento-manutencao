# Configuração de E-mail para Confirmação de Cadastro

## Como Configurar

A confirmação de cadastro via e-mail é **opcional**. Se não configurar, o sistema funcionará normalmente, mas não enviará e-mails.

### Para Gmail:

1. **Ative a verificação em duas etapas** na sua conta Google
2. **Gere uma senha de app**: 
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Outro (nome personalizado)"
   - Digite "Sistema de Agendamento"
   - Copie a senha gerada (16 caracteres)

3. **Configure as variáveis de ambiente** no arquivo `.env` na pasta `backend`:

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_gerada
```

### Para Outros Provedores:

- **Outlook/Hotmail**: `smtp-mail.outlook.com` (porta 587)
- **Yahoo**: `smtp.mail.yahoo.com` (porta 587)
- **Servidor próprio**: Configure conforme seu provedor

### Desabilitar E-mail:

Se não quiser usar e-mail, simplesmente não configure as variáveis ou defina:

```env
EMAIL_ENABLED=false
```

## Instalação de Dependências

Execute no diretório `backend`:

```bash
npm install nodemailer
```

## Atualizar Banco de Dados

Execute o script `database.sql` atualizado para adicionar os campos de confirmação:

```sql
ALTER TABLE clientes 
ADD COLUMN email_confirmado BOOLEAN DEFAULT FALSE,
ADD COLUMN token_confirmacao VARCHAR(255) NULL,
ADD COLUMN token_expiracao DATETIME NULL;
```

Ou execute o arquivo `database.sql` completo novamente.

