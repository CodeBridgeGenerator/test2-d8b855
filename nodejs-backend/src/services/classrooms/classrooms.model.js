
    module.exports = function (app) {
        const modelName = "classrooms";
        const mongooseClient = app.get("mongooseClient");
        const { Schema } = mongooseClient;
        const schema = new Schema(
          {
            room: { type:  String , comment: "Room, p, false, true, true, true, true, true, true, , , , ," },
building: { type:  String , comment: "Building, p, false, true, true, true, true, true, true, , , , ," },
floor: { type: Number, comment: "Floor, p_number, false, true, true, true, true, true, true, , , , ," },
capacity: { type: Number, comment: "Capacity, p_number, false, true, true, true, true, true, true, , , , ," },
hasProjector: { type: Boolean, required: false, comment: "Has Projector, p_boolean, false, true, true, true, true, true, true, , , , ," },

            createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
            updatedBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
          }, { timestamps: true });
      
       
        if (mongooseClient.modelNames().includes(modelName)) {
          mongooseClient.deleteModel(modelName);
        }
        return mongooseClient.model(modelName, schema);
        
      };