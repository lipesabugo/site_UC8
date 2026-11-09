const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../dados/usuariosRepositorio');

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registrar(req, res) {
  const { nome, email, senha } = req.body ?? {};

  if (typeof nome !== 'string' || typeof email !== 'string' || typeof senha !== 'string'
      || !nome.trim() || !email.trim() || !senha) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e senha' });
  }

  if (!EMAIL_VALIDO.test(email.trim())) {
    return res.status(400).json({ erro: 'Informe um e-mail válido' });
  }

  // o bcrypt só considera os 72 primeiros caracteres da senha
  if (senha.length < 6 || senha.length > 72) {
    return res.status(400).json({ erro: 'A senha deve ter entre 6 e 72 caracteres' });
  }

  const emailNormalizado = email.trim().toLowerCase();

  if (repo.buscarPorEmail(emailNormalizado)) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const usuario = repo.criar(nome.trim(), emailNormalizado, senhaHash);
    res.status(201).json(usuario);
  } catch (erro) {
    // dois cadastros iguais ao mesmo tempo: a restrição UNIQUE do banco barra o segundo
    if (String(erro.message).includes('UNIQUE')) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
    }
    throw erro;
  }
}

async function login(req, res) {
  const { email, senha } = req.body ?? {};

  if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  const usuario = repo.buscarPorEmail(email.trim().toLowerCase());
  const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;

  // mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem conta
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
  });
}

module.exports = { registrar, login };
