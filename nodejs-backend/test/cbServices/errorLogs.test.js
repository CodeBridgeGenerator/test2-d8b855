const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('errorLogs service', async () => {
    let thisService;
    let errorLogCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('errorLogs');

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
        assert.ok(thisService, 'Registered the service (errorLogs)');
    });

    describe('#create', () => {
        const options = {
            serviceName: 'new value',
            errorMessage: 'new value',
            message: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            },
            requestBody: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            },
            stack: 'new value',
            details: 'new value'
        };

        beforeEach(async () => {
            errorLogCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new errorLog', () => {
            assert.strictEqual(
                errorLogCreated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                errorLogCreated.errorMessage,
                options.errorMessage
            );
            assert.strictEqual(errorLogCreated.message, options.message);
            assert.strictEqual(
                errorLogCreated.requestBody,
                options.requestBody
            );
            assert.strictEqual(errorLogCreated.stack, options.stack);
            assert.strictEqual(errorLogCreated.details, options.details);
        });
    });

    describe('#get', () => {
        it('should retrieve a errorLog by ID', async () => {
            const retrieved = await thisService.Model.findById(
                errorLogCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                errorLogCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            serviceName: 'updated value',
            errorMessage: 'updated value',
            message: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            },
            requestBody: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            },
            stack: 'updated value',
            details: 'updated value'
        };

        it('should update an existing errorLog ', async () => {
            const errorLogUpdated = await thisService.Model.findByIdAndUpdate(
                errorLogCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                errorLogUpdated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                errorLogUpdated.errorMessage,
                options.errorMessage
            );
            assert.strictEqual(errorLogUpdated.message, options.message);
            assert.strictEqual(
                errorLogUpdated.requestBody,
                options.requestBody
            );
            assert.strictEqual(errorLogUpdated.stack, options.stack);
            assert.strictEqual(errorLogUpdated.details, options.details);
        });
    });

    describe('#delete', async () => {
        it('should delete a errorLog', async () => {
            const errorLogDeleted = await thisService.Model.findByIdAndDelete(
                errorLogCreated._id
            );
            assert.strictEqual(
                errorLogDeleted._id.toString(),
                errorLogCreated._id.toString()
            );
        });
    });
});
