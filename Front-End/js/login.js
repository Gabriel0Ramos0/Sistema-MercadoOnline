
async function realizarLogin() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        aviso("Preencha todos os campos!", "alerta");
        return;
    }

    try {
        const resposta = await fetch("http://localhost:3000/validar-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const resultado = await resposta.json();

        if (resultado && resultado.sucesso) {
            const { id, nome, empresa, nomeEmpresa } = resultado;
            aviso("Acesso Autorizado!", "sucesso");

            document.cookie = `id=${id}; path=/; max-age=3600`;
            document.cookie = `nome=${encodeURIComponent(nome)}; path=/; max-age=3600`;
            document.cookie = `email=${encodeURIComponent(email)}; path=/; max-age=3600`;
            document.cookie = `idEmpresa=${encodeURIComponent(empresa)}; path=/; max-age=3600`;
            document.cookie = `empresa=${encodeURIComponent(nomeEmpresa)}; path=/; max-age=3600`;

            setTimeout(() => {
                window.location.href = "inicio.html";
            }, 5000);
        } else {
            aviso("E-mail ou senha incorretos.", "erro");
        }

    } catch (erro) {
        console.error("Erro ao tentar logar:", erro);
        aviso("Erro de conexão com o servidor.", "erro");
    }
}

function decodificarToken(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        // Ajusta base64 para base64 padrão (substitui '-' e '_')
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        // Decodifica base64 para string JSON
        const jsonPayload = decodeURIComponent(
            atob(base64)
            .split('')
            .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Erro ao decodificar token:', e);
        return null;
    }
}

async function realizarLoginCliente() {
    const email = document.getElementById("emailClienteAcesso").value.trim();
    const senha = document.getElementById("senhaClienteAcesso").value;
    
    if (!email || !senha) {
        aviso("Preencha todos os campos!", "alerta");
        return;
    }

    try {
        const resposta = await fetch("http://localhost:3000/validar-login-cliente", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const resultado = await resposta.json();

        if (resultado && resultado.sucesso) {
            const { id , nome, token } = resultado;

            // Decodifica o token manualmente, sem biblioteca
            const dadosUsuario = decodificarToken(token);
            console.log(id, nome, token);
            console.log("Token recebido:", token);
            console.log("Dados do usuário decodificados:", dadosUsuario);

            aviso("Acesso Autorizado!", "sucesso");
    
            document.cookie = `idCliente=${id}; path=/; max-age=3600`;
            document.cookie = `nomeCliente=${encodeURIComponent(nome)}; path=/; max-age=3600`;
            document.cookie = `email=${encodeURIComponent(email)}; path=/; max-age=3600`;
            document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=3600`;   

            setTimeout(() => {
                window.location.href = "inicio.html";
            }, 5000);
        } else {
            aviso("E-mail ou senha incorretos.", "erro");
        }
    } catch (erro) {
        console.error("Erro ao tentar logar cliente:", erro);
        aviso("Erro de conexão com o servidor.", "erro");
    }
}

function novaConta() {
    document.getElementById("fundoModal").style.display = "flex";
    document.getElementById("novaConta").style.display = "block";
    document.getElementById("acessoAdministrativo").style.display = "none";
}

function voltarCadastro() {
    document.getElementById("fundoModal").style.display = "none";
    document.getElementById("novaConta").style.display = "none";
    document.getElementById("acessoAdministrativo").style.display = "block";
}

async function solicitarCodigoValidacao() {
  const email = document.getElementById("emailCliente").value.trim();
  if (!email) return aviso("Informe um e-mail válido!", "alerta");

  try {
    const resp = await fetch("http://localhost:3000/validar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const resultado = await resp.json();
    if (resultado.sucesso) {
      aviso("Código de verificação enviado!", "sucesso");
    } else {
      aviso(resultado.mensagem, "erro");
    }
  } catch (err) {
    console.error(err);
    aviso("Erro de conexão com o servidor.", "erro");
  }
}

async function verificarConta() {
    const nome = document.getElementById("nomeCliente").value.trim();
    const email = document.getElementById("emailCliente").value.trim();
    const senha = document.getElementById("senhaCliente").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;
    const codigo = document.getElementById("codigoVerificacao").value.trim();

    if (!nome || !email || !senha || !codigo) {
        return aviso("Preencha todos os campos!", "alerta");
    }

    if (senha.length < 6) return aviso("Senha muito curta.", "alerta");
    if (senha !== confirmarSenha) return aviso("Senhas não coincidem.", "alerta");

    try {
        const resposta = await fetch("http://localhost:3000/criar-conta-cliente", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email, senha, codigo })
        });
        const resultado = await resposta.json();
        if (resultado && resultado.sucesso) {
            aviso("Conta criada com sucesso!", "sucesso");
            voltarCadastro();
        } else {
            aviso("Erro ao criar conta. Tente novamente.", "erro");
        }
    } catch (erro) {
        console.error("Erro ao criar conta:", erro);
        aviso("Erro de conexão com o servidor.", "erro");
    }
}

function aviso(mensagem, tipo) {
    const divAviso = document.getElementById("aviso");
    divAviso.style.display = "flex";

    const p = document.createElement("p");
    p.textContent = mensagem;
    p.classList.add("aviso-msg", `aviso-${tipo}`);

    divAviso.appendChild(p);

    setTimeout(() => {
        p.remove();
        if (divAviso.children.length === 0) {
            divAviso.style.display = "none";
        }
    }, 5000);
}

let konamiCode = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight"
];

let inputSequence = [];

window.addEventListener("keydown", (event) => {
    inputSequence.push(event.key);
    if (inputSequence.length > konamiCode.length) {
        inputSequence.shift();
    }

    if (JSON.stringify(inputSequence) === JSON.stringify(konamiCode)) {
        document.body.style.filter = "hue-rotate(300deg) saturate(100%)";
        inputSequence = [];
    }
});

export { realizarLogin, realizarLoginCliente, novaConta, voltarCadastro, solicitarCodigoValidacao, verificarConta, aviso }