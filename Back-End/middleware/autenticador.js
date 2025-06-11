const jwt = require("jsonwebtoken");
const { segredoJWT } = require("..");

// Middleware para verificar o token JWT
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Se não veio no header, tenta pegar do cookie
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    token = cookies.token; // pega o token do cookie
  }

  if (!token) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  jwt.verify(token, segredoJWT, (err, cliente) => {
    if (err) {
      return res.status(403).json({ mensagem: 'Token inválido ou expirado.' });
    }

    req.cliente = cliente;
    next();
  });
}

module.exports = verificarToken;
