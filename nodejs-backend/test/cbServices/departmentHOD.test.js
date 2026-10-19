const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('departmentHOD service', async () => {
    let thisService;
    let departmentHODCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('departmentHOD');

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
        assert.ok(thisService, 'Registered the service (departmentHOD)');
    });

    describe('#create', () => {
        const options = { name: 'new value' };

        beforeEach(async () => {
            departmentHODCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new departmentHOD', () => {
            assert.strictEqual(departmentHODCreated.name, options.name);
        });
    });

    describe('#get', () => {
        it('should retrieve a departmentHOD by ID', async () => {
            const retrieved = await thisService.Model.findById(
                departmentHODCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                departmentHODCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = { name: 'updated value' };

        it('should update an existing departmentHOD ', async () => {
            const departmentHODUpdated =
                await thisService.Model.findByIdAndUpdate(
                    departmentHODCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(departmentHODUpdated.name, options.name);
        });
    });

    describe('#delete', async () => {
        it('should delete a departmentHOD', async () => {
            const departmentHODDeleted =
                await thisService.Model.findByIdAndDelete(
                    departmentHODCreated._id
                );
            assert.strictEqual(
                departmentHODDeleted._id.toString(),
                departmentHODCreated._id.toString()
            );
        });
    });
});
