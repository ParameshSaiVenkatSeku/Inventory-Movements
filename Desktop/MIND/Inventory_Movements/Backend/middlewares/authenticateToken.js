const jwt = require("jsonwebtoken");
const knex = require("knex");
const { Model } = require("objection");
const knexConfig = require("./../knexfile");

const db = knex(knexConfig);
Model.knex(db);

const JWT_SECRET = "AkriviaHCM";

const authenticateToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch user details along with role_id
    const user1 = await db("users")
      .where({ user_id: user.user_id })
      .select("user_id", "username", "email", "role_id")
      .first();

    if (!user1) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch all permissions for the user's role **only once**
    const permissions = await db("users")
      .join("roles", "users.role_id", "roles.id")
      .join("role_permissions", "roles.id", "role_permissions.role_id")
      .join("permissions", "role_permissions.permission_id", "permissions.id")
      .where("users.user_id", user.user_id)
      .select("permissions.permission_name");

    // console.log(permissions);
    req.user = {
      id: user1.user_id,
      username: user1.username,
      email: user1.email,
      role_id: user1.role_id,
    };

    next();
  });
};

const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    const permissions = authenticateToken.permissions;
    if (!req.user || !permissions.includes(requiredPermission)) {
      // console.log(req.user.permissions.includes(requiredPermission));
      return res.status(403).json({ message: "Permission denied" });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizePermission };
