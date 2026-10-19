module.exports = function (app) {
    const modelName = 'notification_templates';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema(
        {
            name: { type: String, required: true },
            title: { type: String, required: true },
            body: { type: String, required: true },
            image: { type: String, required: false },
            isActive: {
                type: Boolean,
                default: true,
                comment: 'Whether this template is active/enabled.'
            },
            createdBy: {
                type: Schema.Types.ObjectId,
                ref: 'users',
                required: true
            },
            updatedBy: {
                type: Schema.Types.ObjectId,
                ref: 'users',
                required: true
            }
        },
        {
            timestamps: true
        }
    );

    if (mongooseClient.modelNames().includes(modelName)) {
        mongooseClient.deleteModel(modelName);
    }
    return mongooseClient.model(modelName, schema);
};
