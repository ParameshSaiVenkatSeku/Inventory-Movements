const jwt = require('jsonwebtoken');
const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('./../knexfile');
const db = knex(knexConfig);
Model.knex(db);
const JWT_SECRET = 'AkriviaHCM';  

const authenticateToken = (req, res, next) => {
  console.log('Authenticating');
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user1 = await db('users').where({ user_id: user.user_id }).first();

    if (!user1) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user1.user_id,
      username: user1.username,
      email: user1.email,
    };
    console.log("I'm authenticated");
    next();
  });
};

module.exports = authenticateToken;
