-- Script para criar o banco de dados e tabelas do sistema de agendamento

CREATE DATABASE IF NOT EXISTS agendamento_pc;
USE agendamento_pc;

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
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

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
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

-- Índices para melhor performance
CREATE INDEX idx_cliente_documento ON clientes(documento);
CREATE INDEX idx_cliente_email ON clientes(email);
CREATE INDEX idx_agendamento_cliente ON agendamentos(clienteId);
CREATE INDEX idx_agendamento_data ON agendamentos(data);

-- Caso a tabela já exista em bancos já criados, adiciona as colunas `cep` e `bairro` se estiverem ausentes
-- (colunas `cep`, `bairro` e recuperação de senha removidas)

