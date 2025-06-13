require('dotenv').config();

const express = require('express');
const fs = require('fs');
const mysql = require("mysql2/promise");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const segredoJWT = process.env.JWT_SECRET;
module.exports.segredoJWT = segredoJWT;

const transporterCompra = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD
});

const server = express();
server.use(express.json());

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Referente a tabela de usuario

// Acessar a tabela de usuario
server.get('/usuario', async (req, res) => {
  const idUsuario = req.query.id_usuario;
  try {
    if (!idUsuario) {
      return res.status(400).send("Parâmetro 'idUsuario' é obrigatório.");
    }
    const [rows] = await pool.query(`
      SELECT * from usuario   
      WHERE id = ?
    `, [idUsuario]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar usuario:", err);
    res.status(500).send("Erro ao buscar usuario");
  }
});

// Atualizar um usuario
server.put('/usuario/:id', async (req, res) => {
  const { id } = req.params;
  const { senha, idade, descricao } = req.body;

  if (!senha || idade == null || !descricao) {
    return res.status(400).send("Campos senha, idade e descrição são obrigatórios.");
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10); 

    const [result] = await pool.query(
      'UPDATE usuario SET senha = ?, idade = ?, descricao = ? WHERE id = ?',
      [senhaHash, idade, descricao, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Usuário não encontrado.");
    }

    return res.send("Perfil atualizado com sucesso."); 
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    return res.status(500).send("Erro ao atualizar perfil.");
  }
});

// Atualizar a foto do usuario
server.put('/usuario/:id/foto', async (req, res) => {
  const { id } = req.params;
  const { imagemBase64 } = req.body;

  if (!imagemBase64 || !imagemBase64.startsWith("data:image/")) {
    return res.status(400).send("Imagem inválida.");
  }

  const matches = imagemBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) return res.status(400).send("Formato de imagem inválido.");

  const ext = matches[1];
  const data = matches[2];

  // Define o nome do novo arquivo (perfil-01.jpg)
  const idFormatado = String(id).padStart(2, '0');
  const nomeArquivo = `perfil-${idFormatado}.${ext}`;
  const caminhoRelativo = `./assets/img/${nomeArquivo}`;
  const caminhoAbsoluto = path.join(__dirname, '..', 'Front-End', 'assets', 'img', nomeArquivo);

  try {
    // Buscar imagem atual do usuário
    const [rows] = await pool.query('SELECT imagem FROM usuario WHERE id = ?', [id]);

    if (rows.length === 0) return res.status(404).send("Usuário não encontrado.");

    const imagemAntiga = rows[0].imagem;

    // Se tiver imagem anterior, excluir
    if (imagemAntiga) {
      const caminhoAntigo = path.join(__dirname, '..', 'Front-End', imagemAntiga.replace('./', ''));
      if (fs.existsSync(caminhoAntigo)) {
        fs.unlinkSync(caminhoAntigo);
      }
    }

    // Salvar nova imagem
    fs.writeFileSync(caminhoAbsoluto, Buffer.from(data, 'base64'));

    // Atualizar banco com caminho relativo
    await pool.query('UPDATE usuario SET imagem = ? WHERE id = ?', [caminhoRelativo, id]);

    res.send("Imagem atualizada com sucesso.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao atualizar a imagem.");
  }
});

// Referente a tabela de produto

// Acessar os produtos de uma empresa e puxar o link da imagem associada
server.get('/produto', async (req, res) => {
  const idEmpresa = req.query.id_empresa;

  try {
    if (!idEmpresa) {
      return res.status(400).send("Parâmetro 'id_empresa' é obrigatório.");
    }

    const [rows] = await pool.query(`
      SELECT p.id, p.nome, p.descricao, p.quantidade, p.id_empresa, i.link AS imagem
      FROM produto p
      LEFT JOIN imagem i ON p.id_imagem = i.id
      WHERE p.id_empresa = ?
    `, [idEmpresa]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    res.status(500).send("Erro ao buscar produto");
  }
});

server.get('/produtosCliente', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * from produto;`,);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    res.status(500).send("Erro ao buscar produto");
  }
});

// Criar uma nova produto
const path = require("path");

server.post('/produto', async (req, res) => {
  const { nome, descricao, quantidade, id_empresa, imagemBase64 } = req.body;

  if (!nome || !descricao || !quantidade || !id_empresa) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }

  try {
    // 1. Insere o produto sem imagem inicialmente
    const [result] = await pool.query(
      'INSERT INTO produto (nome, descricao, quantidade, id_empresa) VALUES (?, ?, ?, ?)',
      [nome, descricao, quantidade, id_empresa]
    );

    const idProduto = result.insertId;
    let idImagem = null;
    let linkImagem = null;

    // 2. Se houver imagem base64, processa e salva
    if (imagemBase64) {
      const matches = imagemBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].split("/")[1]; // png, jpeg, etc
        const base64Data = matches[2];
        const nomeArquivo = `produto-${idProduto}-${Date.now()}.${ext}`;
        const caminhoFinal = path.join(__dirname, '..', 'Front-End', 'assets', 'img', nomeArquivo);

        fs.writeFileSync(caminhoFinal, base64Data, 'base64');
        linkImagem = `./assets/img/${nomeArquivo}`;
      }
    }

    // 3. Se não veio imagem ou se base64 estava inválido, usa imagem padrão
    if (!linkImagem) {
      linkImagem = './assets/img/fundoAdicionarProduto.jpeg';
    }

    // 4. Salva o link da imagem na tabela imagem
    const [imgResult] = await pool.query(
      'INSERT INTO imagem (link) VALUES (?)',
      [linkImagem]
    );

    idImagem = imgResult.insertId;

    // 5. Atualiza o produto com o id da imagem
    await pool.query(
      'UPDATE produto SET id_imagem = ? WHERE id = ?',
      [idImagem, idProduto]
    );

    // 6. Resposta final
    res.status(201).json({
      sucesso: true,
      produto: { id: idProduto, nome, descricao, quantidade, id_empresa, id_imagem: idImagem }
    });

  } catch (err) {
    console.error("Erro ao cadastrar produto:", err);
    res.status(500).send("Erro ao cadastrar produto");
  }
});

// Atualizar um produto
server.put('/produto/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, quantidade, id_empresa, imagemBase64 } = req.body;

  if (!nome || !descricao || !quantidade || !id_empresa) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }

  try {
    // Atualiza nome, descrição e empresa
    const [result] = await pool.query(
      'UPDATE produto SET nome = ?, descricao = ?, quantidade = ?, id_empresa = ? WHERE id = ?',
      [nome, descricao, quantidade, id_empresa, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Produto não encontrado.");
    }

    // Se houver nova imagem
    if (imagemBase64 && imagemBase64.startsWith("data:image/")) {
      // 1. Busca o link da imagem atual
      const [[produtoInfo]] = await pool.query(`
        SELECT imagem.link AS linkImagem
        FROM produto
        JOIN imagem ON produto.id_imagem = imagem.id
        WHERE produto.id = ?
      `, [id]);

      const linkAntigo = produtoInfo?.linkImagem;

      // 2. Exclui a imagem antiga, se não for a padrão
      if (linkAntigo && linkAntigo !== './assets/img/fundoAdicionarProduto.jpeg') {
        const caminhoAntigo = path.join(__dirname, '..', 'Front-End', linkAntigo);
        if (fs.existsSync(caminhoAntigo)) {
          fs.unlinkSync(caminhoAntigo);
        }
      }

      // 3. Processa a nova imagem
      const matches = imagemBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].split("/")[1]; // png, jpeg, etc
        const base64Data = matches[2];
        const nomeArquivo = `produto-${id}-${Date.now()}.${ext}`;
        const caminhoFinal = path.join(__dirname, '..', 'Front-End', 'assets', 'img', nomeArquivo);
        const linkImagem = `./assets/img/${nomeArquivo}`;

        fs.writeFileSync(caminhoFinal, base64Data, 'base64');

        // 4. Cadastra nova imagem e atualiza o produto
        const [imgResult] = await pool.query(
          'INSERT INTO imagem (link) VALUES (?)',
          [linkImagem]
        );

        const idImagem = imgResult.insertId;

        await pool.query(
          'UPDATE produto SET id_imagem = ? WHERE id = ?',
          [idImagem, id]
        );
      }
    }

    res.send("Produto atualizado com sucesso.");
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).send("Erro ao atualizar produto.");
  }
});

// Excluir um produto
server.delete('/produto/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscar o link e id da imagem associada ao produto
    const [[produtoInfo]] = await pool.query(`
      SELECT imagem.id AS idImagem, imagem.link AS linkImagem
      FROM produto
      JOIN imagem ON produto.id_imagem = imagem.id
      WHERE produto.id = ?
    `, [id]);

    if (!produtoInfo) {
      return res.status(404).send("Produto não encontrado.");
    }

    const { idImagem, linkImagem } = produtoInfo;

    // 2. Deletar o produto
    const [result] = await pool.query('DELETE FROM produto WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Produto não encontrado para exclusão.");
    }

    // 3. Deletar a imagem do disco, se não for a padrão
    if (linkImagem && linkImagem !== './assets/img/fundoAdicionarProduto.jpeg') {
      const caminhoImagem = path.join(__dirname, '..', 'Front-End', linkImagem);
      if (fs.existsSync(caminhoImagem)) {
        fs.unlinkSync(caminhoImagem);
      }
    }

    // 4. Deletar o registro da imagem da tabela imagem
    await pool.query('DELETE FROM imagem WHERE id = ?', [idImagem]);

    res.send("Produto e imagem excluídos com sucesso.");
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.status(500).send("Erro ao excluir produto.");
  }
});

// Retorna todos os produtos
server.get('/lista-produtos', async (req, res) => {
  try {
    const [produtos] = await pool.query(`
      SELECT produto.id, produto.nome, produto.descricao, produto.quantidade, imagem.link AS imagem, empresa.nome AS empresa
      FROM produto
      LEFT JOIN imagem ON produto.id_imagem = imagem.id
      INNER JOIN empresa ON produto.id_empresa = empresa.id
      WHERE produto.quantidade > 0
    `);

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro ao buscar produtos.");
  }
});

// Referente a tabela de Cliente

// Acessar cliente
server.get('/cliente', async (req, res) => {
  const idUsuario = req.query.id_usuario;
  try {
    if (!idUsuario) {
      return res.status(400).send("Parâmetro 'idCliente' é obrigatório.");
    }
    const [rows] = await pool.query(`
      SELECT * from cliente   
      WHERE id = ?
    `, [idUsuario]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar cliente:", err);
    res.status(500).send("Erro ao buscar cliente");
  }
});
// Referente a tabela de carrinho

// Acessar a tabela de carrinho
server.get('/carrinho/:id_cliente', async (req, res) => {
  const { id_cliente } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT * from carrinho   
      WHERE id_cliente = ?   
    `, [id_cliente]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar carrinho:", err);
    res.status(500).send("Erro ao buscar carrinho");
  }
});
const lembretesCarrinho = {}; // { id_cliente: timeout }
// Adcionar produto ao carrinho
server.post('/carrinho', async (req, res) => {
  const { id_cliente, id_produto, nome, qta_carrinho } = req.body;

  if (!id_cliente || !id_produto || !nome || !qta_carrinho) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO carrinho (id_cliente, id_produto, nome, qta_carrinho) VALUES (?, ?, ?, ?)',
      [id_cliente, id_produto, nome, qta_carrinho]
    );

    // --- AGENDAR LEMBRETE AUTOMÁTICO ---
    if (lembretesCarrinho[id_cliente]) {
  clearTimeout(lembretesCarrinho[id_cliente]);
}

const [[cliente]] = await pool.query('SELECT email FROM cliente WHERE id = ?', [id_cliente]);
if (cliente && cliente.email) {
 lembretesCarrinho[id_cliente] = setTimeout(async () => {
  console.log("Disparando lembrete para:", cliente.email);
try {
  const [carrinho] = await pool.query('SELECT * FROM carrinho WHERE id_cliente = ?', [id_cliente]);
  if (carrinho.length > 0) {
    await transporterCompra.sendMail({
      from: 'luizfernandomendesalberton@gmail.com',
      to: cliente.email,
      subject: "Você esqueceu algo no carrinho 🛒",
      html: `<p>Notamos que você deixou produtos no carrinho. Ainda está pensando? Volte e finalize sua compra!</p>`
    });
    console.log("E-mail de lembrete enviado para:", cliente.email);
  } else {
    console.log("Carrinho vazio, não enviou lembrete.");
  }
} catch (erro) {
  console.error("Erro ao enviar lembrete:", erro);
}
  delete lembretesCarrinho[id_cliente];
}, 5000); // 10 segundos
}
    // --- FIM DO AGENDAMENTO ---

    res.status(201).json({
      mensagem: "carrinho cadastrado com sucesso!",
      usuario: { id: result.insertId, id_cliente, id_produto, nome, qta_carrinho }
    });

  } catch (err) {
    console.error("Erro ao cadastrar carrinho:", err);
    res.status(500).send("Erro ao cadastrar carrinho");
  }
});

server.put('/carrinho/:idCliente/:idProduto', async (req, res) => {
  const { idCliente, idProduto } = req.params;
  const { quantidade } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE carrinho SET qta_carrinho = ? WHERE id_cliente = ? AND id_produto = ?',
      [quantidade, idCliente, idProduto]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Item não encontrado no carrinho.");
    }

    res.send("Quantidade do produto atualizada no carrinho.");
  } catch (erro) {
    console.error("Erro ao atualizar quantidade:", erro);
    res.status(500).send("Erro ao atualizar o carrinho.");
  }
});

// Excluir um produto do carrinho
server.delete('/carrinho/:idCliente/:idProduto', async (req, res) => {
  const { idCliente, idProduto } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM carrinho WHERE id_cliente = ? AND id_produto = ?',
      [idCliente, idProduto]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Produto não encontrado no carrinho.");
    }

    res.send("Produto removido do carrinho com sucesso.");
  } catch (err) {
    console.error("Erro ao excluir item do carrinho:", err);
    res.status(500).send("Erro ao excluir item do carrinho.");
  }
});

// Apagar carrinho por cliente completo
server.delete('/Limpar-carrinho/:id_cliente', async (req, res) => {
  const { id_cliente } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM carrinho WHERE id_cliente = ?', [id_cliente]);

    if (result.affectedRows === 0) {
      return res.status(404).send("carrinho não encontrada.");
    }

    res.send("carrinho excluída com sucesso.");
  } catch (err) {
    console.error("Erro ao excluir carrinho:", err);
    res.status(500).send("Erro ao excluir carrinho");
  }
});

// Finalizar compra e atualizar estoque
server.delete('/finalizar-compra/:id_cliente', async (req, res) => {
  const { id_cliente } = req.params;

  try {
    // Buscar produtos e quantidades no carrinho usando qta_carrinho
    const [itensCarrinho] = await pool.query(
      'SELECT id_produto, qta_carrinho FROM carrinho WHERE id_cliente = ?',
      [id_cliente]
    );

    if (itensCarrinho.length === 0) {
      return res.status(404).send("Carrinho vazio.");
    }

    // Atualizar estoque para cada produto
    for (const item of itensCarrinho) {
      await pool.query(
        'UPDATE produto SET quantidade = quantidade - ? WHERE id = ? AND quantidade >= ?',
        [item.qta_carrinho, item.id_produto, item.qta_carrinho]
      );
    }

    // Apagar carrinho após atualizar estoque
    await pool.query('DELETE FROM carrinho WHERE id_cliente = ?', [id_cliente]);

    res.send("Compra finalizada e estoque atualizado com sucesso.");
  } catch (err) {
    console.error("Erro ao finalizar compra:", err);
    res.status(500).send("Erro ao finalizar compra");
  }
});

server.post('/validar-login-cliente', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ 
      sucesso: false, 
      mensagem: "Email e senha são obrigatórios." 
    });
  }

  try {
    const [clientes] = await pool.query('SELECT * FROM cliente WHERE email = ?', [email]);

    if (!clientes || clientes.length === 0) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: "Credenciais inválidas." 
      });
    }

    const cliente = clientes[0];
    const senhaCorreta = await bcrypt.compare(senha, cliente.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: "Credenciais inválidas." 
      });
    }

    const token = jwt.sign(
      {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
   
    const { senha: _, ...dadosCliente } = cliente;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    });

    res.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso!",
      cliente: dadosCliente,
      token: token,
    });

  } catch (erro) {
    console.error("Erro ao validar login:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor." });
  }
});

// Validar login de administrador
server.post('/validar-login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [usuario] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);

    if (!usuario || !usuario.length) {
      return res.status(400).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario[0].senha);
    if (!senhaValida) {
      return res.status(400).json({ sucesso: false, mensagem: 'Senha incorreta.' });
    }

    const [empresa] = await pool.query('SELECT * FROM empresa WHERE id = ?', [usuario[0].id_empresa]);

    res.json({
      sucesso: true,
      id: usuario[0].id,
      nome: usuario[0].nome,
      empresa: usuario[0].id_empresa,
      nomeEmpresa: empresa[0].nome
    });

  } catch (erro) {
    console.error("Erro ao validar login:", erro);
    res.status(500).send("Erro no servidor.");
  }
});

let codigosEmail;

server.post('/validar-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ sucesso: false, mensagem: "E-mail é obrigatório." });
  }

  // Gera um código aleatório de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigosEmail = codigo;

  // Configurar transporte (aqui usando Gmail; adapte se for outro provedor)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'luizfernandomendesalberton@gmail.com',
      pass: 'ntgh dvkg kbei vril'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
   from: 'luizfernandomendesalberton@gmail.com',
    to: email,
    subject: 'Mercado Online',
    text: `Olá! Seu código de verificação é: ${codigo}`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ sucesso: true, mensagem: "Código enviado para o seu e-mail." });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    return res.status(500).json({ sucesso: false, mensagem: "Falha ao enviar e-mail." });
  }
});

// Rota para criar uma conta de cliente
server.post('/criar-conta-cliente', async (req, res) => {
  const { nome, email, senha, codigo } = req.body;
  if (!nome || !email || !senha || !codigo) {
    return res.status(400).json({ sucesso: false, mensagem: "Todos os campos são obrigatórios." });
  }

  // Verifica o código enviado
  if (!codigosEmail || codigosEmail !== codigo) {
    return res.status(400).json({ sucesso: false, mensagem: "Código de verificação inválido ou expirado." });
  }
  codigosEmail = null;

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const [result] = await pool.query(
      'INSERT INTO cliente (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaCriptografada]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Cliente cadastrado com sucesso!",
      cliente: { id: result.insertId, nome, email }
    });
  } catch (err) {
    console.error("Erro ao cadastrar cliente:", err);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

server.post('/enviarEmail', async (req, res) => {
    const { email } = req.body;
    if ( !email ) {
        return res.status(400).json({ sucesso: false, mensagem: "Dados inválidos." });
    }

    try {
        await transporterCompra.sendMail({
            from: 'luizfernandomendesalberton@gmail.com',
            to: email,
            subject: 'Compra Confirmada - Mercado Online',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                  <h2 style="color: #2E8B57;">Compra Confirmada!</h2>
                  <p>Olá!</p>
                  <p>
                    Recebemos seu pedido com sucesso e estamos cuidando de cada detalhe para que tudo chegue até você com a máxima qualidade.
                  </p>
                  <p>
                    Agradecemos por confiar no <strong>Mercado Online</strong>! 
                    Sua compra faz parte do nosso propósito de oferecer uma experiência prática, segura e agradável.
                  </p>
                  <p>
                    Em breve, você receberá atualizações sobre o status do seu pedido.
                  </p>
                  <p>
                    Qualquer dúvida, estamos à disposição.
                  </p>
                  <p style="margin-top: 30px;">
                    Atenciosamente,<br />
                    <strong>Equipe Mercado Online</strong>
                  </p>
                </div>
            `
        });
        res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro ao enviar e-mail de confirmação:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar e-mail." });
    }
});

const PORTA = 3000;

server.listen(PORTA, () => { 
  console.log(`Servidor rodando na porta ${PORTA}`);
  console.log('Segredo JWT:', process.env.JWT_SECRET);
  
});
