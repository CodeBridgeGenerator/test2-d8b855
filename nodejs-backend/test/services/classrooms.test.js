const assert = require("assert");
const app = require("../../src/app");

let usersRefData = [
  {
    name: "Standard User",
    email: "standard@example.com",
    password: "password",
  },
];

describe("classrooms service", async () => {
  let thisService;
  let classroomCreated;
  let usersServiceResults;
  let users;

  

  beforeEach(async () => {
    thisService = await app.service("classrooms");

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
    assert.ok(thisService, "Registered the service (classrooms)");
  });

  describe("#create", () => {
    const options = {"room":"new value","building":"new value","floor":23,"capacity":23,"hasProjector":true};

    beforeEach(async () => {
      classroomCreated = await thisService.Model.create({...options, ...users});
    });

    it("should create a new classroom", () => {
      assert.strictEqual(classroomCreated.room, options.room);
assert.strictEqual(classroomCreated.building, options.building);
assert.strictEqual(classroomCreated.floor, options.floor);
assert.strictEqual(classroomCreated.capacity, options.capacity);
assert.strictEqual(classroomCreated.hasProjector, options.hasProjector);
assert.strictEqual(classroomCreated.hasProjector, options.hasProjector);
    });
  });

  describe("#get", () => {
    it("should retrieve a classroom by ID", async () => {
      const retrieved = await thisService.Model.findById(classroomCreated._id);
      assert.strictEqual(retrieved._id.toString(), classroomCreated._id.toString());
    });
  });

  describe("#update", () => {
    const options = {"room":"updated value","building":"updated value","floor":100,"capacity":100,"hasProjector":false};

    it("should update an existing classroom ", async () => {
      const classroomUpdated = await thisService.Model.findByIdAndUpdate(
        classroomCreated._id, 
        options, 
        { new: true } // Ensure it returns the updated doc
      );
      assert.strictEqual(classroomUpdated.room, options.room);
assert.strictEqual(classroomUpdated.building, options.building);
assert.strictEqual(classroomUpdated.floor, options.floor);
assert.strictEqual(classroomUpdated.capacity, options.capacity);
assert.strictEqual(classroomUpdated.hasProjector, options.hasProjector);
assert.strictEqual(classroomUpdated.hasProjector, options.hasProjector);
    });
  });

  describe("#delete", async () => {
    it("should delete a classroom", async () => {
      await app
        .service("users")
        .Model.findByIdAndDelete(usersServiceResults._id);

      ;

      const classroomDeleted = await thisService.Model.findByIdAndDelete(classroomCreated._id);
      assert.strictEqual(classroomDeleted._id.toString(), classroomCreated._id.toString());
    });
  });
});