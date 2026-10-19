const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('departmentAdmin service', async () => {
    let thisService;
    let departmentAdminCreated;
    let usersServiceResults;
    let users;

    const companiesCreated = await app.service('companies').Model.create({
        departmentId: 'parentObjectId',
        company: 'parentObjectId',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:25.808Z',
        isdefault: true
    });
    const departmentsCreated = await app.service('departments').Model.create({
        departmentId: 'parentObjectId',
        company: `${companiesCreated._id}`,
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:25.808Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true
    });
    const employeesCreated = await app.service('employees').Model.create({
        departmentId: `${departmentsCreated._id}`,
        company: 'new value',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:25.808Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true,
        employeeId: 'parentObjectId',
        empNo: 'new value',
        fullName: 'new value',
        department: 'new value',
        section: 'new value',
        position: 'new value',
        supervisor: 'new value',
        dateJoined: 'new value',
        dateTerminated: 'new value',
        resigned: 'new value',
        empGroup: 'new value',
        empCode: 'new value'
    });

    beforeEach(async () => {
        thisService = await app.service('departmentAdmin');

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
        assert.ok(thisService, 'Registered the service (departmentAdmin)');
    });

    describe('#create', () => {
        const options = {
            departmentId: `${departmentsCreated._id}`,
            company: 'new value',
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:25.808Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            isDefault: true,
            employeeId: `${employeesCreated._id}`,
            empNo: 'new value',
            fullName: 'new value',
            department: 'new value',
            section: 'new value',
            position: 'new value',
            supervisor: 'new value',
            dateJoined: 'new value',
            dateTerminated: 'new value',
            resigned: 'new value',
            empGroup: 'new value',
            empCode: 'new value'
        };

        beforeEach(async () => {
            departmentAdminCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new departmentAdmin', () => {
            assert.strictEqual(
                departmentAdminCreated.departmentId.toString(),
                options.departmentId.toString()
            );
            assert.strictEqual(
                departmentAdminCreated.employeeId.toString(),
                options.employeeId.toString()
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a departmentAdmin by ID', async () => {
            const retrieved = await thisService.Model.findById(
                departmentAdminCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                departmentAdminCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            departmentId: `${departmentsCreated._id}`,
            employeeId: `${employeesCreated._id}`
        };

        it('should update an existing departmentAdmin ', async () => {
            const departmentAdminUpdated =
                await thisService.Model.findByIdAndUpdate(
                    departmentAdminCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                departmentAdminUpdated.departmentId.toString(),
                options.departmentId.toString()
            );
            assert.strictEqual(
                departmentAdminUpdated.employeeId.toString(),
                options.employeeId.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a departmentAdmin', async () => {
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);
            await app
                .service('departments')
                .Model.findByIdAndDelete(departmentsCreated._id);
            await app
                .service('employees')
                .Model.findByIdAndDelete(employeesCreated._id);

            const departmentAdminDeleted =
                await thisService.Model.findByIdAndDelete(
                    departmentAdminCreated._id
                );
            assert.strictEqual(
                departmentAdminDeleted._id.toString(),
                departmentAdminCreated._id.toString()
            );
        });
    });
});
