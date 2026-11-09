require('dotenv').config({ quiet: true });

const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const repo = require('./dados/produtosRepositorio');
const usuariosRepo = require('./dados/usuariosRepositorio');

if (!process.env.JWT_SECRET) {
  console.log('Faltou o JWT_SECRET. Crie o arquivo .env na raiz do projeto com a linha JWT_SECRET=seu_segredo');
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);
app.use('/produtos', produtosRoutes);

Promise.all([repo.iniciar(), usuariosRepo.iniciar()])
  .then(() => {
    app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
  })
  .catch(erro => console.log('Erro ao abrir o banco de dados:', erro));
