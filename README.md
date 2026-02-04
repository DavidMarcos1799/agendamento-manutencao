# 🖥️ Sistema de Agendamento de Manutenção

Um sistema web completo para gerenciamento de ordens de serviço de manutenção de equipamentos.

## 📋 Descrição

Este sistema permite que clientes agendem serviços de manutenção, acompanhem o status e gerenciem suas ordens de serviço de forma simples e intuitiva.

## ✨ Funcionalidades

- 🔐 **Cadastro e Login de Usuários**
- 📅 **Agendamento Online de Serviços**
- 📋 **Gerenciamento de Ordens de Serviço**
- 📱 **Interface Responsiva**
- 🖼️ **Upload de Imagens**
- 📊 **Acompanhamento de Status**
- ❌ **Cancelamento de Ordens**
- 🔔 **Sistema de Notificações**

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Bootstrap (responsividade)

### Backend
- Node.js
- Express.js
- MySQL

### Banco de Dados
- MySQL (XAMPP)

## 🚀 Como Usar

### Pré-requisitos
- Node.js instalado
- XAMPP (Apache + MySQL)
- Navegador web moderno

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/agendamento-manutencao.git
cd agendamento-manutencao
```

2. **Configure o Banco de Dados**
```bash
# Inicie o MySQL no XAMPP
# Crie o banco de dados
mysql -u root -p
CREATE DATABASE agendamento_pc;
USE agendamento_pc;
SOURCE backend/update-db.js;
```

3. **Instale as Dependências do Backend**
```bash
cd backend
npm init -y
npm install express mysql2 bcrypt cors
```

4. **Inicie o Servidor Backend**
```bash
node server.js
```

5. **Configure o Frontend**
- Abra o XAMPP
- Inicie o Apache
- Acesse `http://localhost/agendamento-manutencao/frontend`

## 📁 Estrutura do Projeto

```
agendamento-manutencao/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── update-db.js           # Script do banco
│   └── package.json           # Dependências
├── frontend/
│   ├── index.html             # Página inicial
│   ├── login.html             # Login
│   ├── register.html          # Cadastro
│   ├── agendamento.html       # Agendamento
│   ├── minhas-ordens.html     # Ordens do cliente
│   ├── css/
│   │   └── style.css          # Estilos
│   └── js/
│       ├── notifications.js   # Notificações
│       └── auth.js            # Autenticação
└── README.md                   # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` no backend:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=agendamento_pc
PORT=3000
JWT_SECRET=seu_segredo_aqui
```

### Banco de Dados
- **Tabela Principal**: `agendamentos`
- **Tabela de Usuários**: `clientes`
- **Relacionamento**: 1:N (cliente → ordens)

## 📱 Funcionalidades Detalhadas

### Cadastro e Login
- Validação de email único
- Hash de senhas com bcrypt
- Sessão persistente

### Agendamento
- Formulário completo
- Upload de até 5 imagens
- Calendário interativo
- Validação de datas/horários

### Gerenciamento de Ordens
- Listagem completa
- Status em tempo real
- Cancelamento com motivo
- Interface responsiva

## 🎨 Interface

- **Design Moderno**: Limpo e profissional
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Intuitiva**: Fácil de usar
- **Acessível**: Boas práticas de acessibilidade

## 🔒 Segurança

- Hash de senhas (bcrypt)
- Prevenção de SQL Injection
- Validação de inputs
- CORS configurado
- Sessões seguras

## 📊 Status das Ordens

- 🟡 **PENDENTE**: Aguardando confirmação
- 🔵 **EM_ANDAMENTO**: Serviço em execução
- 🟢 **CONCLUIDO**: Serviço finalizado
- 🔴 **CANCELADO**: Ordem cancelada

## 🚀 Deploy

### Produção
1. Configure variáveis de ambiente
2. Use HTTPS
3. Configure firewall
4. Monitore logs

### Heroku (Exemplo)
```bash
# Adicione o Procfile
web: node backend/server.js

# Deploy
git push heroku main
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👤 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu-email@exemplo.com

## 🙏 Agradecimentos

- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express.js](https://expressjs.com/) - Framework web
- [MySQL](https://www.mysql.com/) - Banco de dados
- [Bootstrap](https://getbootstrap.com/) - Framework CSS

## 📞 Suporte

Para suporte, envie um email para seu-email@exemplo.com ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ usando tecnologias modernas!**
