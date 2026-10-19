const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('departmentHOS service', async () => {
    let thisService;
    let departmentHOCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('departmentHOS');

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
        assert.ok(thisService, 'Registered the service (departmentHOS)');
    });

    describe('#create', () => {
        const options = { name: 'new value' };

        beforeEach(async () => {
            departmentHOCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new departmentHO', () => {
            assert.strictEqual(departmentHOCreated.name, options.name);
        });
    });

    describe('#get', () => {
        it('should retrieve a departmentHO by ID', async () => {
            const retrieved = await thisService.Model.findById(
                departmentHOCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                departmentHOCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = { name: 'updated value' };

        it('should update an existing departmentHO ', async () => {
            const departmentHOUpdated =
                await thisService.Model.findByIdAndUpdate(
                    departmentHOCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(departmentHOUpdated.name, options.name);
        });
    });

    describe('#delete', async () => {
        it('should delete a departmentHO', async () => {
            const departmentHODeleted =
                await thisService.Model.findByIdAndDelete(
                    departmentHOCreated._id
                );
            assert.strictEqual(
                departmentHODeleted._id.toString(),
                departmentHOCreated._id.toString()
            );
        });
    });
});
