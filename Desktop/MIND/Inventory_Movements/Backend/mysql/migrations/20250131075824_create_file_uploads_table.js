exports.up = function (knex) {
  return knex.schema.createTable("file_uploads", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable();
    table.string("file_name", 255).notNullable();
    table.string("file_path", 255).notNullable();
    table.enum("status", ["pending", "completed"]).defaultTo("pending");
    table.integer("total_records").notNullable();
    table.integer("success_records").notNullable();
    table.integer("failed_records").notNullable();
    table.string("error_file_url", 255);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("file_uploads"); // Rollback by dropping the table
};
