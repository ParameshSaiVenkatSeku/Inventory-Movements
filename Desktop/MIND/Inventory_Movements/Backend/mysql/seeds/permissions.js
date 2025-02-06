exports.seed = async function (knex) {
  await knex("permissions").del(); // Clear existing data

  await knex("permissions").insert([
    { id: 1, module: "Product Management", permission_name: "product_create" },
    { id: 2, module: "Product Management", permission_name: "product_read" },
    { id: 3, module: "Product Management", permission_name: "product_update" },
    { id: 4, module: "Product Management", permission_name: "product_delete" },
    { id: 5, module: "Cart Management", permission_name: "cart_create" },
    { id: 6, module: "Cart Management", permission_name: "cart_read" },
    { id: 7, module: "Cart Management", permission_name: "cart_update" },
    { id: 8, module: "Cart Management", permission_name: "cart_delete" },
    { id: 9, module: "File Management", permission_name: "file_upload" },
    { id: 10, module: "File Management", permission_name: "file_read" },
    { id: 11, module: "File Management", permission_name: "file_download" },
    { id: 12, module: "File Management", permission_name: "file_delete" },
    { id: 13, module: "User Management", permission_name: "user_create" },
    { id: 14, module: "User Management", permission_name: "user_read" },
    { id: 15, module: "User Management", permission_name: "user_update" },
    { id: 16, module: "User Management", permission_name: "user_delete" },
  ]);
};
