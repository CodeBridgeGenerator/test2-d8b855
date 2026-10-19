const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('branches service', async () => {
    let thisService;
    let branchCreated;
    let usersServiceResults;
    let users;

    const companiesCreated = await app.service('companies').Model.create({
        companyId: 'parentObjectId',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.240Z',
        isdefault: true
    });

    beforeEach(async () => {
        thisService = await app.service('branches');

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
        assert.ok(thisService, 'Registered the service (branches)');
    });

    describe('#create', () => {
        const options = {
            companyId: `${companiesCreated._id}`,
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:23.240Z',
            isdefault: true,
            isDefault: true
        };

        beforeEach(async () => {
            branchCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new branch', () => {
            assert.strictEqual(
                branchCreated.companyId.toString(),
                options.companyId.toString()
            );
            assert.strictEqual(branchCreated.name, options.name);
            assert.strictEqual(branchCreated.isDefault, options.isDefault);
            assert.strictEqual(branchCreated.isDefault, options.isDefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a branch by ID', async () => {
            const retrieved = await thisService.Model.findById(
                branchCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                branchCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            companyId: `${companiesCreated._id}`,
            name: 'updated value',
            isDefault: false
        };

        it('should update an existing branch ', async () => {
            const branchUpdated = await thisService.Model.findByIdAndUpdate(
                branchCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                branchUpdated.companyId.toString(),
                options.companyId.toString()
            );
            assert.strictEqual(branchUpdated.name, options.name);
            assert.strictEqual(branchUpdated.isDefault, options.isDefault);
            assert.strictEqual(branchUpdated.isDefault, options.isDefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a branch', async () => {
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);

            const branchDeleted = await thisService.Model.findByIdAndDelete(
                branchCreated._id
            );
            assert.strictEqual(
                branchDeleted._id.toString(),
                branchCreated._id.toString()
            );
        });
    });
});
