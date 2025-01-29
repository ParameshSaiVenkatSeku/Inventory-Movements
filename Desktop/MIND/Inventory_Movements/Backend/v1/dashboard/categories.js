const knex = require("knex");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
const db = knex(knexConfig);
Model.knex(db);
const categories = async (req, res) => {
  const data = await db("categories").select("category_name", "category_id");
  res.status(200).json({
    data: data,
  });
};
module.exports = categories;
