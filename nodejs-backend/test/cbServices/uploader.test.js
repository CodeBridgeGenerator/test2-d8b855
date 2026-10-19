const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('uploader service', async () => {
    let thisService;
    let uploaderCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        serviceName: 'new value',
        user: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });

    beforeEach(async () => {
        thisService = await app.service('uploader');

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
        assert.ok(thisService, 'Registered the service (uploader)');
    });

    describe('#create', () => {
        const options = {
            serviceName: 'new value',
            user: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            results: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            }
        };

        beforeEach(async () => {
            uploaderCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new uploader', () => {
            assert.strictEqual(
                uploaderCreated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                uploaderCreated.user.toString(),
                options.user.toString()
            );
            assert.strictEqual(uploaderCreated.results, options.results);
        });
    });

    describe('#get', () => {
        it('should retrieve a uploader by ID', async () => {
            const retrieved = await thisService.Model.findById(
                uploaderCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                uploaderCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            serviceName: 'updated value',
            user: `${usersCreated._id}`,
            results: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            }
        };

        it('should update an existing uploader ', async () => {
            const uploaderUpdated = await thisService.Model.findByIdAndUpdate(
                uploaderCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                uploaderUpdated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                uploaderUpdated.user.toString(),
                options.user.toString()
            );
            assert.strictEqual(uploaderUpdated.results, options.results);
        });
    });

    describe('#delete', async () => {
        it('should delete a uploader', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const uploaderDeleted = await thisService.Model.findByIdAndDelete(
                uploaderCreated._id
            );
            assert.strictEqual(
                uploaderDeleted._id.toString(),
                uploaderCreated._id.toString()
            );
        });
    });
});
