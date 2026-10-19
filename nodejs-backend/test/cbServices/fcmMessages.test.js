const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('fcmMessages service', async () => {
    let thisService;
    let fcmMessageCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        title: 'new value',
        body: 'new value',
        recipients: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });

    beforeEach(async () => {
        thisService = await app.service('fcmMessages');

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
        assert.ok(thisService, 'Registered the service (fcmMessages)');
    });

    describe('#create', () => {
        const options = {
            title: 'new value',
            body: 'new value',
            recipients: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: 'new value',
            image: 'new value',
            payload: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            },
            successCount: 23,
            failureCount: 23
        };

        beforeEach(async () => {
            fcmMessageCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new fcmMessage', () => {
            assert.strictEqual(fcmMessageCreated.title, options.title);
            assert.strictEqual(fcmMessageCreated.body, options.body);
            assert.strictEqual(
                fcmMessageCreated.recipients.toString(),
                options.recipients.toString()
            );
            assert.strictEqual(fcmMessageCreated.image, options.image);
            assert.strictEqual(fcmMessageCreated.payload, options.payload);
            assert.strictEqual(fcmMessageCreated.status, options.status);
            assert.strictEqual(
                fcmMessageCreated.successCount,
                options.successCount
            );
            assert.strictEqual(
                fcmMessageCreated.failureCount,
                options.failureCount
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a fcmMessage by ID', async () => {
            const retrieved = await thisService.Model.findById(
                fcmMessageCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                fcmMessageCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            title: 'updated value',
            body: 'updated value',
            recipients: `${usersCreated._id}`,
            image: 'updated value',
            payload: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            },
            status: 'updated value',
            successCount: 100,
            failureCount: 100
        };

        it('should update an existing fcmMessage ', async () => {
            const fcmMessageUpdated = await thisService.Model.findByIdAndUpdate(
                fcmMessageCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(fcmMessageUpdated.title, options.title);
            assert.strictEqual(fcmMessageUpdated.body, options.body);
            assert.strictEqual(
                fcmMessageUpdated.recipients.toString(),
                options.recipients.toString()
            );
            assert.strictEqual(fcmMessageUpdated.image, options.image);
            assert.strictEqual(fcmMessageUpdated.payload, options.payload);
            assert.strictEqual(fcmMessageUpdated.status, options.status);
            assert.strictEqual(
                fcmMessageUpdated.successCount,
                options.successCount
            );
            assert.strictEqual(
                fcmMessageUpdated.failureCount,
                options.failureCount
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a fcmMessage', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const fcmMessageDeleted = await thisService.Model.findByIdAndDelete(
                fcmMessageCreated._id
            );
            assert.strictEqual(
                fcmMessageDeleted._id.toString(),
                fcmMessageCreated._id.toString()
            );
        });
    });
});
