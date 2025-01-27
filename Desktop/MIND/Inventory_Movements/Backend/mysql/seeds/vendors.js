exports.seed = function (knex) {
  return knex("vendors")
    .del()
    .then(function () {
      return knex("vendors").insert([
        {
          vendor_name: "Zomato",
          contact_name: "anthony",
          address: "123 Zomato St.",
          city: "Delhi",
          postal_code: "110001",
          country: "India",
          phone: "+91 123 456 7890",
          status: "1",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
        {
          vendor_name: "Blinkit",
          contact_name: "tony",
          address: "456 Blinkit Ave.",
          city: "Gurgaon",
          postal_code: "122018",
          country: "India",
          phone: "+91 987 654 3210",
          status: "1",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
        {
          vendor_name: "Swiggy",
          contact_name: "Vikram Kumar",
          address: "789 Swiggy Rd.",
          city: "Bangalore",
          postal_code: "560001",
          country: "India",
          phone: "+91 998 877 6655",
          status: "1",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
        {
          vendor_name: "Amazon",
          contact_name: "king kohli",
          address: "101 Amazon Blvd.",
          city: "Seattle",
          postal_code: "98101",
          country: "USA",
          phone: "+1 206-266-1000",
          status: "1",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
        {
          vendor_name: "Flipkart",
          contact_name: "Rakesh ",
          address: "102 Flipkart Tower",
          city: "Bangalore",
          postal_code: "560001",
          country: "India",
          phone: "+91 080 466 6000",
          status: "1",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
      ]);
    });
};
