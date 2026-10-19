const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('templates service', async () => {
    let thisService;
    let templateCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('templates');

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
        assert.ok(thisService, 'Registered the service (templates)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            subject: 'new value',
            body: 'new value',
            variables: 'new value',
            image: 'new value'
        };

        beforeEach(async () => {
            templateCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new template', () => {
            assert.strictEqual(templateCreated.name, options.name);
            assert.strictEqual(templateCreated.subject, options.subject);
            assert.strictEqual(templateCreated.body, options.body);
            assert.strictEqual(templateCreated.variables, options.variables);
            assert.strictEqual(templateCreated.image, options.image);
        });
    });

    describe('#get', () => {
        it('should retrieve a template by ID', async () => {
            const retrieved = await thisService.Model.findById(
                templateCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                templateCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            subject: 'updated value',
            body: 'updated value',
            variables: 'updated value',
            image: 'updated value'
        };

        it('should update an existing template ', async () => {
            const templateUpdated = await thisService.Model.findByIdAndUpdate(
                templateCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(templateUpdated.name, options.name);
            assert.strictEqual(templateUpdated.subject, options.subject);
            assert.strictEqual(templateUpdated.body, options.body);
            assert.strictEqual(templateUpdated.variables, options.variables);
            assert.strictEqual(templateUpdated.image, options.image);
        });
    });

    describe('#delete', async () => {
        it('should delete a template', async () => {
            const templateDeleted = await thisService.Model.findByIdAndDelete(
                templateCreated._id
            );
            assert.strictEqual(
                templateDeleted._id.toString(),
                templateCreated._id.toString()
            );
        });
    });
});
