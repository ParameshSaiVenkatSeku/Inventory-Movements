/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = function(knex) {
  return knex('categories')
    .del()
    .then(function() {
      return knex('categories').insert([
        {
          category_name: 'Electronics',
          description: 'Devices like smartphones, laptops, cameras, smart Watches, Home Appliances',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Furniture',
          description: 'Furniture items such as tables, chairs, Beds, and sofas.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Clothing',
          description: 'Apparel including shirts, pants, jackets, Dresses, Shoes and  Sneakers.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Food & Beverages',
          description: 'Food items like vegetables, fruits, snacks, Soft Drinks, Coffeee, Milk  and packaged goods.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Health & Beauty',
          description: 'Personal care items such as shampoos, lotions, and Protein Powders.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Sports & Outdoors',
          description: 'Equipment and apparel for sports, fitness, and outdoor activities.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Toys & Games',
          description: 'Toys for children, board games, and outdoor play items.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Office Supplies',
          description: 'Items like paper, pens, and office furniture.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          category_name: 'Books & Stationery',
          description: 'Books, notebooks, and educational materials.',
          status: '1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
