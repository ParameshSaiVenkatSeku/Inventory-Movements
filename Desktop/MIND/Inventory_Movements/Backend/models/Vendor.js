const { Model } = require('objection');

class Vendor extends Model {
  static get tableName() {
    return 'vendors';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['vendor_name'],
      properties: {
        vendor_id: { type: 'integer' },
        vendor_name: { type: 'string', minLength: 1, maxLength: 255 },
        contact_name: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        postal_code: { type: 'string' },
        country: { type: 'string' },
        phone: { type: 'string' },
        status: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    const ProductToVendor = require('./ProductToVendor');

    return {
      products: {
        relation: Model.HasManyRelation,
        modelClass: ProductToVendor,
        join: {
          from: 'vendors.vendor_id',
          to: 'product_to_vendor.vendor_id',
        },
      },
    };
  }
}

module.exports = Vendor;
