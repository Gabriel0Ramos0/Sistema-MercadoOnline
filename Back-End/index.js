const http = require('http');
const express = require('express');
const fs = require('fs');
const mysql = require("mysql2/promise");
const nodemailer = require('nodemailer');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'versao-1',
  port: 3306,
  password: 'root',
});

let codigosEmail = {};

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

  // Verifica se os campos obrigatórios estão presentes
  if (!senha || idade == null || !descricao) {
    return res.status(400).send("Campos senha, idade e descrição são obrigatórios.");
  }

  try {
    // Atualiza apenas os campos permitidos
    const [result] = await pool.query(
      'UPDATE usuario SET senha = ?, idade = ?, descricao = ? WHERE id = ?',
      [senha, idade, descricao, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Usuário não encontrado.");
    }

    res.send("Perfil atualizado com sucesso.");
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).send("Erro ao atualizar perfil.");
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
      SELECT p.id, p.nome, p.descricao, p.id_empresa, i.link AS imagem
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

// Criar uma nova produto
const path = require("path");

server.post('/produto', async (req, res) => {
  const { nome, descricao, id_empresa, imagemBase64 } = req.body;

  if (!nome || !descricao || !id_empresa) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }

  try {
    // 1. Insere o produto sem imagem inicialmente
    const [result] = await pool.query(
      'INSERT INTO produto (nome, descricao, id_empresa) VALUES (?, ?, ?)',
      [nome, descricao, id_empresa]
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
      produto: { id: idProduto, nome, descricao, id_empresa, id_imagem: idImagem }
    });

  } catch (err) {
    console.error("Erro ao cadastrar produto:", err);
    res.status(500).send("Erro ao cadastrar produto");
  }
});

// Atualizar um produto
server.put('/produto/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, id_empresa, imagemBase64 } = req.body;

  if (!nome || !descricao || !id_empresa) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }

  try {
    // Atualiza nome, descrição e empresa
    const [result] = await pool.query(
      'UPDATE produto SET nome = ?, descricao = ?, id_empresa = ? WHERE id = ?',
      [nome, descricao, id_empresa, id]
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
// Referente a tabela de transação

// Acessar a tabela de transação
server.get('/transacao', async (req, res) => {
  const id_cliente = req.query.id_usuario;
  try {
    if (!id_cliente) {
      return res.status(400).send("Parâmetro 'idtransacao' é obrigatório.");
    }
    const [rows] = await pool.query(`
      SELECT * from transacao   
      WHERE id_cliente = ?   
    `, [idUsuario]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar transação:", err);
    res.status(500).send("Erro ao buscar transação");
  }
});
// Criar uma nova transacao
server.post('/transacao', async (req, res) => {
  const { id, id_cliente, id_produto } = req.body;

  if (id, id_cliente, id_produto) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO transacao (id_cliente, id_produto) VALUES (?, ?)',
      [id_cliente, id_produto]
    );

    res.status(201).json({
      mensagem: "transacao cadastrado com sucesso!",
      usuario: { id: result.insertId,id_cliente, id_produto }
    });

  } catch (err) {
    console.error("Erro ao cadastrar transacao:", err);
    res.status(500).send("Erro ao cadastrar transacao");
  }
});

// Excluir uma transacao
server.delete('/transacao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM transacao WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).send("transacao não encontrada.");
    }

    res.send("transacao excluída com sucesso.");
  } catch (err) {
    console.error("Erro ao excluir transacao:", err);
    res.status(500).send("Erro ao excluir transacao");
  }
});

// Rota de validação de login administrador
server.post('/validar-login', async (req, res) => {
  const { email, senha } = req.body;

  try {
      const [usuario] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);

      if (!usuario || !usuario.length) {
          return res.status(400).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
      }
      const [empresa] = await pool.query('SELECT * FROM empresa WHERE id = ?', [usuario[0].id_empresa]);

      // Comparar a senha fornecida com a senha armazenada no banco de dados
      if (senha === usuario[0].senha) {
          res.json({
              sucesso: true,
              id: usuario[0].id,
              nome: usuario[0].nome,
              empresa: usuario[0].id_empresa,
              nomeEmpresa: empresa[0].nome
          });
      } else {
          res.status(400).json({ sucesso: false, mensagem: 'Senha incorreta.' });
      }

  } catch (erro) {
      console.error("Erro ao validar login:", erro);
      res.status(500).send("Erro no servidor.");
  }
});

server.post('/validar-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ sucesso: false, mensagem: "E-mail é obrigatório." });
  }

  // Gera um código aleatório de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
   codigosEmail[email] = codigo;// armazena em memória

  // Configurar transporte (aqui usando Gmail; adapte se for outro provedor)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'luizfernandomendesalberton@gmail.com',
      pass: 'Qautv'
    }
  });

  const mailOptions = {
   from: 'luizfernandomendesalberton@gmail.com',
    to: email,
    subject: 'afhki',
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


server.post('/criar-conta-cliente', async (req, res) => {
  const { nome, email, senha, codigo } = req.body;
  if (!nome || !email || !senha || !codigo) {
    return res.status(400).json({ sucesso: false, mensagem: "Todos os campos são obrigatórios." });
  }

  // Verifica o código enviado
  if (!codigosEmail[email] || codigosEmail[email] !== codigo) {
    return res.status(400).json({ sucesso: false, mensagem: "Código de verificação inválido ou expirado." });
  }
  // opcional: delete codigosEmail[email];

  try {
    const [result] = await pool.query(
      'INSERT INTO cliente (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senha]
    );
    // opcional: delete codigosEmail[email]; // limpa o código usado

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


// Rota de validação de login de cliente
server.post('/validar-login-cliente', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [cliente] = await pool.query('SELECT * FROM cliente WHERE email = ?', [email]);

    if (!cliente || cliente.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Cliente não encontrado.' });
    }

    // Comparar a senha fornecida com a armazenada no banco
    if (senha === cliente[0].senha) {
      res.json({
        sucesso: true,
        id: cliente[0].id,
        nome: cliente[0].nome
      });
    } else {
      res.status(400).json({ sucesso: false, mensagem: 'Senha incorreta.' });
    }

  } catch (erro) {
    console.error("Erro ao validar login:", erro);
    res.status(500).send("Erro no servidor.");
  }
});


// Retorna todos os produtos
server.get('/lista-produtos', async (req, res) => {
  try {
    const [produtos] = await pool.query(`
      SELECT 
        produto.id, 
        produto.nome, 
        produto.descricao, 
        imagem.link AS imagem,
        empresa.nome AS empresa
      FROM produto
      LEFT JOIN imagem ON produto.id_imagem = imagem.id
      INNER JOIN empresa ON produto.id_empresa = empresa.id
    `);

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro ao buscar produtos.");
  }
});


const PORTA = 3000;
server.listen(PORTA, () => { 
  console.log(`Servidor rodando na porta ${PORTA}`);
});