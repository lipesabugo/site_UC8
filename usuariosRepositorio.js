const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Os usuários ficam em um arquivo separado do banco da loja (loja.db),
// assim os dois repositórios não sobrescrevem o arquivo um do outro.
const CAMINHO = path.join(__dirname, 'usuarios.db');
let db;

function salvarArquivo() {
  fs.writeFileSync(CAMINHO, Buffer.from(db.export()));
}

function consultar(sql, params = []) {
  const comando = db.prepare(sql);
  comando.bind(params);
  const linhas = [];
  while (comando.step()) {
    linhas.push(comando.getAsObject());
  }
  comando.free();
  return linhas;
}

async function iniciar() {
  const SQL = await initSqlJs();
  db = fs.existsSync(CAMINHO)
    ? new SQL.Database(fs.readFileSync(CAMINHO))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL
    )
  `);

  salvarArquivo();
}

function buscarPorEmail(email) {
  return consultar('SELECT * FROM usuarios WHERE email = ?', [email])[0];
}

function buscarPorId(id) {
  return consultar('SELECT id, nome, email FROM usuarios WHERE id = ?', [id])[0];
}

function criar(nome, email, senhaHash) {
  db.run('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)', [nome, email, senhaHash]);
  const [{ id }] = consultar('SELECT last_insert_rowid() AS id');
  salvarArquivo();
  return buscarPorId(id);
}

module.exports = { iniciar, buscarPorEmail, buscarPorId, criar };
