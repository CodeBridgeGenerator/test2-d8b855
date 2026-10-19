const students = require("./students/students.service.js");
const courses = require("./courses/courses.service.js");
const enrollments = require("./enrollments/enrollments.service.js");
const classrooms = require("./classrooms/classrooms.service.js");
// ~cb-add-require-service-name~

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(students);
  app.configure(courses);
  app.configure(enrollments);
  app.configure(classrooms);
    // ~cb-add-configure-service-name~
};
