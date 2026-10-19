const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('fcms service', async () => {
    let thisService;
    let fcmCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('fcms');

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
        assert.ok(thisService, 'Registered the service (fcms)');
    });

    describe('#create', () => {
        const options = {
            fcmId: 'new value',
            device: 'new value',
            valid: true
        };

        beforeEach(async () => {
            fcmCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new fcm', () => {
            assert.strictEqual(fcmCreated.fcmId, options.fcmId);
            assert.strictEqual(fcmCreated.device, options.device);
            assert.strictEqual(fcmCreated.valid, options.valid);
            assert.strictEqual(fcmCreated.valid, options.valid);
        });
    });

    describe('#get', () => {
        it('should retrieve a fcm by ID', async () => {
            const retrieved = await thisService.Model.findById(fcmCreated._id);
            assert.strictEqual(
                retrieved._id.toString(),
                fcmCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            fcmId: 'updated value',
            device: 'updated value',
            valid: false
        };

        it('should update an existing fcm ', async () => {
            const fcmUpdated = await thisService.Model.findByIdAndUpdate(
                fcmCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(fcmUpdated.fcmId, options.fcmId);
            assert.strictEqual(fcmUpdated.device, options.device);
            assert.strictEqual(fcmUpdated.valid, options.valid);
            assert.strictEqual(fcmUpdated.valid, options.valid);
        });
    });

    describe('#delete', async () => {
        it('should delete a fcm', async () => {
            const fcmDeleted = await thisService.Model.findByIdAndDelete(
                fcmCreated._id
            );
            assert.strictEqual(
                fcmDeleted._id.toString(),
                fcmCreated._id.toString()
            );
        });
    });
});
