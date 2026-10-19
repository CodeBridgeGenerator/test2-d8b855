const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userInvites service', async () => {
    let thisService;
    let userInviteCreated;
    let usersServiceResults;
    let users;

    const rolesCreated = await app.service('roles').Model.create({
        emailToInvite: 'new value',
        status: true,
        position: 'parentObjectId',
        roleId: 'parentObjectId',
        name: 'new value',
        description: 'new value',
        isDefault: true
    });
    const positionsCreated = await app.service('positions').Model.create({
        emailToInvite: 'new value',
        status: true,
        position: 'parentObjectId',
        roleId: `${rolesCreated._id}`,
        name: 'new value',
        description: 'new value',
        isDefault: true,
        abbr: 'new value'
    });
    const companiesCreated = await app.service('companies').Model.create({
        emailToInvite: 'new value',
        status: true,
        position: `${positionsCreated._id}`,
        roleId: `${rolesCreated._id}`,
        name: 'new value',
        description: 'new value',
        isDefault: true,
        abbr: 'new value',
        role: 'parentObjectId',
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.640Z',
        isdefault: true
    });
    const branchesCreated = await app.service('branches').Model.create({
        emailToInvite: 'new value',
        status: true,
        position: `${positionsCreated._id}`,
        roleId: `${rolesCreated._id}`,
        name: 'new value',
        description: 'new value',
        isDefault: true,
        abbr: 'new value',
        role: 'parentObjectId',
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.640Z',
        isdefault: true,
        branch: 'parentObjectId',
        companyId: 'parentObjectId'
    });
    const departmentsCreated = await app.service('departments').Model.create({
        emailToInvite: 'new value',
        status: true,
        position: `${positionsCreated._id}`,
        roleId: `${rolesCreated._id}`,
        name: 'new value',
        description: 'new value',
        isDefault: true,
        abbr: 'new value',
        role: 'parentObjectId',
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.640Z',
        isdefault: true,
        branch: `${branchesCreated._id}`,
        companyId: 'parentObjectId',
        department: 'parentObjectId',
        deptName: 'new value',
        code: 'new value'
    });
    const sectionsCreated = await app.service('sections').Model.create({
        emailToInvite: 'new value',
        status: true,
        position: `${positionsCreated._id}`,
        roleId: `${rolesCreated._id}`,
        name: 'new value',
        description: 'new value',
        isDefault: true,
        abbr: 'new value',
        role: 'parentObjectId',
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.640Z',
        isdefault: true,
        branch: `${branchesCreated._id}`,
        companyId: 'parentObjectId',
        department: `${departmentsCreated._id}`,
        deptName: 'new value',
        code: 'new value',
        section: 'parentObjectId',
        departmentId: 'parentObjectId'
    });

    beforeEach(async () => {
        thisService = await app.service('userInvites');

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
        assert.ok(thisService, 'Registered the service (userInvites)');
    });

    describe('#create', () => {
        const options = {
            emailToInvite: 'new value',
            status: true,
            position: `${positionsCreated._id}`,
            roleId: `${rolesCreated._id}`,
            name: 'new value',
            description: 'new value',
            isDefault: true,
            abbr: 'new value',
            role: 'parentObjectId',
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:28.640Z',
            isdefault: true,
            branch: `${branchesCreated._id}`,
            companyId: 'parentObjectId',
            department: `${departmentsCreated._id}`,
            deptName: 'new value',
            code: 23,
            section: `${sectionsCreated._id}`,
            departmentId: 'parentObjectId',
            sendMailCounter: 23
        };

        beforeEach(async () => {
            userInviteCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userInvite', () => {
            assert.strictEqual(
                userInviteCreated.emailToInvite,
                options.emailToInvite
            );
            assert.strictEqual(userInviteCreated.status, options.status);
            assert.strictEqual(userInviteCreated.status, options.status);
            assert.strictEqual(
                userInviteCreated.position.toString(),
                options.position.toString()
            );
            assert.strictEqual(
                userInviteCreated.role.toString(),
                options.role.toString()
            );
            assert.strictEqual(
                userInviteCreated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(
                userInviteCreated.branch.toString(),
                options.branch.toString()
            );
            assert.strictEqual(
                userInviteCreated.department.toString(),
                options.department.toString()
            );
            assert.strictEqual(
                userInviteCreated.section.toString(),
                options.section.toString()
            );
            assert.strictEqual(userInviteCreated.code, options.code);
            assert.strictEqual(
                userInviteCreated.sendMailCounter,
                options.sendMailCounter
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a userInvite by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userInviteCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userInviteCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            emailToInvite: 'updated value',
            status: false,
            position: `${positionsCreated._id}`,
            role: `${rolesCreated._id}`,
            company: `${companiesCreated._id}`,
            branch: `${branchesCreated._id}`,
            department: `${departmentsCreated._id}`,
            section: `${sectionsCreated._id}`,
            code: 100,
            sendMailCounter: 100
        };

        it('should update an existing userInvite ', async () => {
            const userInviteUpdated = await thisService.Model.findByIdAndUpdate(
                userInviteCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                userInviteUpdated.emailToInvite,
                options.emailToInvite
            );
            assert.strictEqual(userInviteUpdated.status, options.status);
            assert.strictEqual(userInviteUpdated.status, options.status);
            assert.strictEqual(
                userInviteUpdated.position.toString(),
                options.position.toString()
            );
            assert.strictEqual(
                userInviteUpdated.role.toString(),
                options.role.toString()
            );
            assert.strictEqual(
                userInviteUpdated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(
                userInviteUpdated.branch.toString(),
                options.branch.toString()
            );
            assert.strictEqual(
                userInviteUpdated.department.toString(),
                options.department.toString()
            );
            assert.strictEqual(
                userInviteUpdated.section.toString(),
                options.section.toString()
            );
            assert.strictEqual(userInviteUpdated.code, options.code);
            assert.strictEqual(
                userInviteUpdated.sendMailCounter,
                options.sendMailCounter
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a userInvite', async () => {
            await app
                .service('roles')
                .Model.findByIdAndDelete(rolesCreated._id);
            await app
                .service('positions')
                .Model.findByIdAndDelete(positionsCreated._id);
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);
            await app
                .service('branches')
                .Model.findByIdAndDelete(branchesCreated._id);
            await app
                .service('departments')
                .Model.findByIdAndDelete(departmentsCreated._id);
            await app
                .service('sections')
                .Model.findByIdAndDelete(sectionsCreated._id);

            const userInviteDeleted = await thisService.Model.findByIdAndDelete(
                userInviteCreated._id
            );
            assert.strictEqual(
                userInviteDeleted._id.toString(),
                userInviteCreated._id.toString()
            );
        });
    });
});
