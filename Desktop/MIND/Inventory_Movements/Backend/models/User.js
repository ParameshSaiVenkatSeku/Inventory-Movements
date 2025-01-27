const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'email', 'phone', 'password'],
      properties: {
        user_id: { type: 'integer' },
        username: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', minLength: 1, maxLength: 20 },
        password: { type: 'string' },
        status: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    const ChangeLog = require('./ChangeLog');

    return {
      changeLogs: {
        relation: Model.HasManyRelation,
        modelClass: ChangeLog,
        join: {
          from: 'users.user_id',
          to: 'change_log.changed_by',
        },
      },
    };
  }
}

module.exports = User;
