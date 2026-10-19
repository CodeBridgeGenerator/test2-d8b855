const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('fcmQues service', async () => {
    let thisService;
    let fcmQueCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('fcmQues');

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
        assert.ok(thisService, 'Registered the service (fcmQues)');
    });

    describe('#create', () => {
        const options = {
            payload: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            }
        };

        beforeEach(async () => {
            fcmQueCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new fcmQue', () => {
            assert.strictEqual(fcmQueCreated.payload, options.payload);
        });
    });

    describe('#get', () => {
        it('should retrieve a fcmQue by ID', async () => {
            const retrieved = await thisService.Model.findById(
                fcmQueCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                fcmQueCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            payload: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            }
        };

        it('should update an existing fcmQue ', async () => {
            const fcmQueUpdated = await thisService.Model.findByIdAndUpdate(
                fcmQueCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(fcmQueUpdated.payload, options.payload);
        });
    });

    describe('#delete', async () => {
        it('should delete a fcmQue', async () => {
            const fcmQueDeleted = await thisService.Model.findByIdAndDelete(
                fcmQueCreated._id
            );
            assert.strictEqual(
                fcmQueDeleted._id.toString(),
                fcmQueCreated._id.toString()
            );
        });
    });
});
