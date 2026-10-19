const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('sections service', async () => {
    let thisService;
    let sectionCreated;
    let usersServiceResults;
    let users;

    const companiesCreated = await app.service('companies').Model.create({
        departmentId: 'parentObjectId',
        company: 'parentObjectId',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.428Z',
        isdefault: true
    });
    const departmentsCreated = await app.service('departments').Model.create({
        departmentId: 'parentObjectId',
        company: `${companiesCreated._id}`,
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.428Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true
    });

    beforeEach(async () => {
        thisService = await app.service('sections');

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
        assert.ok(thisService, 'Registered the service (sections)');
    });

    describe('#create', () => {
        const options = {
            departmentId: `${departmentsCreated._id}`,
            company: `${companiesCreated._id}`,
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:23.428Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            isDefault: true
        };

        beforeEach(async () => {
            sectionCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new section', () => {
            assert.strictEqual(
                sectionCreated.departmentId.toString(),
                options.departmentId.toString()
            );
            assert.strictEqual(sectionCreated.name, options.name);
            assert.strictEqual(sectionCreated.code, options.code);
            assert.strictEqual(sectionCreated.isDefault, options.isDefault);
            assert.strictEqual(sectionCreated.isDefault, options.isDefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a section by ID', async () => {
            const retrieved = await thisService.Model.findById(
                sectionCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                sectionCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            departmentId: `${departmentsCreated._id}`,
            name: 'updated value',
            code: 'updated value',
            isDefault: false
        };

        it('should update an existing section ', async () => {
            const sectionUpdated = await thisService.Model.findByIdAndUpdate(
                sectionCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                sectionUpdated.departmentId.toString(),
                options.departmentId.toString()
            );
            assert.strictEqual(sectionUpdated.name, options.name);
            assert.strictEqual(sectionUpdated.code, options.code);
            assert.strictEqual(sectionUpdated.isDefault, options.isDefault);
            assert.strictEqual(sectionUpdated.isDefault, options.isDefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a section', async () => {
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);
            await app
                .service('departments')
                .Model.findByIdAndDelete(departmentsCreated._id);

            const sectionDeleted = await thisService.Model.findByIdAndDelete(
                sectionCreated._id
            );
            assert.strictEqual(
                sectionDeleted._id.toString(),
                sectionCreated._id.toString()
            );
        });
    });
});
