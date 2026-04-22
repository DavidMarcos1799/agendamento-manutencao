# Instruções para adicionar o projeto no GitHub

## Passo 1: Criar repositório no GitHub
1. Acesse https://github.com
2. Faça login na sua conta
3. Clique no botão "+" no canto superior direito e selecione "New repository"
4. Dê um nome ao repositório (sugestão: `agendamento-manutencao`)
5. Escolha entre público ou privado
6. **NÃO** marque as opções "Initialize with README", "Add .gitignore" ou "Add license"
7. Clique em "Create repository"

## Passo 2: Conectar o repositório local ao GitHub
Depois de criar o repositório, o GitHub vai mostrar algumas opções. Escolha a opção "push an existing repository from the command line" e execute os seguintes comandos no terminal (substitua SEU_USERNAME pelo seu usuário do GitHub):

```bash
git remote add origin https://github.com/SEU_USERNAME/agendamento-manutencao.git
git branch -M main
git push -u origin main
```

## Passo 3: Verificar
Após executar os comandos, seu projeto estará disponível em:
https://github.com/SEU_USERNAME/agendamento-manutencao

## Arquivos incluídos
- Sistema de agendamento de manutenção (backend e frontend)
- Documentação completa
- Banco de dados SQL
- Arquivos de configuração

## Arquivos excluídos (via .gitignore)
- node_modules/
- arquivos de ambiente (.env)
- uploads/
- repositórios Git aninhados
- arquivos temporários e de cache

## Observações
- O projeto já está configurado com um .gitignore apropriado
- Já foi feito o commit inicial com todos os arquivos necessários
- Subdiretórios que são repositórios Git separados foram ignorados para evitar conflitos
