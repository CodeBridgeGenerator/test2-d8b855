const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('loginHistories service', async () => {
    let thisService;
    let loginHistoryCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });

    beforeEach(async () => {
        thisService = await app.service('loginHistories');

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
        assert.ok(thisService, 'Registered the service (loginHistories)');
    });

    describe('#create', () => {
        const options = {
            userId: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            device: 'new value',
            browser: 'new value',
            userAgent: 'new value',
            loginTime: '2026-02-25T01:01:27.803Z'
        };

        beforeEach(async () => {
            loginHistoryCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new loginHistory', () => {
            assert.strictEqual(
                loginHistoryCreated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(loginHistoryCreated.device, options.device);
            assert.strictEqual(loginHistoryCreated.browser, options.browser);
            assert.strictEqual(
                loginHistoryCreated.userAgent,
                options.userAgent
            );
            assert.strictEqual(
                loginHistoryCreated.loginTime,
                options.loginTime
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a loginHistory by ID', async () => {
            const retrieved = await thisService.Model.findById(
                loginHistoryCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                loginHistoryCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            userId: `${usersCreated._id}`,
            device: 'updated value',
            browser: 'updated value',
            userAgent: 'updated value',
            loginTime: '2026-02-25T01:01:27.803Z'
        };

        it('should update an existing loginHistory ', async () => {
            const loginHistoryUpdated =
                await thisService.Model.findByIdAndUpdate(
                    loginHistoryCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                loginHistoryUpdated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(loginHistoryUpdated.device, options.device);
            assert.strictEqual(loginHistoryUpdated.browser, options.browser);
            assert.strictEqual(
                loginHistoryUpdated.userAgent,
                options.userAgent
            );
            assert.strictEqual(
                loginHistoryUpdated.loginTime,
                options.loginTime
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a loginHistory', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const loginHistoryDeleted =
                await thisService.Model.findByIdAndDelete(
                    loginHistoryCreated._id
                );
            assert.strictEqual(
                loginHistoryDeleted._id.toString(),
                loginHistoryCreated._id.toString()
            );
        });
    });
});
