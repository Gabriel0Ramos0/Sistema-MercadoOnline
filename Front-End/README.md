# Ideias e Protótipos de Página

Este repositório contém ideias, rascunhos e protótipos de páginas web, desenvolvidos para representar conceitos de design, fluxos de navegação e funcionalidades específicas.

## Protótipo - Tela de Login para Administrador

O modelo abaixo apresenta uma interface onde haverá um campo específico para acesso de administradores.

![Protótipo da Tela de Login](assets/img/Modelo%20Login.jpeg)

## Sobre este repositório

- ✔️ Propósito: Armazenar esboços, ideias e modelos de interface.
- ✔️ Foco atual: Tela de login com campo para acesso administrativo.
- ✔️ Arquivos incluídos: Imagens, modelos e, futuramente, possíveis implementações.

## validaçao de email.
 - sera mandado para o banco e do banco validara pelo email.
    await transporter.sendMail({
     - from: '"Loja Virtual" <SEU_EMAIL>',
     -to: email,
     - subject: "Confirmação da sua compra",
     - html: `
     -   <h1>Olá!</h1>
     -   <p>Recebemos sua compra do produto: <strong>${nomeProduto}</strong></p>
     -   <p>Clique no link abaixo para confirmar sua compra:</p>
     -   <a href="http://localhost:3000/verificar?email=${encodeURIComponent(email)}">Confirmar Compra</a>
     - `,
    });