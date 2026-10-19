const { authenticate } = require("@feathersjs/authentication").hooks;

const setRequester = async (context) => {
  const user = context.params.user;
  context.data = {
    ...(context.data || {}),
    requester: context.data.requester || user?._id,
    createdBy: context.data.createdBy || user?._id,
    requesterEmail: context.data.requesterEmail || user?.email,
    requesterName: context.data.requesterName || user?.name,
  };
  return context;
};

module.exports = {
  before: {
    all: [authenticate("jwt")],
    find: [],
    get: [],
    create: [setRequester],
    update: [],
    patch: [],
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
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
