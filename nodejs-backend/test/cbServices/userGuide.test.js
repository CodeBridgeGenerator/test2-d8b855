const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userGuide service', async () => {
    let thisService;
    let userGuideCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('userGuide');

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
        assert.ok(thisService, 'Registered the service (userGuide)');
    });

    describe('#create', () => {
        const options = {
            serviceName: 'new value',
            expiry: '2026-02-25T01:01:26.306Z'
        };

        beforeEach(async () => {
            userGuideCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userGuide', () => {
            assert.strictEqual(
                userGuideCreated.serviceName,
                options.serviceName
            );
            assert.strictEqual(userGuideCreated.expiry, options.expiry);
        });
    });

    describe('#get', () => {
        it('should retrieve a userGuide by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userGuideCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userGuideCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            serviceName: 'updated value',
            expiry: '2026-02-25T01:01:26.306Z'
        };

        it('should update an existing userGuide ', async () => {
            const userGuideUpdated = await thisService.Model.findByIdAndUpdate(
                userGuideCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                userGuideUpdated.serviceName,
                options.serviceName
            );
            assert.strictEqual(userGuideUpdated.expiry, options.expiry);
        });
    });

    describe('#delete', async () => {
        it('should delete a userGuide', async () => {
            const userGuideDeleted = await thisService.Model.findByIdAndDelete(
                userGuideCreated._id
            );
            assert.strictEqual(
                userGuideDeleted._id.toString(),
                userGuideCreated._id.toString()
            );
        });
    });
});
