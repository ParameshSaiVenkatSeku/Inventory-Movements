exports.up = function (knex) {
  return knex.schema.createTable("role_permissions", (table) => {
    table.increments("id").primary();
    table.integer("role_id").unsigned().notNullable();
    table.integer("permission_id").unsigned().notNullable();

    table.foreign("role_id").references("roles.id").onDelete("CASCADE");
    table
      .foreign("permission_id")
      .references("permissions.id")
      .onDelete("CASCADE");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("role_permissions");
};
