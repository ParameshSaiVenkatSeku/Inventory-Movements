exports.up = function (knex) {
  return knex.schema.createTable("roles", (table) => {
    table.increments("id").primary();
    table.string("role_name").unique().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("roles");
};
