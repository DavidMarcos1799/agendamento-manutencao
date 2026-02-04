#!/bin/bash

echo "🚀 Iniciando configuração do Git para o projeto..."

# Verifica se o Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado. Por favor, instale o Git primeiro."
    exit 1
fi

# Inicializa o repositório Git
echo "📁 Inicializando repositório Git..."
git init

# Configura o usuário (se ainda não estiver configurado)
echo "👤 Configurando usuário do Git..."
read -p "Digite seu nome: " GIT_NAME
read -p "Digite seu email: " GIT_EMAIL

git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"

# Adiciona todos os arquivos
echo "📋 Adicionando arquivos ao Git..."
git add .

# Cria o primeiro commit
echo "💾 Criando commit inicial..."
git commit -m "🚀 Initial commit: Sistema de Agendamento de Manutenção

- Sistema completo de agendamento online
- Cadastro e autenticação de usuários
- Gerenciamento de ordens de serviço
- Interface responsiva e moderna
- Sistema de cancelamento de ordens
- Upload de imagens
- Notificações em tempo real

Tecnologias:
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express.js
- Banco: MySQL"

echo "✅ Repositório Git configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Crie um repositório no GitHub: https://github.com/new"
echo "2. Copie a URL do repositório (ex: https://github.com/seu-usuario/agendamento-manutencao.git)"
echo "3. Execute: git remote add origin <URL_DO_REPOSITORIO>"
echo "4. Execute: git push -u origin main"
echo ""
echo "🎉 Seu projeto está pronto para ser enviado ao GitHub!"
