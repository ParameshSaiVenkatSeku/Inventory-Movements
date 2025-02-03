exports.up = function (knex) {
  return knex.schema.createTable("product_to_vendors", function (table) {
    table.increments("product_to_vendors_id").primary();
    table
      .integer("vendor_id")
      .unsigned()
      .references("vendor_id")
      .inTable("vendors");
    table
      .integer("product_id")
      .unsigned()
      .references("product_id")
      .inTable("products");
    table.enum("status", ["0", "1", "2", "99"]).defaultTo("0");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("product_to_vendors");
};
