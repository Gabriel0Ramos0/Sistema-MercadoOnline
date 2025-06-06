import { realizarLogin, realizarLoginCliente, novaConta, voltarCadastro, solicitarCodigoValidacao, verificarConta } from "./login.js";
import { carregarDados, sair, adicionarProduto, adicionarProdutoNovo, novaFotoProduto, 
         salvarEdicao, confirmarExclusao, cancelar } from "./inicio.js";
import { inicializarPopupUsuario } from "./perfil.js";

document.addEventListener("DOMContentLoaded", () => {
    const botaoLogin = document.getElementById("entrar");
    const botaoLoginCliente = document.getElementById("entrarCliente");
    const botaocriarConta = document.getElementById("criarConta");
    const cadastrarCliente = document.getElementById("cadastrarCliente");
    const botaoValidarEmail = document.getElementById("ValidarEmail");
    const telaInicio = document.getElementById("cabecalho");
    const adicionar = document.getElementById("adicionar");
    const produtoNovo = document.getElementById("adicionarProduto");
    const imagemNovoP = document.getElementById("iconeProduto");
    const edicao = document.getElementById("salvarEdicao");
    const sairAdicao = document.getElementById("cancelar");
    const voltar = document.getElementById("voltar");
    const excluir = document.getElementById("confirmarExclusao");
    const sairExclusao = document.getElementById("cancelarExclusao");

    if (botaoLogin) {
        botaoLogin.addEventListener("click", realizarLogin);
        botaoLoginCliente.addEventListener("click", realizarLoginCliente);
        botaocriarConta.addEventListener("click", novaConta);
        voltar.addEventListener("click", voltarCadastro);
        cadastrarCliente.addEventListener("click", verificarConta);
        botaoValidarEmail.addEventListener("click", solicitarCodigoValidacao);
    }

    if (telaInicio) {
        carregarDados();
        document.getElementById("sair").addEventListener("click", sair);
        adicionar.addEventListener("click", adicionarProduto);
        produtoNovo.addEventListener("click", adicionarProdutoNovo)
        imagemNovoP.addEventListener("click", novaFotoProduto);
        edicao.addEventListener("click", salvarEdicao);
        sairAdicao.addEventListener("click", cancelar);
        excluir.addEventListener("click", confirmarExclusao);
        sairExclusao.addEventListener("click", cancelar);
        inicializarPopupUsuario();
    }
})