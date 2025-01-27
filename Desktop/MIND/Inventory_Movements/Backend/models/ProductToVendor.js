const { Model } = require('objection');

class ProductToVendor extends Model {
  static get tableName() {
    return 'product_to_vendor';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['vendor_id', 'product_id'],
      properties: {
        product_to_vendor_id: { type: 'integer' },
        vendor_id: { type: 'integer' },
        product_id: { type: 'integer' },
        status: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    const Vendor = require('./Vendor');
    const Product = require('./Product');

    return {
      vendor: {
        relation: Model.BelongsToOneRelation,
        modelClass: Vendor,
        join: {
          from: 'product_to_vendor.vendor_id',
          to: 'vendors.vendor_id',
        },
      },
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'product_to_vendor.product_id',
          to: 'products.product_id',
        },
      },
    };
  }
}

module.exports = ProductToVendor;
