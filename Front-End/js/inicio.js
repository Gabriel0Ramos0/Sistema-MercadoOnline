import { aviso } from "./login.js";

function getCookie(nome) {
    const cookies = document.cookie.split("; ");
    for (let c of cookies) {
        const [chave, valor] = c.split("=");
        if (chave === nome) {
            return decodeURIComponent(valor);
        }
    }
    return null;
}

function carregarDados() {
    const empresaEl = document.getElementById("empresa");
    const usuarioEl = document.getElementById("usuario");

    const nomeEmpresa = getCookie("empresa");
    const idEmpresa = getCookie("idEmpresa");
    const nomeUsuario = getCookie("nome");
    const nomeCliente = getCookie("nomeCliente");

    const nome = nomeUsuario || nomeCliente;

    if (!nome) {
        aviso("Não há um usuário logado no momento! Redirecionando você para a tela de Login!", "alerta");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 4000);
        return;
    }

    if (empresaEl) empresaEl.textContent = nomeEmpresa || "Mercado Online";
    if (usuarioEl) usuarioEl.textContent = `Olá, ${nome}`;

    if (idEmpresa) {
        listaProdutos(idEmpresa);
    } else if (!idEmpresa && nomeCliente) {
        document.getElementById("adicionar").style.display = "none";
        document.getElementById("pesquisas").style.display = "block";
        listaProdutoClientes();
    }
}

function sair() {
    document.cookie = "nomeCliente=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "idCliente=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "idEmpresa=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "empresa=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "nome=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    aviso("Logoff realizado com Sucesso!", "sucesso");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 3000);
}

async function listaProdutos(id_empresa) {
    try {
        const resposta = await fetch(`http://localhost:3000/produto?id_empresa=${id_empresa}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const produtos = await resposta.json();
        const lista = document.getElementById("listaProdutos");
        lista.innerHTML = "";

        produtos.forEach((produto, index) => {
            const divProduto = document.createElement("div");
            divProduto.classList.add("produto");

            divProduto.innerHTML = `
                <img src="${produto.imagem}" alt="Imagem do Produto">
                <div class="descricao">
                    <p id="nomeProduto${index + 1}" class="preto nomeProduto"><b>${produto.nome}</b></p>
                    <p id="descricaoProduto${index + 1}" class="preto descricaoProduto">${produto.descricao}</p>
                    <div class="botoes">
                        <button class="botaoProduto roxo" id="editarProduto${produto.id}">Editar</button>
                        <button class="botaoProduto branco" id="excluirProduto${produto.id}">Excluir</button>
                    </div>
                </div>
            `;

            lista.appendChild(divProduto);

            const btnEditar = document.getElementById(`editarProduto${produto.id}`);
            const btnExcluir = document.getElementById(`excluirProduto${produto.id}`);
            if (btnEditar) {
                btnEditar.addEventListener("click", () => editarProduto(produto.id));
            }

            if (btnExcluir) {
                btnExcluir.addEventListener("click", () => excluirProduto(produto.id));
            }
        });

    } catch (erro) {
        console.error("Erro ao tentar extrair produtos:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

async function listaProdutoClientes() {
    try {

        const resposta = await fetch(`http://localhost:3000/lista-produtos`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const produtos = await resposta.json();
        const lista = document.getElementById("listaProdutos");
        lista.innerHTML = "";

        produtos.forEach((produto, index) => {
            const divProduto = document.createElement("div");
            divProduto.classList.add("produto");

            divProduto.innerHTML = `
                <img src="${produto.imagem}" alt="Imagem do Produto">
                <div class="descricao">
                    <p id="nomeProduto${index + 1}" class="preto nomeProduto"><b>${produto.nome}</b></p>
                    <p id="descricaoProduto${index + 1}" class="preto descricaoProduto">${produto.descricao}</p>
                    <div class="botoes">
                        <div class="contador">
                            <button class="menos roxo">-</button>
                            <input type="number" class="quantidade branco" id="quantidadeProduto${produto.id}" value="1" min="1">
                            <button class="mais roxo">+</button>
                        </div>
                        <button class="botaoProduto branco" id="comprarProduto${produto.id}">Comprar</button>
                    </div>
                </div>
            `;

            lista.appendChild(divProduto);

            const btnComprar = document.getElementById(`comprarProduto${produto.id}`);
            if (btnComprar) {
                btnComprar.addEventListener("click", () => {
                    const emailUsuario = getCookie("email");
                    comprarProduto(produto.id, emailUsuario);
                });
            }

            const btnMais = divProduto.querySelector(".mais");
            const btnMenos = divProduto.querySelector(".menos");
            const inputQuantidade = divProduto.querySelector(".quantidade");

            btnMais.addEventListener("click", () => {
                inputQuantidade.value = parseInt(inputQuantidade.value) + 1;
            });

            btnMenos.addEventListener("click", () => {
                if (parseInt(inputQuantidade.value) > 1) {
                    inputQuantidade.value = parseInt(inputQuantidade.value) - 1;
                }
            });
        });

    } catch (erro) {
        console.error("Erro ao tentar extrair produtos:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

function adicionarProduto() {
    document.getElementById("fundoModal").style.display = "flex";
    document.getElementById("produtoNovo").style.display = "block";

    document.getElementById("usuario").style.display = "none";
    document.getElementById("containerAvatar").style.display = "none";
}

function novaFotoProduto() {
    const inputFoto = document.getElementById("inputFoto");
    const fotoProduto = document.getElementById("fotoProduto");

    inputFoto.addEventListener("change", function (event) {
        const arquivo = event.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = function (e) {
            fotoProduto.style.backgroundImage = `url(${e.target.result})`;
        };
        leitor.readAsDataURL(arquivo);
        inputFoto.value = '';
    });

    inputFoto.click();
}

async function adicionarProdutoNovo() {
    const nome = document.getElementById("NomeProdutoNovo").value.trim();
    const descricao = document.getElementById("informacaoProduto").value.trim();
    const id_empresa = getCookie("idEmpresa");
    const fotoBase64 = document.getElementById("fotoProduto").style.backgroundImage;

    if (!nome || !descricao) {
        aviso("Preencha todos os campos obrigatórios!", "alerta");
        return;
    }

    const base64 = fotoBase64.match(/url\("(.+)"\)/)?.[1] || null;

    try {
        const resposta = await fetch("http://localhost:3000/produto", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                descricao,
                id_empresa,
                imagemBase64: base64
            })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            aviso("Produto adicionado com sucesso!", "sucesso");
            cancelar();
            carregarDados();
        } else {
            aviso("Erro ao salvar produto!", "erro");
        }
    } catch (erro) {
        console.error("Erro ao tentar adicionar produto:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

function cancelar() {
    document.getElementById("fotoProduto").style.backgroundImage = "";
    document.getElementById("fundoModal").style.display = "none";
    document.getElementById("produtoNovo").style.display = "none";
    document.getElementById("NomeProdutoNovo").value = "";
    document.getElementById("informacaoProduto").value = "";
    document.getElementById("adicionarProduto").style.display = "block";
    document.getElementById("salvarEdicao").style.display = "none";
    document.getElementById("produtoExcluir").style.display = "none";
    document.getElementById("usuario").style.display = "block";
    document.getElementById("containerAvatar").style.display = "block";
}

let idS;

async function editarProduto(id) {
    adicionarProduto();
    document.getElementById("adicionarProduto").style.display = "none";
    document.getElementById("salvarEdicao").style.display = "block";
    const id_empresa = getCookie("idEmpresa");
    idS = id;
    try {
        const resposta = await fetch(`http://localhost:3000/produto?id_empresa=${id_empresa}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const produtos = await resposta.json();
        const produto = produtos.find(p => p.id === id);

        if (!produto) {
            console.warn("Produto não encontrado para edição.");
            return;
        }
        const nome = document.getElementById("NomeProdutoNovo");
        const descricao = document.getElementById("informacaoProduto");
        const foto = document.getElementById("fotoProduto");

        nome.value = produto.nome || "";
        descricao.value = produto.descricao || "";
        foto.style.backgroundImage = `url(${produto.imagem})`;
    } catch (erro) {
        console.error("Erro ao tentar salvar produtos:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

function adicionarProdutoCarrinho(idProduto) {
    // Função para adicionar produto ao carrinho
}

// Supondo que você já tem o e-mail do usuário salvo em uma variável
async function comprarProduto(idProduto, emailUsuario, quantidade) {
    const resposta = await fetch("http://localhost:3000/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idProduto, email: emailUsuario, quantidade })
    });
    const resultado = await resposta.json();
    if (resultado.sucesso) {
        aviso("E-mail de confirmação enviado!", "sucesso");
    } else {
        aviso("Erro ao enviar e-mail de confirmação.", "erro");
    }
}

async function salvarEdicao() {
    const nome = document.getElementById("NomeProdutoNovo").value.trim();
    const descricao = document.getElementById("informacaoProduto").value.trim();
    const id_empresa = getCookie("idEmpresa");

    if (!nome || !descricao) {
        aviso("Preencha todos os campos!", "alerta");
        return;
    }

    const estilo = document.getElementById("fotoProduto").style.backgroundImage;
    const match = estilo.match(/url\("(.*)"\)/);
    const imagemBase64 = match ? match[1] : null;

    try {
        const resposta = await fetch(`http://localhost:3000/produto/${idS}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                descricao,
                id_empresa,
                imagemBase64
            })
        });

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(erroTexto);
        }

        aviso("Produto atualizado com sucesso!", "sucesso");
        cancelar();
        carregarDados();
    } catch (erro) {
        console.error("Erro ao editar produto:", erro);
        aviso("Erro ao editar produto!", "erro");
    }
}

let idE;

function excluirProduto(id) {
    document.getElementById("fundoModal").style.display = "flex";
    document.getElementById("produtoExcluir").style.display = "block";

    document.getElementById("usuario").style.display = "none";
    document.getElementById("containerAvatar").style.display = "none";

    idE = id;
}

async function confirmarExclusao() {

    try {
        const resposta = await fetch(`http://localhost:3000/produto/${idE}`, {
            method: "DELETE"
        });

        if (resposta.ok) {
            aviso("Produto excluído com sucesso!", "sucesso");
            cancelar();
            carregarDados();
        } else if (resposta.status === 404) {
            aviso("Produto não encontrado.", "alerta");
        } else {
            aviso("Erro ao excluir o produto.", "erro");
        }
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

function buscarProduto() {
    const termoBusca = document.getElementById("pesquisaProduto").value.trim().toLowerCase();
    const listaProdutos = document.getElementById("listaProdutos");
    const produtos = listaProdutos.getElementsByClassName("produto");

    Array.from(produtos).forEach(produto => {
        const nomeProduto = produto.querySelector(".nomeProduto").textContent.toLowerCase();

        if (nomeProduto.includes(termoBusca)) {
            produto.style.display = "block";
        } else {
            produto.style.display = "none";
        }
    });
}

export {
    carregarDados, sair, adicionarProduto, adicionarProdutoNovo, novaFotoProduto,
    salvarEdicao, cancelar, confirmarExclusao, buscarProduto, getCookie
}