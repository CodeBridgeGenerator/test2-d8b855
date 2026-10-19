const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('profileMenu service', async () => {
    let thisService;
    let profileMenuCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        user: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });
    const rolesCreated = await app.service('roles').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: 'parentObjectId',
        description: 'new value',
        isDefault: true
    });
    const positionsCreated = await app.service('positions').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: 'parentObjectId',
        roleId: 'parentObjectId',
        abbr: 'new value'
    });
    const companiesCreated = await app.service('companies').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        profiles: 'parentObjectId',
        userId: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: 'parentObjectId',
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.044Z',
        isdefault: true
    });
    const departmentsCreated = await app.service('departments').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        profiles: 'parentObjectId',
        userId: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: 'parentObjectId',
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.044Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value'
    });
    const sectionsCreated = await app.service('sections').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        profiles: 'parentObjectId',
        userId: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.044Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: 'parentObjectId',
        departmentId: 'parentObjectId'
    });
    const branchesCreated = await app.service('branches').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        profiles: 'parentObjectId',
        userId: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.044Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: 'parentObjectId',
        manager: 'parentObjectId',
        branch: 'parentObjectId',
        companyId: 'parentObjectId'
    });
    const userAddressesCreated = await app
        .service('userAddresses')
        .Model.create({
            user: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            roles: `${rolesCreated._id}`,
            description: 'new value',
            isDefault: true,
            positions: `${positionsCreated._id}`,
            roleId: 'parentObjectId',
            abbr: 'new value',
            profiles: 'parentObjectId',
            userId: 'parentObjectId',
            image: 'new value',
            bio: 'new value',
            department: `${departmentsCreated._id}`,
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:28.044Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            hod: true,
            section: `${sectionsCreated._id}`,
            departmentId: 'parentObjectId',
            hos: true,
            role: 'parentObjectId',
            position: 'parentObjectId',
            manager: 'parentObjectId',
            branch: `${branchesCreated._id}`,
            companyId: 'parentObjectId',
            skills: 'new value',
            address: 'parentObjectId',
            street1: 'new value',
            street2: 'new value',
            postalCode: 'new value',
            city: 'new value',
            state: 'new value',
            province: 'new value',
            country: 'new value'
        });
    const userPhonesCreated = await app.service('userPhones').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        profiles: 'parentObjectId',
        userId: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.044Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: 'parentObjectId',
        manager: 'parentObjectId',
        branch: `${branchesCreated._id}`,
        companyId: 'parentObjectId',
        skills: 'new value',
        address: `${userAddressesCreated._id}`,
        street1: 'new value',
        street2: 'new value',
        postalCode: 'new value',
        city: 'new value',
        state: 'new value',
        province: 'new value',
        country: 'new value',
        phone: 'parentObjectId',
        countryCode: 23,
        operatorCode: 23,
        number: 23,
        type: ['new value']
    });
    const profilesCreated = await app.service('profiles').Model.create({
        user: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roles: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        positions: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        profiles: 'parentObjectId',
        userId: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:28.044Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: 'parentObjectId',
        manager: 'parentObjectId',
        branch: `${branchesCreated._id}`,
        companyId: 'parentObjectId',
        skills: 'new value',
        address: `${userAddressesCreated._id}`,
        street1: 'new value',
        street2: 'new value',
        postalCode: 'new value',
        city: 'new value',
        state: 'new value',
        province: 'new value',
        country: 'new value',
        phone: `${userPhonesCreated._id}`,
        countryCode: 23,
        operatorCode: 23,
        number: 23,
        type: ['new value']
    });

    beforeEach(async () => {
        thisService = await app.service('profileMenu');

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
        assert.ok(thisService, 'Registered the service (profileMenu)');
    });

    describe('#create', () => {
        const options = {
            user: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            roles: `${rolesCreated._id}`,
            description: 'new value',
            isDefault: true,
            positions: `${positionsCreated._id}`,
            roleId: 'parentObjectId',
            abbr: 'new value',
            profiles: `${profilesCreated._id}`,
            userId: 'parentObjectId',
            image: 'new value',
            bio: 'new value',
            department: `${departmentsCreated._id}`,
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:28.044Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            hod: true,
            section: 'parentObjectId',
            departmentId: 'parentObjectId',
            hos: true,
            role: 'parentObjectId',
            position: 'parentObjectId',
            manager: 'parentObjectId',
            branch: 'parentObjectId',
            companyId: 'parentObjectId',
            skills: 'new value',
            address: `${userAddressesCreated._id}`,
            street1: 'new value',
            street2: 'new value',
            postalCode: 'new value',
            city: 'new value',
            state: 'new value',
            province: 'new value',
            country: 'new value',
            phone: `${userPhonesCreated._id}`,
            countryCode: 23,
            operatorCode: 23,
            number: 23,
            type: ['new value'],
            menuItems: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            }
        };

        beforeEach(async () => {
            profileMenuCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new profileMenu', () => {
            assert.strictEqual(
                profileMenuCreated.user.toString(),
                options.user.toString()
            );
            assert.strictEqual(
                profileMenuCreated.roles.toString(),
                options.roles.toString()
            );
            assert.strictEqual(
                profileMenuCreated.positions.toString(),
                options.positions.toString()
            );
            assert.strictEqual(
                profileMenuCreated.profiles.toString(),
                options.profiles.toString()
            );
            assert.strictEqual(profileMenuCreated.menuItems, options.menuItems);
            assert.strictEqual(
                profileMenuCreated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(
                profileMenuCreated.branch.toString(),
                options.branch.toString()
            );
            assert.strictEqual(
                profileMenuCreated.section.toString(),
                options.section.toString()
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a profileMenu by ID', async () => {
            const retrieved = await thisService.Model.findById(
                profileMenuCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                profileMenuCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            user: `${usersCreated._id}`,
            roles: `${rolesCreated._id}`,
            positions: `${positionsCreated._id}`,
            profiles: `${profilesCreated._id}`,
            menuItems: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            },
            company: `${companiesCreated._id}`,
            branch: `${branchesCreated._id}`,
            section: `${sectionsCreated._id}`
        };

        it('should update an existing profileMenu ', async () => {
            const profileMenuUpdated =
                await thisService.Model.findByIdAndUpdate(
                    profileMenuCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                profileMenuUpdated.user.toString(),
                options.user.toString()
            );
            assert.strictEqual(
                profileMenuUpdated.roles.toString(),
                options.roles.toString()
            );
            assert.strictEqual(
                profileMenuUpdated.positions.toString(),
                options.positions.toString()
            );
            assert.strictEqual(
                profileMenuUpdated.profiles.toString(),
                options.profiles.toString()
            );
            assert.strictEqual(profileMenuUpdated.menuItems, options.menuItems);
            assert.strictEqual(
                profileMenuUpdated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(
                profileMenuUpdated.branch.toString(),
                options.branch.toString()
            );
            assert.strictEqual(
                profileMenuUpdated.section.toString(),
                options.section.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a profileMenu', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);
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
                .service('departments')
                .Model.findByIdAndDelete(departmentsCreated._id);
            await app
                .service('sections')
                .Model.findByIdAndDelete(sectionsCreated._id);
            await app
                .service('branches')
                .Model.findByIdAndDelete(branchesCreated._id);
            await app
                .service('userAddresses')
                .Model.findByIdAndDelete(userAddressesCreated._id);
            await app
                .service('userPhones')
                .Model.findByIdAndDelete(userPhonesCreated._id);
            await app
                .service('profiles')
                .Model.findByIdAndDelete(profilesCreated._id);

            const profileMenuDeleted =
                await thisService.Model.findByIdAndDelete(
                    profileMenuCreated._id
                );
            assert.strictEqual(
                profileMenuDeleted._id.toString(),
                profileMenuCreated._id.toString()
            );
        });
    });
});
