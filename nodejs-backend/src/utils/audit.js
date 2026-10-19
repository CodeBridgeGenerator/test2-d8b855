module.exports = {
    before: {
        update: async (context) => {
            await createAuditLog(context, 'update');
            return context;
        },
        patch: async (context) => {
            await createAuditLog(context, 'patch');
            return context;
        },
        remove: async (context) => {
            await createAuditLog(context, 'remove');
            return context;
        }
    },
    after: {
        create: async (context) => {
            await createAuditLog(context, 'create', context.result);
            return context;
        },
        update: async (context) => {
            await createAuditLog(context, 'update', context.result);
            return context;
        },
        patch: async (context) => {
            await createAuditLog(context, 'patch', context.result);
            return context;
        },
        remove: async (context) => {
            await createAuditLog(context, 'remove', context.result);
            return context;
        }
    },
    error: {}
};

async function createAuditLog(context, action, result = null) {
    const { app, method, params, data, path } = context;

    if (!params.user || !params.user._id) {
        return;
    }

    try {
        const auditData = {
            action,
            createdBy: params.user._id,
            serviceName: path,
            method,
            details: JSON.stringify(
                await resolveData(app, path, result || data)
            )
        };

        await app.service('audits').create(auditData);
    } catch (error) {
        console.error('Error creating audit log:', error);
    }
}

async function resolveData(app, serviceName, data) {
    if (!data) return {};

    const resolved = { ...data };

    try {
        const service = app.service(serviceName);
        const schemaPaths = service.Model.schema.paths;

        for (const key in schemaPaths) {
            const fieldSchema = schemaPaths[key];
            resolved[key] = await resolveField(resolved[key], fieldSchema, app);
        }
    } catch (error) {
        console.error(
            `Error resolving data for ${serviceName}:`,
            error.message
        );
    }

    return resolved;
}

async function resolveField(value, fieldSchema, app) {
    if (!fieldSchema) return value;

    const ref = fieldSchema.options.ref || fieldSchema.caster?.options.ref;

    if (fieldSchema.instance === 'ObjectID' && ref) {
        if (isObjectId(value)) {
            try {
                const refRecord = await app.service(ref).get(value);
                const refSchema = app.service(ref).Model.schema.tree;
                const displayField = getDisplayField(refSchema);
                return refRecord[displayField] || `Record not found (${value})`;
            } catch (error) {
                return `Record not found (${value})`;
            }
        }
    } else if (
        fieldSchema.instance === 'Array' &&
        fieldSchema.caster.instance === 'ObjectID' &&
        ref
    ) {
        if (Array.isArray(value)) {
            return Promise.all(
                value.map(async (id) => {
                    if (isObjectId(id)) {
                        try {
                            const refRecord = await app.service(ref).get(id);
                            const refSchema =
                                app.service(ref).Model.schema.tree;
                            const displayField = getDisplayField(refSchema);
                            return (
                                refRecord[displayField] ||
                                `Record not found (${id})`
                            );
                        } catch (error) {
                            return `Record not found (${id})`;
                        }
                    }
                    return id;
                })
            );
        }
    } else if (fieldSchema.instance === 'Embedded') {
        if (typeof value === 'object' && value !== null) {
            const resolvedObj = { ...value };
            const subSchemaPaths = fieldSchema.schema.paths;
            for (const subKey in subSchemaPaths) {
                resolvedObj[subKey] = await resolveField(
                    resolvedObj[subKey],
                    subSchemaPaths[subKey],
                    app
                );
            }
            return resolvedObj;
        }
    } else if (
        fieldSchema.instance === 'Array' &&
        fieldSchema.caster.instance === 'Embedded'
    ) {
        if (Array.isArray(value)) {
            return Promise.all(
                value.map(async (item) => {
                    if (typeof item === 'object' && item !== null) {
                        const resolvedItem = { ...item };
                        const subSchemaPaths = fieldSchema.caster.schema.paths;
                        for (const subKey in subSchemaPaths) {
                            resolvedItem[subKey] = await resolveField(
                                resolvedItem[subKey],
                                subSchemaPaths[subKey],
                                app
                            );
                        }
                        return resolvedItem;
                    }
                    return item;
                })
            );
        }
    }

    return value;
}

function getDisplayField(schemaTree) {
    // Prioritize 'name' field
    if (
        schemaTree.name &&
        (schemaTree.name.type === String || schemaTree.name.type === 'String')
    )
        return 'name';

    // Find first string field
    for (const key in schemaTree) {
        if (
            schemaTree[key].type === String ||
            schemaTree[key].type === 'String'
        )
            return key;
    }

    // Find first number field
    for (const key in schemaTree) {
        if (
            schemaTree[key].type === Number ||
            schemaTree[key].type === 'Number'
        )
            return key;
    }

    // Fallback to '_id'
    return '_id';
}

function isObjectId(value) {
    return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}
