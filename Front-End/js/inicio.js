import { decodificarToken, aviso } from "./login.js";

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
    const token = getCookie("token");
    let dadosUsuario = null;
    let nomeCliente = null;

    if (token) {
        try {
            dadosUsuario = decodificarToken(token);
            nomeCliente = dadosUsuario.nome;
        } catch (erro) {
            console.error("Erro ao decodificar o token:", erro);
        }
    }

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
    document.cookie = "idEmpresa=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "empresa=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
                <div class="quantidade-disponivel">${produto.quantidade} un.</div>
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
                        <button class="botaoProduto branco" id="adicionarProdutoCarrinho${produto.id}">Comprar</button>
                    </div>
                </div>
            `;

            lista.appendChild(divProduto);

            const btnComprar = document.getElementById(`adicionarProdutoCarrinho${produto.id}`);
            if (btnComprar) {
                btnComprar.addEventListener("click", () => {
                    adicionarProdutoCarrinho(produto.id);
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
    const quantidade = document.querySelector(".quantidade").value.trim();
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
                quantidade,
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
    document.querySelector(".quantidade").value = 1;
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
        const quantidade = document.querySelector(".quantidade");
        const foto = document.getElementById("fotoProduto");

        nome.value = produto.nome || "";
        descricao.value = produto.descricao || "";
        quantidade.value = produto.quantidade || 1;
        foto.style.backgroundImage = `url(${produto.imagem})`;
    } catch (erro) {
        console.error("Erro ao tentar salvar produtos:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

async function salvarEdicao() {
    const nome = document.getElementById("NomeProdutoNovo").value.trim();
    const descricao = document.getElementById("informacaoProduto").value.trim();
    const quantidade = document.querySelector(".quantidade").value.trim();
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
                quantidade,
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

async function adicionarProdutoCarrinho(idProduto) {
    const token = getCookie("token");

    const dadosUsuario = decodificarToken(token);

    const idCliente = dadosUsuario.id;
    const quantidade = document.getElementById(`quantidadeProduto${idProduto}`).value;

    if (!idProduto) {
        aviso("Selecione um produto para adicionar ao carrinho!", "alerta");
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/produtosCliente`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const produtos = await resposta.json();
        const produto = produtos.find(p => p.id === idProduto);
        const nome = produto.nome;
        const quantidadeValida = produto.quantidade;

        if (!produto) {
            aviso("Produto não encontrado!", "alerta");
            return;
        }

        if (quantidade <= 0 || quantidade > quantidadeValida) {
            if (quantidadeValida === 0) {
                aviso("Produto Esgotado! Atualizando Lista...", "alerta");
                setTimeout(() => {
                    carregarDados();
                }, 4000);
            } else {
                aviso(`Quantidade inválida! Disponível: ${quantidadeValida}`, "alerta");
            }
            return;
        }

        const respostaCarrinhoAtual = await fetch(`http://localhost:3000/carrinho/${idCliente}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const carrinhoAtual = await respostaCarrinhoAtual.json();
        const itemExistente = carrinhoAtual.find(item => item.id_produto === idProduto);

        const quantidadeNoCarrinho = itemExistente ? parseInt(itemExistente.qta_carrinho) : 0;
        const novaQuantidadeTotal = quantidadeNoCarrinho + parseInt(quantidade);

        if (novaQuantidadeTotal > quantidadeValida) {
            if (quantidadeNoCarrinho === quantidadeValida) {
                aviso("Você já atingiu o limite máximo deste produto no carrinho.", "alerta");
            } else {
                atualizarQuantCarrinho(idCliente, idProduto, produto, quantidadeValida);
            }
            return;
        }

        if (itemExistente) {
            atualizarQuantCarrinho(idCliente, idProduto, produto, novaQuantidadeTotal);
        } else {
            const respostaCarrinho = await fetch(`http://localhost:3000/carrinho`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_cliente: idCliente,
                    id_produto: idProduto,
                    nome: nome,
                    qta_carrinho: quantidade
                })
            });
            if (respostaCarrinho.ok) {
                aviso(`Produto ${produto.nome} adicionado ao carrinho!`, "sucesso");
                atualizarCarrinho();
            } else {
                aviso("Erro ao adicionar o produto.", "erro");
            }
        }
    } catch (erro) {
        console.error("Erro ao tentar selecionar produto:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
        return;
    }
}

async function atualizarCarrinho() {
    const token = getCookie("token");

    let dadosUsuario = null;
    let idCliente = null;

    if (token) {
        try {
            dadosUsuario = decodificarToken(token);
            idCliente = dadosUsuario.id;
        } catch (erro) {
            console.error("Erro ao decodificar o token:", erro);
        }
    }

    const listaCarrinho = document.getElementById("listaCarrinho");
    const quantidadeTotalCarrinho = document.getElementById("quantidadeCarrinho");
    listaCarrinho.innerHTML = "";
    try {
        const resposta = await fetch(`http://localhost:3000/carrinho/${idCliente}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const produtosCarrinho = await resposta.json();
        let totalQuantidade = 0;

        produtosCarrinho.forEach(item => {
            const divItem = document.createElement("div");
            divItem.classList.add("item-carrinho");
            divItem.setAttribute("data-id-produto", item.id_produto);

            divItem.innerHTML = `
                <div class="info-produto">
                    <p class="nome-produto"><strong>${item.nome}</strong></p>
                    <p class="quantidade">Qtd: ${item.qta_carrinho}</p>
                </div>
                <button class="botao remover-produto" data-id="${item.id_produto}">🗑 Remover</button>
            `;

            totalQuantidade += item.qta_carrinho;
            listaCarrinho.appendChild(divItem);
        });
        quantidadeTotalCarrinho.textContent = totalQuantidade;

        listaCarrinho.querySelectorAll(".remover-produto").forEach(botao => {
            botao.addEventListener("click", async () => {
                const idProduto = botao.getAttribute("data-id");
                await removerProdutoCarrinho(idProduto);
                atualizarCarrinho();
            });
        });

    } catch (erro) {
        console.error("Erro ao atualizar carrinho:", erro);
    }
}

async function atualizarQuantCarrinho(idCliente, idProduto, produto, novaQuantidadeTotal) {
    try {
        const respostaUpdate = await fetch(`http://localhost:3000/carrinho/${idCliente}/${idProduto}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quantidade: novaQuantidadeTotal
            })
        });

        if (respostaUpdate.ok) {
            aviso(`Quantidade do produto ${produto.nome} atualizada no carrinho!`, "sucesso");
            atualizarCarrinho();
        } else {
            aviso("Erro ao atualizar o carrinho.", "erro");
        }
    } catch (erro) {
        console.error("Erro ao atualizar quantidade no carrinho:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
        return;
    }
}

async function removerProdutoCarrinho(idProduto) {
    const token = getCookie("token");

    const dadosUsuario = decodificarToken(token);

    const idCliente = dadosUsuario.id;

    try {
        const resposta = await fetch(`http://localhost:3000/carrinho/${idCliente}/${idProduto}`, {
            method: "DELETE"
        });

        if (resposta.ok) {
            aviso("Produto removido do carrinho com sucesso!", "sucesso");
        } else if (resposta.status === 404) {
            aviso("Produto não encontrado no carrinho.", "alerta");
        } else {
            aviso("Erro ao remover o produto do carrinho.", "erro");
        }
    } catch (erro) {
        console.error("Erro ao remover produto do carrinho:", erro);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

async function finalizarCompraComConfirmacao() {
    const token = getCookie("token");

    const dadosUsuario = decodificarToken(token);
    const idCliente = dadosUsuario.id;
    const emailUsuario = dadosUsuario.email;
    const listaCarrinho = document.getElementById("listaCarrinho");
    const produtos = [];

    listaCarrinho.querySelectorAll(".item-carrinho").forEach(item => {
        const idProduto = item.getAttribute("data-id-produto");
        const quantidade = parseInt(item.querySelector(".quantidade").textContent || "1");
        produtos.push({ idProduto, quantidade });
    });

    try {
        const respostaEstoque = await fetch("http://localhost:3000/lista-produtos");
        const listaEstoque = await respostaEstoque.json();

        let produtosEsgotados = [];

        for (const produto of produtos) {
            const produtoAtual = listaEstoque.find(p => p.id == produto.idProduto);
            if (!produtoAtual || produtoAtual.quantidade < produto.quantidade) {
                produtosEsgotados.push({ id: produto.idProduto, nome: produtoAtual?.nome || `ID ${produto.idProduto}` });

                await fetch(`http://localhost:3000/carrinho/${idCliente}/${produto.idProduto}`, {
                    method: "DELETE"
                });
            }
        }

        if (produtosEsgotados.length > 0) {
            aviso("Alguns produtos do seu carrinho foram esgotados ou estão com estoque insuficiente. Eles foram removidos automaticamente para você.", "alerta");
            atualizarCarrinho();
            return;
        }

    } catch (erro) {
        console.error("Erro ao verificar estoque:", erro);
        aviso("Erro ao verificar o estoque. Tente novamente.", "erro");
        return;
    }
    try {
        const resposta = await fetch(`http://localhost:3000/finalizar-compra/${idCliente}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (resposta.ok) {
            try {
                const respostaEmail = await fetch("http://localhost:3000/enviarEmail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailUsuario })
                });

                if (respostaEmail.ok) {
                    aviso("Compra finalizada com sucesso! E-mail enviado.", "sucesso");
                    atualizarCarrinho();
                    carregarDados();
                } else {
                    aviso("Erro ao enviar e-mail de confirmação.", "erro");
                }
            } catch (erro) {
                console.error("Erro ao enviar e-mail:", erro);
                aviso("Erro de conexão com o servidor!", "erro");
            }
        } else {
            aviso("Erro ao concluir a compra no servidor.", "erro");
        }
    } catch (erro) {
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

async function limparCarrinho() {
    const token = getCookie("token");

    const dadosUsuario = decodificarToken(token);

    const id = dadosUsuario.id;
    const listaCarrinho = document.getElementById("listaCarrinho");

    if (!listaCarrinho || listaCarrinho.children.length === 0) {
        aviso("Carrinho já está vazio!", "alerta");
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/Limpar-carrinho/${id}`, {
            method: "DELETE"
        });

        if (resposta.ok) {
            aviso("Carrinho Limpo com Sucesso!", "sucesso");
            atualizarCarrinho();
        } else if (resposta.status === 404) {
            aviso("Produtos no carrinho não encontrado.", "alerta");
        } else {
            aviso("Erro ao limpar o carrinho.", "erro");
        }
    } catch (error) {
        console.error("Erro ao limpar carrinho:", error);
        aviso("Erro de conexão com o servidor!", "erro");
    }
}

export {
    carregarDados, sair, adicionarProduto, adicionarProdutoNovo, novaFotoProduto,
    salvarEdicao, cancelar, confirmarExclusao, buscarProduto, finalizarCompraComConfirmacao,
    limparCarrinho, atualizarCarrinho, getCookie
}