import { realizarLogin, realizarLoginCliente, novaConta, voltarCadastro, solicitarCodigoValidacao, verificarConta } from "./login.js";
import { carregarDados, sair, adicionarProduto, adicionarProdutoNovo, novaFotoProduto, 
         salvarEdicao, confirmarExclusao, cancelar, buscarProduto, comprarProduto, 
         limparCarrinho, finalizarCompraComConfirmacao} from "./inicio.js";
import { inicializarPopupUsuario, fecharCarrinho } from "./perfil.js";

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
    const buscar = document.getElementById("buscar");
    const fecharTelaCarrinho = document.getElementById("fecharCarrinho");
    const maisProdutos = document.getElementById("mais");
    const menosProdutos = document.getElementById("menos");
    const inputQuantidade = document.querySelector(".quantidade");
    const limparCarrinhoProduto = document.getElementById("limparCarrinho");
    const finalizarCompraCarrinho = document.getElementById("finalizarCompra");
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
        buscar.addEventListener("click", buscarProduto);
        inicializarPopupUsuario();
        fecharTelaCarrinho.addEventListener("click", fecharCarrinho);
        maisProdutos.addEventListener("click", () => {
            inputQuantidade.value = parseInt(inputQuantidade.value) + 1;
        });
        menosProdutos.addEventListener("click", () => {
            inputQuantidade.value = parseInt(inputQuantidade.value) - 1;
        });
       
        limparCarrinhoProduto.addEventListener("click", limparCarrinho);
    }
    if (finalizarCompraCarrinho) {
    finalizarCompraCarrinho.addEventListener("click", finalizarCompraComConfirmacao);
}
})