module.exports = function (app) {
  const modelName = "permission_services";
  const mongooseClient = app.get("mongooseClient");
  const { Schema } = mongooseClient;

  const schema = new Schema(
    {
      name: {
        type: String,
        required: false,
        trim: true,
        index: true,
        default: "Default Permission Set",
        comment:
          "Permission Set Name, p, false, true, true, true, true, true, true, , , , ,",
      },

      description: {
        type: String,
        required: false,
        trim: true,
        comment:
          "Description, textarea, false, true, true, true, true, true, true, , , , ,",
      },

      /**
       * True only for the two system-managed wildcard permission sets:
       *
       * 1. Admin Default Permission Set
       * 2. Super Default Permission Set
       *
       * The system-default migration stores a real roleId ObjectId and
       * guarantees one retained wildcard record for Admin and one for Super.
       */
      isSystemDefault: {
        type: Boolean,
        required: false,
        default: false,
        index: true,
        comment:
          "System Default, tick, false, false, false, false, false, false, false, , , , ,",
      },

      /**
       * include:
       *   The permission applies only to the service stored in service.
       *
       * exclude:
       *   service is stored as "*" and excludedServices contains services
       *   that must not receive this permission.
       *
       * Admin/Super system defaults use:
       *
       * serviceMode: "exclude"
       * service: "*"
       * excludedServices: []
       */
      serviceMode: {
        type: String,
        enum: ["include", "exclude"],
        default: "include",
        required: false,
        comment:
          "Service Mode, dropdown, false, true, true, true, true, true, true, , , , ,",
      },

      service: {
        type: String,
        required: true,
        index: true,
        trim: true,
        comment:
          "Service, p, false, true, true, true, true, true, true, , , , ,",
      },

      excludedServices: {
        type: [String],
        required: false,
        default: [],
        comment:
          "Excluded Services, multiselect, false, true, true, true, true, true, true, , , , ,",
      },

      // get
      readOne: {
        type: Boolean,
        required: false,
        comment:
          "Read One, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // find
      readAll: {
        type: Boolean,
        required: false,
        comment:
          "Read All, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // single create
      insert: {
        type: Boolean,
        required: false,
        comment:
          "Insert, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // array create
      insertBulk: {
        type: Boolean,
        required: false,
        comment:
          "Insert Bulk, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // patch/update with an ID
      edit: {
        type: Boolean,
        required: false,
        comment:
          "Edit, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // patch/update without an ID
      editBulk: {
        type: Boolean,
        required: false,
        comment:
          "Edit Bulk, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // remove with an ID
      deleteOne: {
        type: Boolean,
        required: false,
        comment:
          "Delete One, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // remove without an ID
      deleteBulk: {
        type: Boolean,
        required: false,
        comment:
          "Delete Bulk, tick, false, true, true, true, true, true, true, , , , ,",
      },

      // Existing aliases retained for older generated frontend pages.
      create: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "create, tick, false, true, true, true, true, true, true, , , , ,",
      },

      read: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "read, tick, false, true, true, true, true, true, true, , , , ,",
      },

      update: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "update, tick, false, true, true, true, true, true, true, , , , ,",
      },

      delete: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "delete, tick, false, true, true, true, true, true, true, , , , ,",
      },

      import: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "import, tick, false, true, true, true, true, true, true, , , , ,",
      },

      export: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "export, tick, false, true, true, true, true, true, true, , , , ,",
      },

      seeder: {
        type: Boolean,
        required: false,
        default: false,
        comment:
          "seeder, tick, false, true, true, true, true, true, true, , , , ,",
      },

      userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        comment:
          "User Id, dropdown, false, true, true, true, true, true, true, users, users, one-to-one, name,",
      },

      roleId: {
        type: Schema.Types.ObjectId,
        ref: "roles",
        index: true,
        comment:
          "Role Id, dropdown, false, true, true, true, true, true, true, roles, roles, one-to-one, name,",
      },

      profile: {
        type: Schema.Types.ObjectId,
        ref: "profiles",
        index: true,
        comment:
          "Profile, dropdown, false, true, true, true, true, true, true, profiles, profiles, one-to-one, name,",
      },

      positionId: {
        type: Schema.Types.ObjectId,
        ref: "positions",
        index: true,
        comment:
          "Position Id, dropdown, false, true, true, true, true, true, true, positions, positions, one-to-one, name,",
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: false,
      },

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: false,
      },
    },
    {
      timestamps: true,
    },
  );


  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }

  return mongooseClient.model(modelName, schema);
};
