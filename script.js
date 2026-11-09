const API = '/produtos';

const formulario = document.getElementById('formulario');
const campoNome = document.getElementById('nome');
const campoPreco = document.getElementById('preco');
const tituloForm = document.getElementById('titulo-form');
const botaoSalvar = document.getElementById('botao-salvar');
const botaoCancelar = document.getElementById('botao-cancelar');
const mensagem = document.getElementById('mensagem');
const lista = document.getElementById('lista');
const barraUsuario = document.getElementById('barra-usuario');

const token = localStorage.getItem('token');
const nomeUsuario = localStorage.getItem('nomeUsuario');
const logado = Boolean(token);

let idEmEdicao = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo;
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cabecalhos() {
  const cabecalho = { 'Content-Type': 'application/json' };
  if (token) cabecalho.Authorization = `Bearer ${token}`;
  return cabecalho;
}

function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('nomeUsuario');
}

function sair() {
  limparSessao();
  window.location.href = 'index.html';
}

function sessaoExpirada() {
  limparSessao();
  window.location.href = 'login.html?sessao=expirada';
}

function montarBarraUsuario() {
  barraUsuario.textContent = '';

  if (logado) {
    const saudacao = document.createElement('span');
    saudacao.textContent = `Olá, ${nomeUsuario || 'usuário'}!`;

    const botaoSair = document.createElement('button');
    botaoSair.type = 'button';
    botaoSair.textContent = 'Sair';
    botaoSair.addEventListener('click', sair);

    barraUsuario.append(saudacao, botaoSair);
  } else {
    const link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = 'Entrar ou criar conta';
    barraUsuario.append(link);
  }
}

function criarItem(produto) {
  const item = document.createElement('li');

  const info = document.createElement('div');
  const nome = document.createElement('strong');
  nome.textContent = produto.nome;
  const preco = document.createElement('div');
  preco.className = 'preco';
  preco.textContent = formatarPreco(produto.preco);
  info.append(nome, preco);

  item.append(info);

  // só quem está logado vê os botões de editar e apagar
  if (logado) {
    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.className = 'editar';
    botaoEditar.addEventListener('click', () => iniciarEdicao(produto));

    const botaoApagar = document.createElement('button');
    botaoApagar.textContent = 'Apagar';
    botaoApagar.className = 'apagar';
    botaoApagar.addEventListener('click', () => apagarProduto(produto));

    const botoes = document.createElement('div');
    botoes.className = 'botoes';
    botoes.append(botaoEditar, botaoApagar);

    item.append(botoes);
  }

  return item;
}

async function carregarProdutos() {
  lista.textContent = 'Carregando...';

  try {
    const resposta = await fetch(API);
    const produtos = await resposta.json();

    lista.textContent = '';
    if (produtos.length === 0) {
      lista.textContent = 'Nenhum produto cadastrado.';
      return;
    }
    produtos.forEach(produto => lista.append(criarItem(produto)));
  } catch {
    lista.textContent = 'Não foi possível carregar os produtos.';
  }
}

async function salvarProduto(evento) {
  evento.preventDefault();

  const dados = { nome: campoNome.value.trim(), preco: Number(campoPreco.value) };
  const url = idEmEdicao ? `${API}/${idEmEdicao}` : API;
  const metodo = idEmEdicao ? 'PUT' : 'POST';

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: cabecalhos(),
      body: JSON.stringify(dados)
    });

    if (resposta.status === 401) {
      sessaoExpirada();
      return;
    }

    const corpo = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(corpo.erro, 'erro');
      return;
    }

    mostrarMensagem(idEmEdicao ? 'Produto atualizado!' : 'Produto cadastrado!', 'sucesso');
    cancelarEdicao();
    carregarProdutos();
  } catch {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  }
}

function iniciarEdicao(produto) {
  idEmEdicao = produto.id;
  campoNome.value = produto.nome;
  campoPreco.value = produto.preco;
  tituloForm.textContent = `Editando: ${produto.nome}`;
  botaoSalvar.textContent = 'Salvar alterações';
  botaoCancelar.hidden = false;
  mostrarMensagem('', '');
  campoNome.focus();
}

function cancelarEdicao() {
  idEmEdicao = null;
  formulario.reset();
  tituloForm.textContent = 'Cadastrar produto';
  botaoSalvar.textContent = 'Cadastrar';
  botaoCancelar.hidden = true;
}

async function apagarProduto(produto) {
  if (!confirm(`Apagar "${produto.nome}"?`)) return;

  try {
    const resposta = await fetch(`${API}/${produto.id}`, {
      method: 'DELETE',
      headers: cabecalhos()
    });

    if (resposta.status === 401) {
      sessaoExpirada();
      return;
    }

    if (!resposta.ok) {
      mostrarMensagem('Não foi possível apagar o produto.', 'erro');
      return;
    }

    if (idEmEdicao === produto.id) cancelarEdicao();
    mostrarMensagem('Produto apagado!', 'sucesso');
    carregarProdutos();
  } catch {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  }
}

formulario.addEventListener('submit', salvarProduto);
botaoCancelar.addEventListener('click', () => {
  cancelarEdicao();
  mostrarMensagem('', '');
});

montarBarraUsuario();

// quem não está logado só pode ver a lista, sem o formulário de cadastro
if (!logado) formulario.style.display = 'none';

carregarProdutos();
