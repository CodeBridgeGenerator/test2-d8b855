
    module.exports = function (app) {
        const modelName = "enrollments";
        const mongooseClient = app.get("mongooseClient");
        const { Schema } = mongooseClient;
        const schema = new Schema(
          {
            student: { type: Schema.Types.ObjectId, ref: "students", comment: "Student, dropdown, false, true, true, true, true, true, true, students, students, one-to-one, fullName," },
course: { type: Schema.Types.ObjectId, ref: "courses", comment: "Course, dropdown, false, true, true, true, true, true, true, courses, courses, one-to-one, courseName," },
startDate: { type: Date, required: true, comment: "Start Date, p_date, false, true, true, true, true, true, true, , , , ," },
endDate: { type: Date, comment: "End Date, p_date, false, true, true, true, true, true, true, , , , ," },
status: { type: Boolean, required: false, comment: "Status, p_boolean, false, true, true, true, true, true, true, , , , ," },

            createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
            updatedBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
          }, { timestamps: true });
      
       
        if (mongooseClient.modelNames().includes(modelName)) {
          mongooseClient.deleteModel(modelName);
        }
        return mongooseClient.model(modelName, schema);
        
      };