const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('roles service', async () => {
    let thisService;
    let roleCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('roles');

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
        assert.ok(thisService, 'Registered the service (roles)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            description: 'new value',
            isDefault: true
        };

        beforeEach(async () => {
            roleCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new role', () => {
            assert.strictEqual(roleCreated.name, options.name);
            assert.strictEqual(roleCreated.description, options.description);
            assert.strictEqual(roleCreated.isDefault, options.isDefault);
            assert.strictEqual(roleCreated.isDefault, options.isDefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a role by ID', async () => {
            const retrieved = await thisService.Model.findById(roleCreated._id);
            assert.strictEqual(
                retrieved._id.toString(),
                roleCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            description: 'updated value',
            isDefault: false
        };

        it('should update an existing role ', async () => {
            const roleUpdated = await thisService.Model.findByIdAndUpdate(
                roleCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(roleUpdated.name, options.name);
            assert.strictEqual(roleUpdated.description, options.description);
            assert.strictEqual(roleUpdated.isDefault, options.isDefault);
            assert.strictEqual(roleUpdated.isDefault, options.isDefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a role', async () => {
            const roleDeleted = await thisService.Model.findByIdAndDelete(
                roleCreated._id
            );
            assert.strictEqual(
                roleDeleted._id.toString(),
                roleCreated._id.toString()
            );
        });
    });
});
