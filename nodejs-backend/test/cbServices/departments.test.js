const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('departments service', async () => {
    let thisService;
    let departmentCreated;
    let usersServiceResults;
    let users;

    const companiesCreated = await app.service('companies').Model.create({
        company: 'parentObjectId',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.335Z',
        isdefault: true
    });

    beforeEach(async () => {
        thisService = await app.service('departments');

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
        assert.ok(thisService, 'Registered the service (departments)');
    });

    describe('#create', () => {
        const options = {
            company: `${companiesCreated._id}`,
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:23.335Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            isDefault: true
        };

        beforeEach(async () => {
            departmentCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new department', () => {
            assert.strictEqual(
                departmentCreated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(departmentCreated.deptName, options.deptName);
            assert.strictEqual(departmentCreated.code, options.code);
            assert.strictEqual(departmentCreated.isDefault, options.isDefault);
            assert.strictEqual(departmentCreated.isDefault, options.isDefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a department by ID', async () => {
            const retrieved = await thisService.Model.findById(
                departmentCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                departmentCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            company: `${companiesCreated._id}`,
            deptName: 'updated value',
            code: 'updated value',
            isDefault: false
        };

        it('should update an existing department ', async () => {
            const departmentUpdated = await thisService.Model.findByIdAndUpdate(
                departmentCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                departmentUpdated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(departmentUpdated.deptName, options.deptName);
            assert.strictEqual(departmentUpdated.code, options.code);
            assert.strictEqual(departmentUpdated.isDefault, options.isDefault);
            assert.strictEqual(departmentUpdated.isDefault, options.isDefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a department', async () => {
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);

            const departmentDeleted = await thisService.Model.findByIdAndDelete(
                departmentCreated._id
            );
            assert.strictEqual(
                departmentDeleted._id.toString(),
                departmentCreated._id.toString()
            );
        });
    });
});
