import { realizarLogin, novaConta, voltarCadastro, verificarConta } from "./login.js";
import { carregarDados, sair, adicionarProduto, adicionarProdutoNovo, novaFotoProduto, 
         salvarEdicao, confirmarExclusao, cancelar } from "./inicio.js";
import { inicializarPopupUsuario } from "./perfil.js";

document.addEventListener("DOMContentLoaded", () => {
    const botaoLogin = document.getElementById("entrar");
    const botaocriarConta = document.getElementById("criarConta");
    const cadastrarCliente = document.getElementById("cadastrarCliente");
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
        botaocriarConta.addEventListener("click", novaConta);
        voltar.addEventListener("click", voltarCadastro);
        cadastrarCliente.addEventListener("click", verificarConta);
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