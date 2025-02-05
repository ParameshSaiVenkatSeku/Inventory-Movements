const knex = require("knex");
const knexConfig = require("../../knexfile.js");
const db = knex(knexConfig);

const getUserByEmail = async (email, res) => {
  try {
    const id = await db("users")
      .select("user_id")
      .where("email", email)
      .first();
    // console.log(id);
    return id;
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = { getUserByEmail };
