const { Model } = require('objection');

class Category extends Model {
  static get tableName() {
    return 'categories';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['category_name'],
      properties: {
        category_id: { type: 'integer' },
        category_name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        status: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    const Product = require('./Product');

    return {
      products: {
        relation: Model.HasManyRelation,
        modelClass: Product,
        join: {
          from: 'categories.category_id',
          to: 'products.category_id',
        },
      },
    };
  }
}

module.exports = Category;
