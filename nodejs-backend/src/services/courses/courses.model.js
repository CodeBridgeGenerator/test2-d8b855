
    module.exports = function (app) {
        const modelName = "courses";
        const mongooseClient = app.get("mongooseClient");
        const { Schema } = mongooseClient;
        const schema = new Schema(
          {
            courseName: { type:  String , required: true, maxLength: 150, index: true, trim: true, comment: "Course Name, p, false, true, true, true, true, true, true, , , , ," },
instructor: { type:  String , required: true, maxLength: 150, index: true, trim: true, comment: "Instructor, p, false, true, true, true, true, true, true, , , , ," },

            createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
            updatedBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
          }, { timestamps: true });
      
       
        if (mongooseClient.modelNames().includes(modelName)) {
          mongooseClient.deleteModel(modelName);
        }
        return mongooseClient.model(modelName, schema);
        
      };