module.exports = {
    after: {
        create(context) {
            if (Array.isArray(context.result) && context.result.length > 1) {
                return context;
            }
            createNotification(context, 'created', context.result);
            return context;
        },
        update(context) {
            if (Array.isArray(context.result) && context.result.length > 1) {
                return context;
            }
            createNotification(context, 'updated', context.result);
            return context;
        },
        patch(context) {
            if (Array.isArray(context.result) && context.result.length > 1) {
                return context;
            }
            createNotification(context, 'updated', context.result);
            return context;
        },
        remove(context) {
            if (Array.isArray(context.result) && context.result.length > 1) {
                return context;
            }

            if (context.result && context.result.deletedCount > 1) {
                return context;
            }

            if (!Array.isArray(context.result)) {
                createNotification(context, 'removed', context.result);
            }
            return context;
        }
    }
};

/**
 * Converts camelCase string to normal case with spaces and capital first letter
 * Examples:
 * - "customerDetails" → "Customer Details"
 * - "dashboardUserManagement" → "Dashboard User Management"
 * - "companies" → "Companies"
 * - "userProfile" → "User Profile"
 */
function camelCaseToNormalCase(str) {
    if (!str) return '';

    // Insert space before capital letters and capitalize first letter
    return str
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
        .trim(); // Remove any extra spaces
}

async function createNotification(context, action, result = null) {
    const { app, params, path } = context;

    if (
        path === 'notifications' ||
        path === 'authentication' ||
        path === 'audits' ||
        path === 'documentStorages' ||
        path === 'mailQues' ||
        path === 'mails' ||
        path === 'userInvites' ||
        path === 'loginHistories' ||
        path === 'users' ||
        path === 'profiles' ||
        path === 'userChangePassword' ||
        path === 'companies' ||
        path === 'branches' ||
        path === 'roles' ||
        path === 'positions' ||
        path === 'forgotPassword' ||
        path === 'incomingUsedPartsQuotations' ||
        path === 'fcmQues' ||
        path === 'fcm' ||
        path === 'fcmMessages'
    ) {
        return context;
    }

    // Default to _id
    let identifierField = '_id';

    // Try to access the service's Mongoose model schema
    try {
        const service = app.service(path);
        const schema = service.Model?.schema?.tree;

        if (schema) {
            // Convert schema fields to an array for processing
            const fields = Object.keys(schema).map((key) => ({
                field: key,
                properties: schema[key]
            }));

            // Check for 'name' field first
            const nameField = fields.find(
                (field) =>
                    field.field === 'name' &&
                    (field.properties.type === String ||
                        field.properties.type === 'String')
            );
            if (nameField) {
                identifierField = 'name';
            } else {
                // Find the first string field
                const stringField = fields.find(
                    (field) =>
                        field.properties.type === String ||
                        field.properties.type === 'String'
                );
                if (stringField) {
                    identifierField = stringField.field;
                } else {
                    // If no string field found, look for the first number field
                    const numberField = fields.find(
                        (field) =>
                            field.properties.type === Number ||
                            field.properties.type === 'Number'
                    );
                    if (numberField) {
                        identifierField = numberField.field;
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error accessing schema for ${path}:`, error);
        // Fallback to _id if schema access fails
    }

    // Get the record identifier
    const recordIdentifier = result
        ? result[identifierField] || result._id || null
        : null;

    if (!recordIdentifier) {
        return context;
    }

    // Convert the service name from camelCase to normal case
    const serviceDisplayName = camelCaseToNormalCase(path);

    const notificationData = {
        toUser: params.user._id,
        content: `${serviceDisplayName} "${recordIdentifier}" was ${action}`,
        read: false,
        sent: new Date(),
        createdBy: params?.user?._id || null,
        updatedBy: params?.user?._id || null,
        path: path,
        recordId: result._id,
        recordName: recordIdentifier,
        identifierField: identifierField
    };

    try {
        await app.service('notifications').create(notificationData);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}
