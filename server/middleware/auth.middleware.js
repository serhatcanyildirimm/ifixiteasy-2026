const jwt = require("jsonwebtoken");

const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Niet ingelogd." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Sessie ongeldig of verlopen." });
  }
};

module.exports = {
  requireAdminAuth,
};
