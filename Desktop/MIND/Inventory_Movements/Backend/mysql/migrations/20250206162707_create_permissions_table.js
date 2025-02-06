exports.up = function (knex) {
  return knex.schema.createTable("permissions", (table) => {
    table.increments("id").primary();
    table.string("module").notNullable();
    table.string("permission_name").unique().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("permissions");
};
