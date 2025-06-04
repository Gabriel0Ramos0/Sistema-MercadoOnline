
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

export { realizarLogin, aviso }