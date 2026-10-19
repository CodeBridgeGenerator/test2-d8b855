const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('audits service', async () => {
    let thisService;
    let auditCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('audits');

        // Create users here
        usersServiceResults = await app
            .service('users')
            .Model.create(usersRefData);
        users = {
            createdBy: usersServiceResults[0]._id,
            updatedBy: usersServiceResults[0]._id
        };
    });

    after(async () => {
        if (usersServiceResults) {
            await Promise.all(
                usersServiceResults.map((i) =>
                    app.service('users').Model.findByIdAndDelete(i._id)
                )
            );
        }
    });

    it('registered the service', () => {
        assert.ok(thisService, 'Registered the service (audits)');
    });

    describe('#create', () => {
        const options = {
            serviceName: ['new value'],
            action: 'new value',
            details: 'new value',
            method: 'new value'
        };

        beforeEach(async () => {
            auditCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new audit', () => {
            assert.strictEqual(auditCreated.serviceName, options.serviceName);
            assert.strictEqual(auditCreated.action, options.action);
            assert.strictEqual(auditCreated.details, options.details);
            assert.strictEqual(auditCreated.method, options.method);
        });
    });

    describe('#get', () => {
        it('should retrieve a audit by ID', async () => {
            const retrieved = await thisService.Model.findById(
                auditCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                auditCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            serviceName: ['updated value'],
            action: 'updated value',
            details: 'updated value',
            method: 'updated value'
        };

        it('should update an existing audit ', async () => {
            const auditUpdated = await thisService.Model.findByIdAndUpdate(
                auditCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(auditUpdated.serviceName, options.serviceName);
            assert.strictEqual(auditUpdated.action, options.action);
            assert.strictEqual(auditUpdated.details, options.details);
            assert.strictEqual(auditUpdated.method, options.method);
        });
    });

    describe('#delete', async () => {
        it('should delete a audit', async () => {
            const auditDeleted = await thisService.Model.findByIdAndDelete(
                auditCreated._id
            );
            assert.strictEqual(
                auditDeleted._id.toString(),
                auditCreated._id.toString()
            );
        });
    });
});
