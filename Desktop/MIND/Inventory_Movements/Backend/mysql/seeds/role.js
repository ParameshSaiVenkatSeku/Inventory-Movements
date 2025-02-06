exports.seed = async function (knex) {
  await knex("roles").del(); // Clear existing data

  await knex("roles").insert([
    { id: 1, role_name: "admin" },
    { id: 2, role_name: "manager" },
    { id: 3, role_name: "user" },
  ]);
};
