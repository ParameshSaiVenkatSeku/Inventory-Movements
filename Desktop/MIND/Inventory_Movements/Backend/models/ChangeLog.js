const { Model } = require('objection');

class ChangeLog extends Model {
  static get tableName() {
    return 'change_log';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['table_name', 'record_id', 'change_type'],
      properties: {
        change_id: { type: 'integer' },
        table_name: { type: 'string' },
        record_id: { type: 'integer' },
        changed_by: { type: 'integer' },
        change_date: { type: 'string', format: 'date-time' },
        change_type: { type: 'string', enum: ['insert', 'update', 'delete'] },
        old_value: { type: 'string' },
        new_value: { type: 'string' },
        status: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'change_log.changed_by',
          to: 'users.user_id',
        },
      },
    };
  }
}

module.exports = ChangeLog;
