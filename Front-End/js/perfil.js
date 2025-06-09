import { getCookie } from "./inicio.js";
import { aviso } from "./login.js";
export function inicializarPopupUsuario() {
  const iconeUsuario = document.getElementById('iconeUsuario');
  const profilePopup = document.getElementById('profilePopup');
  const popupClose = document.querySelector('.popup-close');
  const salvar = document.getElementById('salvarIcone');
  const inputFoto = document.getElementById('popupAvatarInput');
  const btnAlterarFoto = document.getElementById('alterarPerfil');
  const fotoPreview = document.getElementById('popupAvatar');

  const idEmpresa = getCookie("idEmpresa");
  const nomeCliente = getCookie("nomeCliente");

  if (!idEmpresa && nomeCliente) {
    return;
  }

  inputFoto?.addEventListener('change', function () {
    const file = inputFoto.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        fotoPreview.src = e.target.result;
        iconeUsuario.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Ao clicar no botão, abre o seletor de arquivos
  btnAlterarFoto?.addEventListener('click', function (e) {
    e.preventDefault();
    inputFoto.click();
  });

  // Função para enviar a foto para o backend
  async function enviarFotoPerfil() {
    const id = document.getElementById('popupId').value;
    const file = inputFoto.files[0];
    if (!file) {
      aviso("Selecione uma imagem primeiro.", "alerta");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const imagemBase64 = e.target.result;
      try {
        const response = await fetch(`http://localhost:3000/usuario/${id}/foto`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagemBase64 }),
        });
        if (response.ok) {
          aviso("Foto alterada com sucesso!", "sucesso");
          await loadPopupData();
        } else {
          aviso("Erro ao alterar foto.", "erro");
        }
      } catch (err) {
        aviso("Erro ao enviar foto.", "erro");
      }
    };
    reader.readAsDataURL(file);
  }

  // Chama enviarFotoPerfil ao selecionar uma imagem
  inputFoto?.addEventListener('change', enviarFotoPerfil);

  // Função para carregar dados do perfil do banco de dados
  async function loadPopupData() {
    const id = getCookie('id');
    try {
      const response = await fetch(`http://localhost:3000/usuario?id_usuario=${id}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar dados do usuário.");
      }
      const [user] = await response.json();
      document.getElementById('popupId').value = user.id || '';
      document.getElementById('popupName').value = user.nome || '';
      document.getElementById('popupEmpresa').value = user.empresa ||
        decodeURIComponent(getCookie('empresa') || '');
      document.getElementById('popupEmail').value = user.email || '';
      document.getElementById('popupIdade').value = user.idade || '';
      document.getElementById('popupSenha').value = user.senha || '';
      document.getElementById('popupBio').value = user.descricao || '';

      // Torna os campos não editáveis
      document.getElementById('popupId').readOnly = true;
      document.getElementById('popupName').readOnly = true;
      document.getElementById('popupEmpresa').readOnly = true;
      document.getElementById('popupEmail').readOnly = true;

      // Permite edição apenas nos campos idade, senha e descrição
      document.getElementById('popupIdade').readOnly = false;
      document.getElementById('popupSenha').readOnly = false;
      document.getElementById('popupBio').readOnly = false;

      document.getElementById('popupAvatar').src = user.imagem || "";
      document.getElementById('iconeUsuario').src = user.imagem || "";
    } catch (err) {

    }
  }
  loadPopupData(); // Carrega os dados ao abrir o popup
  function abrirPopup(e) {
    e.stopPropagation();
    profilePopup.style.display = 'block';
    loadPopupData();
  }

  function fecharPopup() {
    profilePopup.style.display = 'none';
  }

  async function atualizarPerfil() {
    try {
      const id = document.getElementById('popupId')?.value.trim();
      const idade = document.getElementById('popupIdade')?.value.trim();
      const senha = document.getElementById('popupSenha')?.value.trim();
      const descricao = document.getElementById('popupBio')?.value.trim();

      if (!idade || !senha || !descricao) {
        aviso("Preencha todos os campos obrigatórios!", "alerta");
        return;
      }

      // Opcional: validar formato da idade
      if (!/^\d+$/.test(idade) || parseInt(idade) <= 0) {
        aviso("Por favor, insira uma idade válida (número inteiro positivo).", "alerta");
        return;
      }

      // Monta o objeto para enviar
      const dadosAtualizados = { idade, senha, descricao };

      // Envia requisição PUT para atualizar
      const response = await fetch(`http://localhost:3000/usuario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados),
      });

      if (response.ok) {
        aviso("Perfil atualizado com sucesso!", "sucesso");
        if (typeof loadPopupData === "function") {
          await loadPopupData();
        }
      } else {
        const errorMessage = await response.text();
        aviso("Erro ao atualizar o perfil. Tente novamente mais tarde.", "erro" + errorMessage);
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      aviso("Erro ao atualizar o perfil. Verifique sua conexão e tente novamente.", "erro");
    }
  }

  // Adicionar eventos
  iconeUsuario.addEventListener('click', abrirPopup);
  popupClose.addEventListener('click', fecharPopup);
  salvar.addEventListener('click', (e) => {
    e.preventDefault();
    atualizarPerfil();
  });
}