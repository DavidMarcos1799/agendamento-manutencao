import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Testando envio de e-mail...');
console.log('De:', process.env.EMAIL_USER);

const mailOptions = {
  from: `"Sistema de Agendamento" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  subject: "Teste de E-mail - Sistema de Agendamento",
  html: `
    <h1>Teste de E-mail</h1>
    <p>Se você recebeu este e-mail, a configuração está funcionando!</p>
  `,
};

try {
  await transporter.sendMail(mailOptions);
  console.log('✓ E-mail de teste enviado com sucesso!');
  console.log('Verifique sua caixa de entrada e spam.');
} catch (erro) {
  console.error('✗ Erro ao enviar e-mail:', erro.message);
  console.error('Detalhes:', erro);
}
