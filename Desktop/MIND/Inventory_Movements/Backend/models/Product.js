const { Model } = require("objection");

class Product extends Model {
  static get tableName() {
    return "products";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["product_name", "quantity_in_stock", "unit_price"],
      properties: {
        product_id: { type: "integer" },
        product_name: { type: "string", minLength: 1, maxLength: 255 },
        category_id: { type: "integer" },
        quantity_in_stock: { type: "integer" },
        unit_price: { type: "number" },
        product_image: { type: "string" },
        status: { type: "integer" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings() {
    const Category = require("./Category");
    const ProductToVendor = require("./ProductToVendor");

    return {
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: "products.category_id",
          to: "categories.category_id",
        },
      },
      productToVendors: {
        relation: Model.HasManyRelation,
        modelClass: ProductToVendor,
        join: {
          from: "products.product_id",
          to: "product_to_vendors.product_id",
        },
      },
    };
  }
}

module.exports = Product;
