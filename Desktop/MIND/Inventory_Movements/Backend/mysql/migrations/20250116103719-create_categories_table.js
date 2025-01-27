exports.up = function(knex) {
  return knex.schema.createTable('categories', function(table) {
    table.increments('category_id').primary(); 
    table.string('category_name').notNullable();
    table.text('description').nullable();
    table.enum('status', ['0', '1', '2', '99']).defaultTo('0'); 
    table.timestamps(true, true); 
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('categories');
};
