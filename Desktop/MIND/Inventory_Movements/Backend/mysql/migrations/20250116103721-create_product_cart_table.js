exports.up = function (knex) {
  return knex.schema.createTable("product_cards", function (table) {
    table.increments("card_id").primary();
    table
      .integer("product_id")
      .unsigned()
      .references("product_id")
      .inTable("products")
      .onDelete("CASCADE");
    table.string("product_name");
    table.integer("quantity");
    table
      .integer("vendor_id")
      .unsigned()
      .references("vendor_id")
      .inTable("vendors")
      .onDelete("CASCADE");
    table.string("vendor_name");
    table
      .integer("user_id")
      .unsigned()
      .references("user_id")
      .inTable("users")
      .onDelete("SET NULL");
    table.integer("status").defaultTo(1).checkIn([0, 1, 2, 99]);
    table.timestamps(true, true);
  });
};
 
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("cards");
};

