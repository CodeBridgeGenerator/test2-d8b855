const assert = require("assert");
const app = require("../../src/app");

let usersRefData = [
  {
    name: "Standard User",
    email: "standard@example.com",
    password: "password",
  },
];

describe("students service", async () => {
  let thisService;
  let studentCreated;
  let usersServiceResults;
  let users;

  

  beforeEach(async () => {
    thisService = await app.service("students");

    // Create users here
    usersServiceResults = await app.service("users").Model.create(usersRefData);
    users = {
      createdBy: usersServiceResults[0]._id,
      updatedBy: usersServiceResults[0]._id,
    };
  });

  after(async () => {
    if (usersServiceResults) {
      await Promise.all(
        usersServiceResults.map((i) =>
          app.service("users").Model.findByIdAndDelete(i._id)
        )
      );
    }
  });

  it("registered the service", () => {
    assert.ok(thisService, "Registered the service (students)");
  });

  describe("#create", () => {
    const options = {"fullName":"new value"};

    beforeEach(async () => {
      studentCreated = await thisService.Model.create({...options, ...users});
    });

    it("should create a new student", () => {
      assert.strictEqual(studentCreated.fullName, options.fullName);
    });
  });

  describe("#get", () => {
    it("should retrieve a student by ID", async () => {
      const retrieved = await thisService.Model.findById(studentCreated._id);
      assert.strictEqual(retrieved._id.toString(), studentCreated._id.toString());
    });
  });

  describe("#update", () => {
    const options = {"fullName":"updated value"};

    it("should update an existing student ", async () => {
      const studentUpdated = await thisService.Model.findByIdAndUpdate(
        studentCreated._id, 
        options, 
        { new: true } // Ensure it returns the updated doc
      );
      assert.strictEqual(studentUpdated.fullName, options.fullName);
    });
  });

  describe("#delete", async () => {
    it("should delete a student", async () => {
      await app
        .service("users")
        .Model.findByIdAndDelete(usersServiceResults._id);

      ;

      const studentDeleted = await thisService.Model.findByIdAndDelete(studentCreated._id);
      assert.strictEqual(studentDeleted._id.toString(), studentCreated._id.toString());
    });
  });
});