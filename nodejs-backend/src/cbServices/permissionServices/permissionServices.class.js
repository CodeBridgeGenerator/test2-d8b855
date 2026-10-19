const { Service } = require("feathers-mongoose");
const FindService = require("../../utils/abstracts/FindService");

const {
  resolveEffectivePermissions,
  ensureAdministratorDefaultPermissionSets,
  consolidateAdministratorDefaultPermissionInput,
  rebuildPermissionCache,
} = require("../../hooks/servicePermission");

const MixedService = FindService(Service);

exports.PermissionServices =
  class PermissionServices extends MixedService {
    constructor(options, app) {
      super(options, app);
      this.app = app;
    }

    /**
     * Runs once when the Feathers application is set up.
     *
     * Existing Admin/Super per-service defaults are migrated into exactly one
     * wildcard record for Admin and one for Super. Each retained system record
     * stores a real roleId ObjectId. Duplicate role names are consolidated
     * without removing custom permission sets.
     */
    async setup(app, path) {
      if (typeof super.setup === "function") {
        await super.setup(app, path);
      }

      try {
        const summary =
          await ensureAdministratorDefaultPermissionSets(app, {
            refreshCache: true,
          });

        if (
          summary.createdOrUpdated > 0 ||
          summary.removedLegacyRecords > 0
        ) {
          console.log(
            "[Permission Sets] Admin/Super defaults consolidated:",
            {
              createdOrUpdated: summary.createdOrUpdated,
              removedLegacyRecords:
                summary.removedLegacyRecords,
            },
          );
        }
      } catch (error) {
        console.error(
          "[Permission Sets] Failed to consolidate Admin/Super defaults:",
          error.message,
        );
      }
    }

    /**
     * Protects against the old generator/seeder behavior that creates one
     * "Default Permission Set" for every service.
     *
     * A full-access role-level default for Admin or Super is intercepted and
     * upserted into the single wildcard record for that administrator role
     * instead. The retained record uses a canonical roleId ObjectId:
     *
     * serviceMode: "exclude"
     * service: "*"
     * excludedServices: []
     */
    async create(data, params = {}) {
      const inputRecords = Array.isArray(data)
        ? data
        : [data];

      const results = [];
      let consolidatedAnySystemDefault = false;

      for (const inputRecord of inputRecords) {
        const consolidatedRecord =
          await consolidateAdministratorDefaultPermissionInput(
            this.app,
            inputRecord,
          );

        if (consolidatedRecord) {
          consolidatedAnySystemDefault = true;
          results.push(consolidatedRecord);
          continue;
        }

        const createdRecord = await super.create(
          inputRecord,
          params,
        );

        results.push(createdRecord);
      }

      if (consolidatedAnySystemDefault) {
        await rebuildPermissionCache(this.app);
      }

      return Array.isArray(data)
        ? results
        : results[0];
    }

    async find(params = {}) {
      const query = params.query || {};

      const isPermissionCheck =
        query.permissionCheck === true ||
        query.permissionCheck === "true";

      if (isPermissionCheck) {
        const permissions =
          await resolveEffectivePermissions(
            this.app,
            query.service,
            params,
            query.profileId,
          );

        return {
          total: 1,
          limit: 1,
          skip: 0,
          data: [permissions],
        };
      }

      return super.find(params);
    }
  };
