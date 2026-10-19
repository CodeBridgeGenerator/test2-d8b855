const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('positions service', async () => {
    let thisService;
    let positionCreated;
    let usersServiceResults;
    let users;

    const rolesCreated = await app.service('roles').Model.create({
        roleId: 'parentObjectId',
        name: 'new value',
        description: 'new value',
        isDefault: true
    });

    beforeEach(async () => {
        thisService = await app.service('positions');

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
        assert.ok(thisService, 'Registered the service (positions)');
    });

    describe('#create', () => {
        const options = {
            roleId: `${rolesCreated._id}`,
            name: 'new value',
            description: 'new value',
            isDefault: true,
            abbr: 'new value'
        };

        beforeEach(async () => {
            positionCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new position', () => {
            assert.strictEqual(
                positionCreated.roleId.toString(),
                options.roleId.toString()
            );
            assert.strictEqual(positionCreated.name, options.name);
            assert.strictEqual(
                positionCreated.description,
                options.description
            );
            assert.strictEqual(positionCreated.abbr, options.abbr);
            assert.strictEqual(positionCreated.isDefault, options.isDefault);
            assert.strictEqual(positionCreated.isDefault, options.isDefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a position by ID', async () => {
            const retrieved = await thisService.Model.findById(
                positionCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                positionCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            roleId: `${rolesCreated._id}`,
            name: 'updated value',
            description: 'updated value',
            abbr: 'updated value',
            isDefault: false
        };

        it('should update an existing position ', async () => {
            const positionUpdated = await thisService.Model.findByIdAndUpdate(
                positionCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                positionUpdated.roleId.toString(),
                options.roleId.toString()
            );
            assert.strictEqual(positionUpdated.name, options.name);
            assert.strictEqual(
                positionUpdated.description,
                options.description
            );
            assert.strictEqual(positionUpdated.abbr, options.abbr);
            assert.strictEqual(positionUpdated.isDefault, options.isDefault);
            assert.strictEqual(positionUpdated.isDefault, options.isDefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a position', async () => {
            await app
                .service('roles')
                .Model.findByIdAndDelete(rolesCreated._id);

            const positionDeleted = await thisService.Model.findByIdAndDelete(
                positionCreated._id
            );
            assert.strictEqual(
                positionDeleted._id.toString(),
                positionCreated._id.toString()
            );
        });
    });
});
