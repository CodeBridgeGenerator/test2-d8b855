const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('profiles service', async () => {
    let thisService;
    let profileCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        name: 'new value',
        userId: 'parentObjectId',
        email: 'new value',
        password: 'new value',
        status: true
    });
    const companiesCreated = await app.service('companies').Model.create({
        name: 'new value',
        userId: `${usersCreated._id}`,
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: 'parentObjectId',
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true
    });
    const departmentsCreated = await app.service('departments').Model.create({
        name: 'new value',
        userId: `${usersCreated._id}`,
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: 'parentObjectId',
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true
    });
    const sectionsCreated = await app.service('sections').Model.create({
        name: 'new value',
        userId: `${usersCreated._id}`,
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true,
        hod: true,
        section: 'parentObjectId',
        departmentId: 'parentObjectId'
    });
    const rolesCreated = await app.service('roles').Model.create({
        name: 'new value',
        userId: `${usersCreated._id}`,
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true,
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        description: 'new value'
    });
    const positionsCreated = await app.service('positions').Model.create({
        name: 'new value',
        userId: `${usersCreated._id}`,
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true,
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: `${rolesCreated._id}`,
        description: 'new value',
        position: 'parentObjectId',
        roleId: 'parentObjectId',
        abbr: 'new value'
    });
    const branchesCreated = await app.service('branches').Model.create({
        name: 'new value',
        userId: `${usersCreated._id}`,
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true,
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: `${rolesCreated._id}`,
        description: 'new value',
        position: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
        manager: 'parentObjectId',
        branch: 'parentObjectId',
        companyId: 'parentObjectId'
    });
    const userAddressesCreated = await app
        .service('userAddresses')
        .Model.create({
            name: 'new value',
            userId: 'parentObjectId',
            email: 'new value',
            password: 'new value',
            status: true,
            image: 'new value',
            bio: 'new value',
            department: `${departmentsCreated._id}`,
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:23.753Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            isDefault: true,
            hod: true,
            section: `${sectionsCreated._id}`,
            departmentId: 'parentObjectId',
            hos: true,
            role: `${rolesCreated._id}`,
            description: 'new value',
            position: `${positionsCreated._id}`,
            roleId: 'parentObjectId',
            abbr: 'new value',
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
        name: 'new value',
        userId: 'parentObjectId',
        email: 'new value',
        password: 'new value',
        status: true,
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:23.753Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        isDefault: true,
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: `${rolesCreated._id}`,
        description: 'new value',
        position: `${positionsCreated._id}`,
        roleId: 'parentObjectId',
        abbr: 'new value',
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

    beforeEach(async () => {
        thisService = await app.service('profiles');

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
        assert.ok(thisService, 'Registered the service (profiles)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            userId: 'parentObjectId',
            email: 'new value',
            password: 'new value',
            status: true,
            image: 'new value',
            bio: 'new value',
            department: `${departmentsCreated._id}`,
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:23.753Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            isDefault: true,
            hod: true,
            section: `${sectionsCreated._id}`,
            departmentId: 'parentObjectId',
            hos: true,
            role: `${rolesCreated._id}`,
            description: 'new value',
            position: `${positionsCreated._id}`,
            roleId: 'parentObjectId',
            abbr: 'new value',
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
        };

        beforeEach(async () => {
            profileCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new profile', () => {
            assert.strictEqual(profileCreated.name, options.name);
            assert.strictEqual(
                profileCreated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(profileCreated.image, options.image);
            assert.strictEqual(profileCreated.bio, options.bio);
            assert.strictEqual(
                profileCreated.department.toString(),
                options.department.toString()
            );
            assert.strictEqual(profileCreated.hod, options.hod);
            assert.strictEqual(profileCreated.hod, options.hod);
            assert.strictEqual(
                profileCreated.section.toString(),
                options.section.toString()
            );
            assert.strictEqual(profileCreated.hos, options.hos);
            assert.strictEqual(profileCreated.hos, options.hos);
            assert.strictEqual(
                profileCreated.role.toString(),
                options.role.toString()
            );
            assert.strictEqual(
                profileCreated.position.toString(),
                options.position.toString()
            );
            assert.strictEqual(
                profileCreated.manager.toString(),
                options.manager.toString()
            );
            assert.strictEqual(
                profileCreated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(
                profileCreated.branch.toString(),
                options.branch.toString()
            );
            assert.strictEqual(profileCreated.skills, options.skills);
            assert.strictEqual(
                profileCreated.address.toString(),
                options.address.toString()
            );
            assert.strictEqual(
                profileCreated.phone.toString(),
                options.phone.toString()
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a profile by ID', async () => {
            const retrieved = await thisService.Model.findById(
                profileCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                profileCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            userId: `${usersCreated._id}`,
            image: 'updated value',
            bio: 'updated value',
            department: `${departmentsCreated._id}`,
            hod: false,
            section: `${sectionsCreated._id}`,
            hos: false,
            role: `${rolesCreated._id}`,
            position: `${positionsCreated._id}`,
            manager: `${usersCreated._id}`,
            company: `${companiesCreated._id}`,
            branch: `${branchesCreated._id}`,
            skills: 'updated value',
            address: `${userAddressesCreated._id}`,
            phone: `${userPhonesCreated._id}`
        };

        it('should update an existing profile ', async () => {
            const profileUpdated = await thisService.Model.findByIdAndUpdate(
                profileCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(profileUpdated.name, options.name);
            assert.strictEqual(
                profileUpdated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(profileUpdated.image, options.image);
            assert.strictEqual(profileUpdated.bio, options.bio);
            assert.strictEqual(
                profileUpdated.department.toString(),
                options.department.toString()
            );
            assert.strictEqual(profileUpdated.hod, options.hod);
            assert.strictEqual(profileUpdated.hod, options.hod);
            assert.strictEqual(
                profileUpdated.section.toString(),
                options.section.toString()
            );
            assert.strictEqual(profileUpdated.hos, options.hos);
            assert.strictEqual(profileUpdated.hos, options.hos);
            assert.strictEqual(
                profileUpdated.role.toString(),
                options.role.toString()
            );
            assert.strictEqual(
                profileUpdated.position.toString(),
                options.position.toString()
            );
            assert.strictEqual(
                profileUpdated.manager.toString(),
                options.manager.toString()
            );
            assert.strictEqual(
                profileUpdated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(
                profileUpdated.branch.toString(),
                options.branch.toString()
            );
            assert.strictEqual(profileUpdated.skills, options.skills);
            assert.strictEqual(
                profileUpdated.address.toString(),
                options.address.toString()
            );
            assert.strictEqual(
                profileUpdated.phone.toString(),
                options.phone.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a profile', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);
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
                .service('roles')
                .Model.findByIdAndDelete(rolesCreated._id);
            await app
                .service('positions')
                .Model.findByIdAndDelete(positionsCreated._id);
            await app
                .service('branches')
                .Model.findByIdAndDelete(branchesCreated._id);
            await app
                .service('userAddresses')
                .Model.findByIdAndDelete(userAddressesCreated._id);
            await app
                .service('userPhones')
                .Model.findByIdAndDelete(userPhonesCreated._id);

            const profileDeleted = await thisService.Model.findByIdAndDelete(
                profileCreated._id
            );
            assert.strictEqual(
                profileDeleted._id.toString(),
                profileCreated._id.toString()
            );
        });
    });
});
