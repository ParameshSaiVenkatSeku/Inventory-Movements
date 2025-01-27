require("dotenv").config();
module.exports = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./mysql/migrations",
  },
  seeds: {
    directory: "./mysql/seeds",
  },
};
