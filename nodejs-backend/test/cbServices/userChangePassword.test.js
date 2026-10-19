const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userChangePassword service', async () => {
    let thisService;
    let userChangePasswordCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('userChangePassword');

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
        assert.ok(thisService, 'Registered the service (userChangePassword)');
    });

    describe('#create', () => {
        const options = {
            userEmail: 'new value',
            server: 'new value',
            environment: 'new value',
            code: 'new value',
            status: true,
            sendEmailCounter: 23,
            lastAttempt: '2026-02-25T01:01:28.442Z',
            ipAddress: 'new value'
        };

        beforeEach(async () => {
            userChangePasswordCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userChangePassword', () => {
            assert.strictEqual(
                userChangePasswordCreated.userEmail,
                options.userEmail
            );
            assert.strictEqual(
                userChangePasswordCreated.server,
                options.server
            );
            assert.strictEqual(
                userChangePasswordCreated.environment,
                options.environment
            );
            assert.strictEqual(userChangePasswordCreated.code, options.code);
            assert.strictEqual(
                userChangePasswordCreated.status,
                options.status
            );
            assert.strictEqual(
                userChangePasswordCreated.status,
                options.status
            );
            assert.strictEqual(
                userChangePasswordCreated.sendEmailCounter,
                options.sendEmailCounter
            );
            assert.strictEqual(
                userChangePasswordCreated.lastAttempt,
                options.lastAttempt
            );
            assert.strictEqual(
                userChangePasswordCreated.ipAddress,
                options.ipAddress
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a userChangePassword by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userChangePasswordCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userChangePasswordCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            userEmail: 'updated value',
            server: 'updated value',
            environment: 'updated value',
            code: 'updated value',
            status: false,
            sendEmailCounter: 100,
            lastAttempt: '2026-02-25T01:01:28.442Z',
            ipAddress: 'updated value'
        };

        it('should update an existing userChangePassword ', async () => {
            const userChangePasswordUpdated =
                await thisService.Model.findByIdAndUpdate(
                    userChangePasswordCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                userChangePasswordUpdated.userEmail,
                options.userEmail
            );
            assert.strictEqual(
                userChangePasswordUpdated.server,
                options.server
            );
            assert.strictEqual(
                userChangePasswordUpdated.environment,
                options.environment
            );
            assert.strictEqual(userChangePasswordUpdated.code, options.code);
            assert.strictEqual(
                userChangePasswordUpdated.status,
                options.status
            );
            assert.strictEqual(
                userChangePasswordUpdated.status,
                options.status
            );
            assert.strictEqual(
                userChangePasswordUpdated.sendEmailCounter,
                options.sendEmailCounter
            );
            assert.strictEqual(
                userChangePasswordUpdated.lastAttempt,
                options.lastAttempt
            );
            assert.strictEqual(
                userChangePasswordUpdated.ipAddress,
                options.ipAddress
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a userChangePassword', async () => {
            const userChangePasswordDeleted =
                await thisService.Model.findByIdAndDelete(
                    userChangePasswordCreated._id
                );
            assert.strictEqual(
                userChangePasswordDeleted._id.toString(),
                userChangePasswordCreated._id.toString()
            );
        });
    });
});
