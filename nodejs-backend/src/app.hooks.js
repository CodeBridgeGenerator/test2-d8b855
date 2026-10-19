// Application hooks that run for every service.
const {
  authenticate,
} = require("@feathersjs/authentication").hooks;

const audit = require("../src/utils/audit");
const createNotification = require("../src/utils/notificationService");

const {
  isPermissionExcludedService,
  enforceServicePermission,
  enforceFindResultPermission,
} = require("../src/hooks/servicePermission");

// const { encryptResponse, decryptRequest } = require("./utils/encryption");

const authenticateCommonService = async (context) => {
  if (isPermissionExcludedService(context.path)) {
    return context;
  }

  return authenticate("jwt")(context);
};

module.exports = {
  before: {
    all: [
      // authenticateCommonService,
      // enforceServicePermission,
    ],
    find: [],
    get: [],
    create: [],
    update: [audit.before.update],
    patch: [audit.before.patch],
    remove: [audit.before.remove],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [createNotification.after.create],
    update: [audit.after.update],
    patch: [audit.after.patch],
    remove: [audit.after.remove],
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
