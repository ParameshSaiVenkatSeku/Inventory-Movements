const knex = require("knex");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
const db = knex(knexConfig);
Model.knex(db);
const vendor = async (req, res) => {
  const data = await db("vendors").select("vendor_name", "vendor_id");
  res.status(200).json({
    data: data,
  });
};
module.exports = vendor;
