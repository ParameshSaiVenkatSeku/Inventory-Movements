exports.up = function (knex) {
  return knex.schema.createTable("products", function (table) {
    table.increments("product_id").primary();
    table.string("product_name").notNullable();
    table
      .integer("category_id")
      .unsigned()
      .references("category_id")
      .inTable("categories");
    table.integer("quantity_in_stock").notNullable().defaultTo(0);
    table.decimal("unit_price", 10, 2).notNullable();
    table.string("product_image").nullable();
    table.enum("status", ["0", "1", "2", "99"]).defaultTo("0");
    table.timestamps(true, true);
    table.index(["product_name"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("products");
};
