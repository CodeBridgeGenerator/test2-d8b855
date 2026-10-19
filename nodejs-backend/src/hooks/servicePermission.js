const {
  BadRequest,
  Forbidden,
} = require("@feathersjs/errors");

const redisClient = require("../cbServices/redis/config");

const PERMISSION_CACHE_KEY = "permissionServices:all:v2";

const PERMISSION_CACHE_TTL_SECONDS = Number(
  process.env.PERMISSION_CACHE_TTL_SECONDS || 3600,
);

/**
 * Services listed here skip the common JWT and permission hooks.
 *
 * Add only services that intentionally do not use authenticate("jwt") or
 * implement their own authentication/access control. Exact names and prefix
 * exclusions such as "public/*" are supported.
 */
const EXCLUDED_PERMISSION_SERVICES = [
  "authentication",
  "users",
  "roles",
  "positions",
  "profiles",
];

/**
 * Services listed here remain protected by the common JWT authentication hook,
 * but permission evaluation is bypassed and every supported action is allowed.
 *
 * permissionServices is intentionally available to every authenticated user.
 * Do not move it to EXCLUDED_PERMISSION_SERVICES, because that list also skips
 * common JWT authentication.
 */
const UNRESTRICTED_PERMISSION_SERVICES = [
  "permissionServices",
];

/**
 * Admin/Super must always be able to manage permission sets.
 *
 * Add another service here only when it must never be blocked for
 * Admin/Super users.
 */
const ADMIN_ALWAYS_ALLOWED_SERVICES = [
  "permissionServices",
];

const STANDARD_ACTIONS = [
  "readOne",
  "readAll",
  "insert",
  "insertBulk",
  "edit",
  "editBulk",
  "deleteOne",
  "deleteBulk",
  "import",
  "export",
  "seeder",
];

const normalizeRoleName = (roleName) =>
  String(roleName || "")
    .trim()
    .toLowerCase();

const getConfiguredAdministratorRoleNames = () =>
  String(
    process.env.PERMISSION_ADMIN_ROLES || "Admin,Super",
  )
    .split(",")
    .map(normalizeRoleName)
    .filter(Boolean);

const isAdministratorRoleName = (roleName) =>
  getConfiguredAdministratorRoleNames().includes(
    normalizeRoleName(roleName),
  );

const emptyPermissions = () => ({
  readOne: false,
  readAll: false,

  insert: false,
  insertBulk: false,

  edit: false,
  editBulk: false,

  deleteOne: false,
  deleteBulk: false,

  import: false,
  export: false,
  seeder: false,

  // Old aliases retained for existing frontend pages.
  read: false,
  create: false,
  update: false,
  delete: false,

  source: null,
  permissionSetName: null,
  permissionRecordId: null,
});

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (value._id) {
      return String(value._id);
    }

    if (value.id) {
      return String(value.id);
    }
  }

  return String(value);
};

/**
 * Resolves the authenticated user ID across Feathers authentication shapes.
 * Some projects expose params.user._id, while others expose params.user.id or
 * only the JWT subject at params.authentication.payload.sub.
 */
const getAuthenticatedUserId = (params = {}) =>
  getId(
    params?.user?._id ||
      params?.user?.id ||
      params?.authentication?.payload?.sub ||
      params?.authentication?.payload?.userId ||
      params?.authentication?.payload?._id,
  );

const normalizeServiceName = (serviceName) =>
  String(serviceName || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

/**
 * Supports exact exclusions and optional prefix exclusions such as:
 *
 * "public/*"
 */
const isServiceInExclusionList = (
  serviceName,
  exclusionList,
) => {
  const normalizedServiceName = normalizeServiceName(serviceName);

  if (!normalizedServiceName) {
    return false;
  }

  return exclusionList.some((excludedService) => {
    const normalizedExcludedService = normalizeServiceName(excludedService);

    if (!normalizedExcludedService) {
      return false;
    }

    if (normalizedExcludedService.endsWith("/*")) {
      const prefix = normalizedExcludedService.slice(0, -2);

      return (
        normalizedServiceName === prefix ||
        normalizedServiceName.startsWith(`${prefix}/`)
      );
    }

    return normalizedServiceName === normalizedExcludedService;
  });
};

const isPermissionExcludedService = (serviceName) =>
  isServiceInExclusionList(
    serviceName,
    EXCLUDED_PERMISSION_SERVICES,
  );

const isUnrestrictedPermissionService = (serviceName) =>
  UNRESTRICTED_PERMISSION_SERVICES.includes(
    normalizeServiceName(serviceName),
  );

const hasBooleanValue = (value) =>
  typeof value === "boolean";

const readPermissionValue = (
  record,
  newField,
  oldField,
) => {
  if (hasBooleanValue(record?.[newField])) {
    return record[newField];
  }

  return Boolean(record?.[oldField]);
};

/**
 * Converts both new and old permission records into the new permission
 * structure.
 */
const normalizePermissionRecord = (
  record,
  source,
) => {
  if (!record) {
    return emptyPermissions();
  }

  const readOne = readPermissionValue(
    record,
    "readOne",
    "read",
  );

  const readAll = readPermissionValue(
    record,
    "readAll",
    "read",
  );

  const insert = readPermissionValue(
    record,
    "insert",
    "create",
  );

  const insertBulk = readPermissionValue(
    record,
    "insertBulk",
    "create",
  );

  const edit = readPermissionValue(
    record,
    "edit",
    "update",
  );

  const editBulk = readPermissionValue(
    record,
    "editBulk",
    "update",
  );

  const deleteOne = readPermissionValue(
    record,
    "deleteOne",
    "delete",
  );

  const deleteBulk = readPermissionValue(
    record,
    "deleteBulk",
    "delete",
  );

  return {
    readOne,
    readAll,

    insert,
    insertBulk,

    edit,
    editBulk,

    deleteOne,
    deleteBulk,

    import: Boolean(record.import),
    export: Boolean(record.export),
    seeder: Boolean(record.seeder),

    // Old aliases retained for existing frontend pages.
    read: readAll,
    create: insert,
    update: edit,
    delete: deleteOne,

    source,
    permissionSetName:
      record.name || "Default Permission Set",
    permissionRecordId: getId(record._id),
  };
};

/**
 * Default access for an Admin/Super user when no explicit permission record
 * exists.
 */
const getAllAllowedPermissions = (
  source = "administrator-default",
  permissionSetName = "Administrator Default Access",
) => ({
  readOne: true,
  readAll: true,

  insert: true,
  insertBulk: true,

  edit: true,
  editBulk: true,

  deleteOne: true,
  deleteBulk: true,

  import: true,
  export: true,
  seeder: true,

  // Old aliases.
  read: true,
  create: true,
  update: true,
  delete: true,

  source,
  permissionSetName,
  permissionRecordId: null,
});

/**
 * Permission Sets are visible to every authenticated user. This default grants
 * read access only; write actions still require an explicit permission record
 * or an Admin/Super profile.
 */
const getPermissionServicesReadPermissions = (
  source = "authenticated-permission-sets-read",
  permissionSetName = "Permission Sets Read Access",
) => ({
  ...emptyPermissions(),
  readOne: true,
  readAll: true,
  read: true,
  source,
  permissionSetName,
});


/**
 * Returns true when a permission record grants every supported action.
 * New fields are preferred and old create/read/update/delete aliases remain
 * supported during migration.
 */
const hasFullAccessPermissions = (record) =>
  readPermissionValue(record, "readOne", "read") &&
  readPermissionValue(record, "readAll", "read") &&
  readPermissionValue(record, "insert", "create") &&
  readPermissionValue(record, "insertBulk", "create") &&
  readPermissionValue(record, "edit", "update") &&
  readPermissionValue(record, "editBulk", "update") &&
  readPermissionValue(record, "deleteOne", "delete") &&
  readPermissionValue(record, "deleteBulk", "delete") &&
  Boolean(record?.import) &&
  Boolean(record?.export) &&
  Boolean(record?.seeder);

const isRoleOnlyPermissionRecord = (record) =>
  Boolean(getId(record?.roleId)) &&
  !getId(record?.profile) &&
  !getId(record?.positionId) &&
  !getId(record?.userId);

/**
 * Identifies legacy full-access defaults generated for Admin/Super roles.
 *
 * System defaults are stored against a real role ObjectId so they continue to
 * populate and display exactly like normal role permission records.
 */
const isAdministratorDefaultPermissionRecord = (
  record,
  roleName,
) => {
  if (!record) {
    return false;
  }

  const hasRoleAssignment =
    Boolean(getId(record?.roleId)) ||
    Boolean(record?.systemRoleKey);

  if (
    !hasRoleAssignment ||
    getId(record?.profile) ||
    getId(record?.positionId) ||
    getId(record?.userId)
  ) {
    return false;
  }

  const normalizedName = normalizeRoleName(
    record.name || "Default Permission Set",
  );

  const normalizedRoleName = normalizeRoleName(roleName);

  const recognizedDefaultNames = new Set([
    "default permission set",
    `${normalizedRoleName} default permission set`,
    `${normalizedRoleName} full access`,
    `${normalizedRoleName} full access permission set`,
  ]);

  return (
    record.isSystemDefault === true ||
    (
      recognizedDefaultNames.has(normalizedName) &&
      hasFullAccessPermissions(record)
    )
  );
};

const getDisplayRoleName = (normalizedRoleName) =>
  String(normalizedRoleName || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");

/**
 * Selects one canonical ObjectId for an administrator role name.
 *
 * Priority:
 * 1. Role referenced by the greatest number of profiles.
 * 2. Oldest role ObjectId as a stable fallback.
 *
 * This keeps exactly one Admin and one Super system-default record while still
 * using real ObjectId references in permission_services.
 */
const chooseCanonicalRoleId = async (
  app,
  roleIds = [],
) => {
  const normalizedRoleIds = roleIds
    .map(getId)
    .filter(Boolean);

  if (normalizedRoleIds.length === 0) {
    return null;
  }

  const mongooseClient = app.get("mongooseClient");
  const usageCount = new Map(
    normalizedRoleIds.map((roleId) => [roleId, 0]),
  );

  if (mongooseClient.modelNames().includes("profiles")) {
    const ProfileModel = mongooseClient.model("profiles");

    const profiles = await ProfileModel.find({
      $or: [
        { role: { $in: normalizedRoleIds } },
        { roleId: { $in: normalizedRoleIds } },
      ],
    })
      .select("role roleId")
      .lean();

    for (const profile of profiles) {
      const profileRoleId = getId(
        profile?.role || profile?.roleId,
      );

      if (profileRoleId && usageCount.has(profileRoleId)) {
        usageCount.set(
          profileRoleId,
          usageCount.get(profileRoleId) + 1,
        );
      }
    }
  }

  return [...normalizedRoleIds].sort((first, second) => {
    const countDifference =
      (usageCount.get(second) || 0) -
      (usageCount.get(first) || 0);

    if (countDifference !== 0) {
      return countDifference;
    }

    return first.localeCompare(second);
  })[0];
};

const buildAdministratorDefaultPermissionPayload = ({
  roleId,
  roleName,
  actorUserId,
}) => {
  const displayRoleName = getDisplayRoleName(
    normalizeRoleName(roleName),
  );

  const payload = {
    name: `${displayRoleName} Default Permission Set`,
    description:
      `System-managed full access permission set for the ${displayRoleName} role.`,
    isSystemDefault: true,

    // One wildcard record applies to every service.
    serviceMode: "exclude",
    service: "*",
    excludedServices: [],

    readOne: true,
    readAll: true,
    insert: true,
    insertBulk: true,
    edit: true,
    editBulk: true,
    deleteOne: true,
    deleteBulk: true,
    import: true,
    export: true,
    seeder: true,

    // Old aliases retained for older frontend pages.
    read: true,
    create: true,
    update: true,
    delete: true,

    // Use ObjectId assignments as before.
    roleId,
    profile: null,
    positionId: null,
    userId: null,
  };

  if (actorUserId) {
    payload.updatedBy = actorUserId;
  }

  return payload;
};

const findPermissionActorUserId = async (
  app,
  {
    roleIds = [],
    preferredUserId,
    legacyRecords = [],
  } = {},
) => {
  const preferredId =
    getId(preferredUserId) ||
    legacyRecords
      .map((record) =>
        getId(record.updatedBy) || getId(record.createdBy),
      )
      .find(Boolean);

  if (preferredId) {
    return preferredId;
  }

  const mongooseClient = app.get("mongooseClient");
  const normalizedRoleIds = (roleIds || [])
    .map(getId)
    .filter(Boolean);

  if (
    normalizedRoleIds.length > 0 &&
    mongooseClient.modelNames().includes("profiles")
  ) {
    const ProfileModel = mongooseClient.model("profiles");

    const profile = await ProfileModel.findOne({
      $or: [
        { role: { $in: normalizedRoleIds } },
        { roleId: { $in: normalizedRoleIds } },
      ],
    })
      .select("user userId")
      .lean();

    const profileUserId =
      getId(profile?.userId) || getId(profile?.user);

    if (profileUserId) {
      return profileUserId;
    }
  }

  if (mongooseClient.modelNames().includes("users")) {
    const UserModel = mongooseClient.model("users");
    const firstUser = await UserModel.findOne({})
      .select("_id")
      .lean();

    return getId(firstUser?._id);
  }

  return null;
};

/**
 * Returns one group per configured administrator role name.
 *
 * Duplicate role documents are grouped together, but one canonical ObjectId is
 * selected for storage in the system permission record.
 */
const getAdministratorRoleGroups = async (
  app,
  requestedRoleIds = [],
) => {
  const mongooseClient = app.get("mongooseClient");

  if (!mongooseClient.modelNames().includes("roles")) {
    return [];
  }

  const RoleModel = mongooseClient.model("roles");
  const configuredNames = new Set(
    getConfiguredAdministratorRoleNames(),
  );

  const roles = await RoleModel.find({})
    .select("name")
    .lean();

  const requestedIds = new Set(
    (requestedRoleIds || []).map(getId).filter(Boolean),
  );

  const requestedRoleKeys = new Set(
    roles
      .filter((role) => requestedIds.has(getId(role._id)))
      .map((role) => normalizeRoleName(role.name))
      .filter(Boolean),
  );

  const groupedRoles = new Map();

  for (const role of roles) {
    const key = normalizeRoleName(role.name);

    if (!configuredNames.has(key)) {
      continue;
    }

    if (
      requestedIds.size > 0 &&
      !requestedRoleKeys.has(key)
    ) {
      continue;
    }

    if (!groupedRoles.has(key)) {
      groupedRoles.set(key, {
        key,
        displayName: getDisplayRoleName(key),
        roleIds: [],
      });
    }

    groupedRoles.get(key).roleIds.push(getId(role._id));
  }

  const groups = [];

  for (const group of groupedRoles.values()) {
    groups.push({
      ...group,
      canonicalRoleId: await chooseCanonicalRoleId(
        app,
        group.roleIds,
      ),
    });
  }

  return groups.filter((group) => group.canonicalRoleId);
};

const LEGACY_ROLE_ID_INDEX_NAME =
  "unique_system_default_permission_set_per_role";

const LEGACY_SYSTEM_ROLE_KEY_INDEX_NAME =
  "unique_system_default_permission_set_per_role_name";

const dropObsoleteAdministratorDefaultIndexes = async (
  PermissionModel,
) => {
  try {
    const indexes = await PermissionModel.collection.indexes();

    for (const indexName of [
      LEGACY_ROLE_ID_INDEX_NAME,
      LEGACY_SYSTEM_ROLE_KEY_INDEX_NAME,
    ]) {
      if (indexes.some((index) => index.name === indexName)) {
        await PermissionModel.collection.dropIndex(indexName);
      }
    }
  } catch (error) {
    if (
      error?.codeName !== "IndexNotFound" &&
      error?.code !== 27 &&
      error?.codeName !== "NamespaceNotFound" &&
      error?.code !== 26
    ) {
      throw error;
    }
  }
};

const SYSTEM_ROLE_ID_INDEX_NAME =
  "unique_system_default_permission_set_per_canonical_role";

const ensureSystemRoleIdUniqueIndex = async (
  PermissionModel,
) => {
  await PermissionModel.collection.createIndex(
    {
      roleId: 1,
      isSystemDefault: 1,
    },
    {
      unique: true,
      partialFilterExpression: {
        isSystemDefault: true,
        roleId: { $type: "objectId" },
      },
      name: SYSTEM_ROLE_ID_INDEX_NAME,
    },
  );
};

/**
 * Consolidates legacy Admin/Super defaults into exactly one wildcard record
 * per configured role name. The retained record stores a real roleId ObjectId.
 *
 * Existing custom profile, position and role permission sets are untouched.
 */
const ensureAdministratorDefaultPermissionSets = async (
  app,
  {
    roleIds = [],
    preferredUserId = null,
    refreshCache = true,
  } = {},
) => {
  const mongooseClient = app.get("mongooseClient");

  if (
    !mongooseClient
      .modelNames()
      .includes("permission_services")
  ) {
    return {
      createdOrUpdated: 0,
      removedLegacyRecords: 0,
      records: [],
    };
  }

  const PermissionModel = mongooseClient.model(
    "permission_services",
  );

  await dropObsoleteAdministratorDefaultIndexes(
    PermissionModel,
  );

  const administratorRoleGroups =
    await getAdministratorRoleGroups(app, roleIds);

  const summary = {
    createdOrUpdated: 0,
    removedLegacyRecords: 0,
    records: [],
  };

  for (const group of administratorRoleGroups) {
    const possibleDefaults = await PermissionModel.find({
      $or: [
        { roleId: { $in: group.roleIds } },
        { systemRoleKey: group.key },
        {
          isSystemDefault: true,
          name: {
            $regex: `^${group.displayName}\\s+Default\\s+Permission\\s+Set$`,
            $options: "i",
          },
        },
      ],
    })
      .setOptions({ strictQuery: false })
      .sort({ updatedAt: -1 })
      .lean();

    const legacyDefaultRecords = possibleDefaults.filter(
      (record) =>
        isAdministratorDefaultPermissionRecord(
          record,
          group.displayName,
        ),
    );

    const targetRecord =
      legacyDefaultRecords.find(
        (record) =>
          record.isSystemDefault === true &&
          getId(record.roleId) === group.canonicalRoleId &&
          record.service === "*",
      ) ||
      legacyDefaultRecords[0] ||
      null;

    const actorUserId = await findPermissionActorUserId(
      app,
      {
        roleIds: group.roleIds,
        preferredUserId,
        legacyRecords: legacyDefaultRecords,
      },
    );

    const permissionPayload =
      buildAdministratorDefaultPermissionPayload({
        roleId: group.canonicalRoleId,
        roleName: group.displayName,
        actorUserId,
      });

    const update = {
      $set: permissionPayload,
      $unset: {
        systemRoleKey: 1,
      },
    };

    if (actorUserId) {
      update.$setOnInsert = {
        createdBy: actorUserId,
      };
    }

    const query = targetRecord
      ? { _id: targetRecord._id }
      : {
          roleId: group.canonicalRoleId,
          isSystemDefault: true,
        };

    const wildcardRecord =
      await PermissionModel.findOneAndUpdate(
        query,
        update,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
          strict: false,
          strictQuery: false,
        },
      ).lean();

    const wildcardRecordId = getId(wildcardRecord?._id);

    const duplicateIds = legacyDefaultRecords
      .map((record) => getId(record._id))
      .filter(
        (recordId) =>
          recordId && recordId !== wildcardRecordId,
      );

    if (duplicateIds.length > 0) {
      const deleteResult = await PermissionModel.deleteMany({
        _id: { $in: duplicateIds },
      });

      summary.removedLegacyRecords += Number(
        deleteResult.deletedCount || deleteResult.n || 0,
      );
    }

    summary.createdOrUpdated += 1;
    summary.records.push(wildcardRecord);
  }

  await ensureSystemRoleIdUniqueIndex(PermissionModel);

  if (refreshCache) {
    await rebuildPermissionCache(app);
  }

  return summary;
};

/**
 * Intercepts old generator/seeder input that tries to create one full-access
 * default for every Admin/Super service.
 */
const consolidateAdministratorDefaultPermissionInput = async (
  app,
  data,
) => {
  const roleId = getId(data?.roleId);

  if (!roleId) {
    return null;
  }

  const mongooseClient = app.get("mongooseClient");

  if (!mongooseClient.modelNames().includes("roles")) {
    return null;
  }

  const RoleModel = mongooseClient.model("roles");
  const role = await RoleModel.findById(roleId)
    .select("name")
    .lean();

  if (
    !role ||
    !isAdministratorRoleName(role.name) ||
    !isAdministratorDefaultPermissionRecord(
      {
        ...data,
        roleId,
      },
      role.name,
    )
  ) {
    return null;
  }

  const result = await ensureAdministratorDefaultPermissionSets(
    app,
    {
      roleIds: [roleId],
      preferredUserId:
        getId(data.updatedBy) || getId(data.createdBy),
      refreshCache: false,
    },
  );

  const roleKey = normalizeRoleName(role.name);

  if (!result.records.length) {
    return null;
  }

  const roles = await RoleModel.find({})
    .select("name")
    .lean();

  const equivalentRoleIds = new Set(
    roles
      .filter(
        (item) =>
          normalizeRoleName(item.name) === roleKey,
      )
      .map((item) => getId(item._id)),
  );

  return (
    result.records.find((record) =>
      equivalentRoleIds.has(getId(record?.roleId)),
    ) || null
  );
};

const loadPermissionRecordsFromDatabase = async (app) => {
  const mongooseClient = app.get("mongooseClient");

  if (
    !mongooseClient
      .modelNames()
      .includes("permission_services")
  ) {
    return [];
  }

  const PermissionModel = mongooseClient.model(
    "permission_services",
  );

  return PermissionModel.find({})
    .sort({ updatedAt: 1 })
    .lean();
};

/**
 * Rebuilds the complete Redis permission cache.
 */
const rebuildPermissionCache = async (app) => {
  const records = await loadPermissionRecordsFromDatabase(app);

  try {
    await redisClient.del(PERMISSION_CACHE_KEY);

    await redisClient.set(
      PERMISSION_CACHE_KEY,
      JSON.stringify(records),
      "EX",
      PERMISSION_CACHE_TTL_SECONDS,
    );
  } catch (error) {
    console.error(
      "[Permission Cache] Failed to update Redis:",
      error.message,
    );
  }

  return records;
};

/**
 * Reads permission records from Redis and falls back to MongoDB when Redis is
 * unavailable or empty.
 */
const getCachedPermissionRecords = async (app) => {
  try {
    const cachedValue = await redisClient.get(
      PERMISSION_CACHE_KEY,
    );

    if (cachedValue) {
      const parsedValue = JSON.parse(cachedValue);

      if (Array.isArray(parsedValue)) {
        return parsedValue;
      }
    }
  } catch (error) {
    console.error(
      "[Permission Cache] Failed to read Redis:",
      error.message,
    );
  }

  return rebuildPermissionCache(app);
};

/**
 * Checks whether a permission record applies to the requested service.
 */
const isServiceIncluded = (
  record,
  serviceName,
) => {
  if (!record || !serviceName) {
    return false;
  }

  const mode = record.serviceMode || "include";

  if (
    mode === "exclude" ||
    record.service === "*"
  ) {
    const excludedServices = Array.isArray(record.excludedServices)
      ? record.excludedServices
      : [];

    return !excludedServices.includes(serviceName);
  }

  return record.service === serviceName;
};

/**
 * If exact and wildcard records exist at the same priority, the exact service
 * permission takes precedence. If multiple records still match, the most
 * recently updated record is used.
 */
const choosePermissionRecord = (
  records,
  serviceName,
) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  return [...records].sort((first, second) => {
    const firstExact = first.service === serviceName ? 1 : 0;
    const secondExact = second.service === serviceName ? 1 : 0;

    if (firstExact !== secondExact) {
      return secondExact - firstExact;
    }

    return (
      new Date(second.updatedAt || 0).getTime() -
      new Date(first.updatedAt || 0).getTime()
    );
  })[0];
};

/**
 * Finds and validates the selected profile. The selected profile must belong
 * to the authenticated user.
 */
const getSelectedProfile = async (
  app,
  params,
  selectedProfileId,
) => {
  const authenticatedUserId = getAuthenticatedUserId(params);

  if (!authenticatedUserId) {
    throw new Forbidden(
      "Authenticated user was not found.",
    );
  }

  if (!selectedProfileId) {
    throw new BadRequest(
      "Selected profile is required to check permissions.",
    );
  }

  const mongooseClient = app.get("mongooseClient");

  if (!mongooseClient.modelNames().includes("profiles")) {
    throw new Forbidden(
      "Profiles model was not found.",
    );
  }

  const ProfileModel = mongooseClient.model("profiles");

  const profile = await ProfileModel.findOne({
    _id: selectedProfileId,
    $or: [
      { userId: authenticatedUserId },
      { user: authenticatedUserId },
    ],
  }).lean();

  if (!profile) {
    throw new Forbidden(
      "The selected profile does not belong to the authenticated user.",
    );
  }

  return profile;
};

/**
 * Allows the first profile bootstrap request before x-profile-id exists.
 * Only the authenticated user's own profiles may be queried.
 */
const isOwnProfileBootstrapRequest = (context) => {
  const authenticatedUserId = getAuthenticatedUserId(
    context.params,
  );

  const requestedUserId = getId(
    context.params?.query?.userId,
  );

  const selectedProfileId =
    context.params?.headers?.["x-profile-id"] ||
    context.params?.headers?.["X-Profile-Id"];

  return (
    !selectedProfileId &&
    context.path === "profiles" &&
    context.method === "find" &&
    authenticatedUserId &&
    requestedUserId &&
    authenticatedUserId === requestedUserId
  );
};

/**
 * Allows the frontend to request its effective permission for one service.
 * The permissionServices service must still handle permissionCheck securely
 * and return only the effective permission result, not all permission records.
 */
const isEffectivePermissionLookupRequest = (context) => {
  const permissionCheck =
    context.params?.query?.permissionCheck;

  return (
    context.path === "permissionServices" &&
    context.method === "find" &&
    (permissionCheck === true || permissionCheck === "true") &&
    Boolean(context.params?.query?.service)
  );
};

/**
 * Resolves the selected profile's role information directly from MongoDB.
 * This works even when the profile contains only a role ObjectId.
 */
const getProfileRoleInfo = async (
  app,
  profile,
) => {
  const roleId = getId(
    profile?.role || profile?.roleId,
  );

  if (!roleId) {
    return {
      roleId: null,
      roleName: null,
      roleKey: null,
      equivalentRoleIds: [],
      isAdministrator: false,
    };
  }

  const mongooseClient = app.get("mongooseClient");

  if (!mongooseClient.modelNames().includes("roles")) {
    return {
      roleId,
      roleName: null,
      roleKey: null,
      equivalentRoleIds: [roleId],
      isAdministrator: false,
    };
  }

  const RoleModel = mongooseClient.model("roles");

  const role = await RoleModel.findById(roleId)
    .select("name")
    .lean();

  const roleName = role?.name || null;
  const roleKey = normalizeRoleName(roleName) || null;

  let equivalentRoleIds = roleId ? [roleId] : [];

  if (roleKey) {
    const allRoles = await RoleModel.find({})
      .select("name")
      .lean();

    equivalentRoleIds = allRoles
      .filter(
        (item) =>
          normalizeRoleName(item?.name) === roleKey,
      )
      .map((item) => getId(item._id))
      .filter(Boolean);
  }

  return {
    roleId,
    roleName,
    roleKey,
    equivalentRoleIds,
    isAdministrator: isAdministratorRoleName(roleName),
  };
};

/**
 * Checks whether the selected profile belongs to an Admin or Super role.
 */
const isAdministratorProfile = async (
  app,
  profile,
) => {
  const roleInfo = await getProfileRoleInfo(app, profile);
  return roleInfo.isAdministrator;
};

/**
 * Resolves the first matching permission using Profile -> Position -> Role.
 *
 * Custom role permissions match the exact role ObjectId. The two system
 * defaults are stored against one canonical ObjectId, but also match duplicate
 * role documents that have the same normalized role name.
 */
const findEffectivePermissionRecord = ({
  permissionRecords,
  profile,
  serviceName,
  roleInfo,
}) => {
  const matchingServiceRecords = permissionRecords.filter((record) =>
    isServiceIncluded(record, serviceName),
  );

  const profileId = getId(profile._id);
  const positionId = getId(
    profile.position || profile.positionId,
  );
  const roleId = roleInfo?.roleId || getId(
    profile.role || profile.roleId,
  );

  const equivalentRoleIds = new Set(
    (
      roleInfo?.equivalentRoleIds?.length
        ? roleInfo.equivalentRoleIds
        : [roleId]
    )
      .map(getId)
      .filter(Boolean),
  );

  const profileRecords = matchingServiceRecords.filter(
    (record) => getId(record.profile) === profileId,
  );

  if (profileRecords.length > 0) {
    return {
      record: choosePermissionRecord(
        profileRecords,
        serviceName,
      ),
      source: "profile",
    };
  }

  const positionRecords = matchingServiceRecords.filter(
    (record) =>
      positionId &&
      getId(record.positionId) === positionId,
  );

  if (positionRecords.length > 0) {
    return {
      record: choosePermissionRecord(
        positionRecords,
        serviceName,
      ),
      source: "position",
    };
  }

  const exactRoleRecords = matchingServiceRecords.filter(
    (record) =>
      roleId &&
      getId(record.roleId) === roleId &&
      record.isSystemDefault !== true,
  );

  if (exactRoleRecords.length > 0) {
    return {
      record: choosePermissionRecord(
        exactRoleRecords,
        serviceName,
      ),
      source: "role",
    };
  }

  const systemRoleRecords = matchingServiceRecords.filter(
    (record) =>
      record.isSystemDefault === true &&
      equivalentRoleIds.has(getId(record.roleId)),
  );

  if (systemRoleRecords.length > 0) {
    return {
      record: choosePermissionRecord(
        systemRoleRecords,
        serviceName,
      ),
      source: "role-system-default",
    };
  }

  return null;
};

/**
 * Resolves effective permissions for one service.
 */
const resolveEffectivePermissions = async (
  app,
  serviceName,
  params,
  selectedProfileId,
) => {
  if (!serviceName) {
    throw new BadRequest(
      "Service name is required to check permissions.",
    );
  }

  const normalizedServiceName = normalizeServiceName(serviceName);

  /**
   * Services that do not use JWT authentication are outside the permission
   * system. Return full permissions before attempting to resolve an
   * authenticated user or selected profile.
   *
   * This is also required for permissionServices.find({ permissionCheck: true })
   * because the custom service class calls resolveEffectivePermissions()
   * directly even when the common application hooks are disabled.
   */
  if (isPermissionExcludedService(normalizedServiceName)) {
    return getAllAllowedPermissions(
      "excluded-permission-service",
      "Excluded Service Full Access",
    );
  }

  /**
   * permissionServices is unrestricted for every JWT-authenticated user.
   *
   * Return before selected-profile or authenticated-entity resolution. The
   * common app authentication hook has already validated the JWT, and this
   * avoids the permissionCheck request failing when params.user is not attached
   * in the expected shape.
   */
  if (isUnrestrictedPermissionService(normalizedServiceName)) {
    return getAllAllowedPermissions(
      "unrestricted-permission-service",
      "Permission Sets Full Access",
    );
  }

  const isPermissionServices =
    normalizedServiceName === "permissionServices";

  /**
   * Permission Sets are visible to every authenticated user. Resolve the user
   * from params.user or the JWT payload so projects using either Feathers
   * authentication shape work correctly.
   */
  const authenticatedUserId = getAuthenticatedUserId(params);

  if (isPermissionServices && !authenticatedUserId) {
    throw new Forbidden(
      "Authenticated user was not found.",
    );
  }

  let profile = null;
  let roleInfo = {
    roleId: null,
    roleName: null,
    roleKey: null,
    equivalentRoleIds: [],
    isAdministrator: false,
  };

  /**
   * A selected profile is still used for Admin/Super detection and explicit
   * Profile -> Position -> Role permissions. Permission Sets remain readable
   * when profile selection is not ready yet.
   */
  if (selectedProfileId) {
    try {
      profile = await getSelectedProfile(
        app,
        params,
        selectedProfileId,
      );

      roleInfo = await getProfileRoleInfo(
        app,
        profile,
      );
    } catch (error) {
      if (!isPermissionServices) {
        throw error;
      }

      console.warn(
        "[Permission Sets] Could not resolve selected profile; using authenticated read access:",
        error?.message || error,
      );
    }
  } else if (!isPermissionServices) {
    // Preserve the secure selected-profile requirement for every other service.
    profile = await getSelectedProfile(
      app,
      params,
      selectedProfileId,
    );
  }

  if (
    roleInfo.isAdministrator &&
    ADMIN_ALWAYS_ALLOWED_SERVICES.includes(normalizedServiceName)
  ) {
    return getAllAllowedPermissions(
      "administrator-protected-service",
      "Administrator Permission Management Access",
    );
  }

  const allPermissionRecords = await getCachedPermissionRecords(app);

  if (profile) {
    const matchingPermission = findEffectivePermissionRecord({
      permissionRecords: allPermissionRecords,
      profile,
      serviceName: normalizedServiceName,
      roleInfo,
    });

    if (matchingPermission?.record) {
      const normalizedPermissions = normalizePermissionRecord(
        matchingPermission.record,
        matchingPermission.source,
      );

      /**
       * Reading Permission Sets is always allowed for authenticated users.
       * Explicit records may additionally grant insert/edit/delete actions.
       */
      if (isPermissionServices) {
        return {
          ...normalizedPermissions,
          readOne: true,
          readAll: true,
          read: true,
        };
      }

      return normalizedPermissions;
    }
  }

  if (roleInfo.isAdministrator) {
    return getAllAllowedPermissions();
  }

  if (isPermissionServices) {
    return getPermissionServicesReadPermissions();
  }

  return emptyPermissions();
};

const getRequiredPermission = (context) => {
  if (
    context.params?.permissionAction &&
    STANDARD_ACTIONS.includes(context.params.permissionAction)
  ) {
    return context.params.permissionAction;
  }

  switch (context.method) {
    case "find":
      return "readAll";

    case "get":
      return "readOne";

    case "create":
      return Array.isArray(context.data)
        ? "insertBulk"
        : "insert";

    case "update":
    case "patch":
      return context.id === null || context.id === undefined
        ? "editBulk"
        : "edit";

    case "remove":
      return context.id === null || context.id === undefined
        ? "deleteBulk"
        : "deleteOne";

    default:
      return null;
  }
};

const getSelectedProfileIdFromContext = (context) =>
  context.params?.headers?.["x-profile-id"] ||
  context.params?.headers?.["X-Profile-Id"];

/**
 * Common BEFORE hook for every service.
 *
 * Normal find requests are resolved here but are not blocked here because the
 * number of matching records is only known after the service method runs.
 */
const enforceServicePermission = async (context) => {
  const { params, app, path } = context;

  if (isPermissionExcludedService(path)) {
    return context;
  }

  if (
    !params.provider &&
    !params.permissionAction
  ) {
    return context;
  }

  /**
   * Keep JWT authentication active through app.hooks.js, but bypass every
   * permission/profile check for permissionServices itself.
   */
  if (isUnrestrictedPermissionService(path)) {
    context.params.effectivePermissions =
      getAllAllowedPermissions(
        "unrestricted-permission-service",
        "Permission Sets Full Access",
      );

    context.params.skipFindPermissionResultCheck = true;
    return context;
  }

  if (isOwnProfileBootstrapRequest(context)) {
    context.params.skipFindPermissionResultCheck = true;
    return context;
  }

  if (isEffectivePermissionLookupRequest(context)) {
    const selectedProfileId =
      getSelectedProfileIdFromContext(context) ||
      context.params?.query?.profileId;

    await getSelectedProfile(
      app,
      params,
      selectedProfileId,
    );

    if (
      context.params?.query?.profileId &&
      getId(context.params.query.profileId) !==
        getId(selectedProfileId)
    ) {
      throw new Forbidden(
        "The requested permission profile does not match the selected profile.",
      );
    }

    context.params.skipFindPermissionResultCheck = true;
    return context;
  }

  const requiredPermission = getRequiredPermission(context);

  if (!requiredPermission) {
    return context;
  }

  const selectedProfileId = getSelectedProfileIdFromContext(context);

  const permissions = await resolveEffectivePermissions(
    app,
    path,
    params,
    selectedProfileId,
  );

  context.params.effectivePermissions = permissions;

  /**
   * A standard find request is checked in the after hook:
   *
   * - 0 or 1 matched record -> readOne or readAll
   * - more than 1 matched record -> readAll
   *
   * Custom trusted actions such as export still execute their explicit
   * permission check immediately.
   */
  const isDeferredFindCheck =
    context.method === "find" &&
    !params.permissionAction;

  if (isDeferredFindCheck) {
    context.params.deferFindPermissionCheck = true;
    return context;
  }

  if (!permissions[requiredPermission]) {
    throw new Forbidden(
      `You do not have "${requiredPermission}" permission for the "${path}" service.`,
    );
  }

  return context;
};

/**
 * Returns the total number of records matched by a find request.
 *
 * For paginated responses, result.total is used instead of result.data.length.
 * This prevents a user from bypassing readAll by sending $limit: 1 against a
 * query that actually matches many records.
 */
const getFindMatchedRecordCount = (result) => {
  if (Array.isArray(result)) {
    return result.length;
  }

  if (result && Array.isArray(result.data)) {
    const total = Number(result.total);

    if (Number.isFinite(total)) {
      return total;
    }

    return result.data.length;
  }

  if (result === null || result === undefined) {
    return 0;
  }

  return 1;
};

/**
 * Common AFTER find hook.
 *
 * A find that matches one record is treated like readOne. A find that matches
 * more than one record requires readAll.
 */
const enforceFindResultPermission = async (context) => {
  const { params, path, result } = context;

  if (isPermissionExcludedService(path)) {
    return context;
  }

  if (
    !params.provider &&
    !params.permissionAction
  ) {
    return context;
  }

  if (params.skipFindPermissionResultCheck) {
    return context;
  }

  if (!params.deferFindPermissionCheck) {
    return context;
  }

  const permissions =
    params.effectivePermissions || emptyPermissions();

  const matchedRecordCount = getFindMatchedRecordCount(result);

  if (matchedRecordCount > 1) {
    if (!permissions.readAll) {
      throw new Forbidden(
        `You do not have "readAll" permission for the "${path}" service because this query matched ${matchedRecordCount} records.`,
      );
    }

    return context;
  }

  /**
   * Zero or one matched record is allowed when either readOne or readAll is
   * granted. readAll is also accepted because it is a valid read permission
   * for find requests.
   */
  if (!permissions.readOne && !permissions.readAll) {
    throw new Forbidden(
      `You do not have "readOne" permission for the "${path}" service.`,
    );
  }

  return context;
};

/**
 * Refreshes the Redis cache after permission records are changed.
 */
const refreshPermissionCache = async (context) => {
  try {
    await rebuildPermissionCache(context.app);
  } catch (error) {
    console.error(
      "[Permission Cache] Failed to refresh:",
      error.message,
    );
  }

  return context;
};

/**
 * Used by custom backend routes such as import, export and seeder operations.
 */
const assertServiceAction = async ({
  app,
  params,
  serviceName,
  action,
  selectedProfileId,
}) => {
  if (!STANDARD_ACTIONS.includes(action)) {
    throw new BadRequest(
      `Invalid permission action: ${action}`,
    );
  }

  if (isUnrestrictedPermissionService(serviceName)) {
    return getAllAllowedPermissions(
      "unrestricted-permission-service",
      "Permission Sets Full Access",
    );
  }

  if (isPermissionExcludedService(serviceName)) {
    return getAllAllowedPermissions(
      "excluded-service",
      "Excluded Service",
    );
  }

  const permissions = await resolveEffectivePermissions(
    app,
    serviceName,
    params,
    selectedProfileId,
  );

  if (!permissions[action]) {
    throw new Forbidden(
      `You do not have "${action}" permission for the "${serviceName}" service.`,
    );
  }

  return permissions;
};

module.exports = {
  PERMISSION_CACHE_KEY,
  EXCLUDED_PERMISSION_SERVICES,
  UNRESTRICTED_PERMISSION_SERVICES,
  ADMIN_ALWAYS_ALLOWED_SERVICES,

  normalizeRoleName,
  isAdministratorRoleName,
  getAuthenticatedUserId,

  rebuildPermissionCache,
  getCachedPermissionRecords,

  isPermissionExcludedService,
  isUnrestrictedPermissionService,
  ensureAdministratorDefaultPermissionSets,
  consolidateAdministratorDefaultPermissionInput,
  resolveEffectivePermissions,
  enforceServicePermission,
  enforceFindResultPermission,
  refreshPermissionCache,
  assertServiceAction,
};
