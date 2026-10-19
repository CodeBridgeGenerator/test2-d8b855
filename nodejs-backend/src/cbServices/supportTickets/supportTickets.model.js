module.exports = function (app) {
  const modelName = "supportTickets";
  const mongooseClient = app.get("mongooseClient");
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      type: {
        type: String,
        enum: ["L1", "L2"],
        default: "L1",
        index: true,
      },
      name: { type: String, default: "support_request", index: true },
      requester: { type: Schema.Types.ObjectId, ref: "users", index: true },
      requesterEmail: { type: String, required: true, trim: true, index: true },
      requesterName: { type: String, trim: true },
      recipients: { type: [String], default: [] },
      subject: { type: String, trim: true, default: "" },
      message: { type: String, required: true },
      status: {
        type: String,
        enum: ["open", "in_progress", "resolved", "closed"],
        default: "open",
        index: true,
      },
      priority: {
        type: String,
        enum: ["P1", "P2", "P3", "P4"],
        default: "P3",
      },
      mailQues: { type: Schema.Types.ObjectId, ref: "mail_ques" },
      resolvedAt: { type: Date, default: null },
      resolvedBy: { type: Schema.Types.ObjectId, ref: "users" },
      createdBy: { type: Schema.Types.ObjectId, ref: "users" },
      updatedBy: { type: Schema.Types.ObjectId, ref: "users" },
    },
    { timestamps: true },
  );

  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
