function verificarToken(req, res, next) {
  let token = null;

  // Verifica Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) { // Se usar cookies e cookie-parser
    token = req.cookies.token;
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
