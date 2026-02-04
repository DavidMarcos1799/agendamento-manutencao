import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

/**
 * Authenticate user with document and password
 * @param {string} documento - User document (CPF/CNPJ)
 * @param {string} senha - User password
 * @returns {Promise<Object>} User data without password
 */
export const authenticateUser = async (documento, senha) => {
  try {
    // Clean document (remove non-numeric characters)
    const documentoLimpo = documento.replace(/\D/g, '');
    
    // Find user by document
    const [rows] = await db.execute(
      'SELECT id, nome, email, senha, email_confirmado FROM clientes WHERE documento = ?',
      [documentoLimpo]
    );

    // Check if user exists
    if (!rows.length) {
      throw new Error('Dados incorretos');
    }

    const user = rows[0];

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new Error('Dados incorretos');
    }

    // Check if email is confirmed
    if (!user.email_confirmado) {
      throw new Error('Por favor, confirme seu e-mail antes de fazer login');
    }

    // Remove password from user object
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User data
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Middleware to protect routes that require authentication
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token de autenticação não fornecido' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido ou expirado' 
      });
    }

    // Add user to request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro na autenticação' 
    });
  }
};
