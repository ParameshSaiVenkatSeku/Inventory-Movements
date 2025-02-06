// migrations/XXXX_create_messages_table.js
exports.up = function (knex) {
  return knex.schema.createTable("messages", (table) => {
    table.increments("id").primary(); // Auto-incrementing primary key
    table.integer("sender_id").unsigned().notNullable(); // Sender ID (unsigned integer)
    table.integer("receiver_id").unsigned().notNullable(); // Receiver ID (unsigned integer)
    table.text("message").notNullable(); // Message text
    table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp with default CURRENT_TIMESTAMP

    // Adding foreign key constraints (assuming users table exists)
    table.foreign("sender_id").references("users.user_id").onDelete("CASCADE"); // Assuming 'users' table exists
    table
      .foreign("receiver_id")
      .references("users.user_id")
      .onDelete("CASCADE"); // Assuming 'users' table exists

    // Optional: Indexes for faster searching (depending on your usage)
    table.index("sender_id");
    table.index("receiver_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("messages");
};
