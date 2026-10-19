const {
  refreshPermissionCache,
} = require("../../hooks/servicePermission");


module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],

    // Update Redis whenever permission records change.
    create: [refreshPermissionCache],
    update: [refreshPermissionCache],
    patch: [refreshPermissionCache],
    remove: [refreshPermissionCache],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
