const formulario = document.getElementById('formulario');
const tituloForm = document.getElementById('titulo-form');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const botaoEnviar = document.getElementById('botao-enviar');
const botaoAlternar = document.getElementById('botao-alternar');
const mensagem = document.getElementById('mensagem');

let modo = 'login';

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo;
}

function definirModo(novoModo) {
  modo = novoModo;
  const cadastro = modo === 'registro';

  tituloForm.textContent = cadastro ? 'Criar conta' : 'Entrar';
  botaoEnviar.textContent = cadastro ? 'Cadastrar' : 'Entrar';
  botaoAlternar.textContent = cadastro
    ? 'Já tem conta? Entre'
    : 'Ainda não tem conta? Cadastre-se';
  campoNome.style.display = cadastro ? '' : 'none';
  campoSenha.autocomplete = cadastro ? 'new-password' : 'current-password';
  mostrarMensagem('', '');
}

async function pedir(caminho, dados) {
  const resposta = await fetch(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  const corpo = await resposta.json().catch(() => ({}));
  return { ok: resposta.ok, corpo };
}

async function enviar(evento) {
  evento.preventDefault();

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  try {
    if (modo === 'registro') {
      const cadastro = await pedir('/auth/registro', { nome: campoNome.value.trim(), email, senha });
      if (!cadastro.ok) {
        mostrarMensagem(cadastro.corpo.erro || 'Não foi possível cadastrar.', 'erro');
        return;
      }
    }

    const entrada = await pedir('/auth/login', { email, senha });
    if (!entrada.ok) {
      mostrarMensagem(entrada.corpo.erro || 'Não foi possível entrar.', 'erro');
      return;
    }

    localStorage.setItem('token', entrada.corpo.token);
    localStorage.setItem('nomeUsuario', entrada.corpo.usuario.nome);
    window.location.href = 'index.html';
  } catch {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  }
}

formulario.addEventListener('submit', enviar);
botaoAlternar.addEventListener('click', () => {
  definirModo(modo === 'login' ? 'registro' : 'login');
});

definirModo('login');

if (new URLSearchParams(window.location.search).get('sessao') === 'expirada') {
  mostrarMensagem('Sua sessão expirou. Entre novamente.', 'erro');
}
