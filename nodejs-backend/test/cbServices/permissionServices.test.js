const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('permissionServices service', async () => {
    let thisService;
    let permissionServiceCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });
    const rolesCreated = await app.service('roles').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: `${usersCreated._id}`,
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: 'parentObjectId',
        description: 'new value',
        isDefault: true
    });
    const companiesCreated = await app.service('companies').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: 'parentObjectId',
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true
    });
    const departmentsCreated = await app.service('departments').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: 'parentObjectId',
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value'
    });
    const sectionsCreated = await app.service('sections').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: `${rolesCreated._id}`,
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: 'parentObjectId',
        departmentId: 'parentObjectId'
    });
    const positionsCreated = await app.service('positions').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: 'parentObjectId',
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: `${companiesCreated._id}`,
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: 'parentObjectId',
        abbr: 'new value'
    });
    const branchesCreated = await app.service('branches').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: 'parentObjectId',
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: `${positionsCreated._id}`,
        abbr: 'new value',
        manager: 'parentObjectId',
        branch: 'parentObjectId',
        companyId: 'parentObjectId'
    });
    const userAddressesCreated = await app
        .service('userAddresses')
        .Model.create({
            service: 'new value',
            create: true,
            read: true,
            update: true,
            delete: true,
            import: true,
            export: true,
            seeder: true,
            userId: 'parentObjectId',
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            roleId: 'parentObjectId',
            description: 'new value',
            isDefault: true,
            profile: 'parentObjectId',
            image: 'new value',
            bio: 'new value',
            department: `${departmentsCreated._id}`,
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:29.145Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            hod: true,
            section: `${sectionsCreated._id}`,
            departmentId: 'parentObjectId',
            hos: true,
            role: 'parentObjectId',
            position: `${positionsCreated._id}`,
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
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: 'parentObjectId',
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: `${positionsCreated._id}`,
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
    const profilesCreated = await app.service('profiles').Model.create({
        service: 'new value',
        create: true,
        read: true,
        update: true,
        delete: true,
        import: true,
        export: true,
        seeder: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true,
        roleId: 'parentObjectId',
        description: 'new value',
        isDefault: true,
        profile: 'parentObjectId',
        image: 'new value',
        bio: 'new value',
        department: `${departmentsCreated._id}`,
        company: 'parentObjectId',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:29.145Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: `${sectionsCreated._id}`,
        departmentId: 'parentObjectId',
        hos: true,
        role: 'parentObjectId',
        position: `${positionsCreated._id}`,
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
    });

    beforeEach(async () => {
        thisService = await app.service('permissionServices');

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
        assert.ok(thisService, 'Registered the service (permissionServices)');
    });

    describe('#create', () => {
        const options = {
            service: 'new value',
            create: true,
            read: true,
            update: true,
            delete: true,
            import: true,
            export: true,
            seeder: true,
            userId: 'parentObjectId',
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            roleId: 'parentObjectId',
            description: 'new value',
            isDefault: true,
            profile: `${profilesCreated._id}`,
            image: 'new value',
            bio: 'new value',
            department: `${departmentsCreated._id}`,
            company: 'parentObjectId',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:29.145Z',
            isdefault: true,
            deptName: 'new value',
            code: 'new value',
            hod: true,
            section: `${sectionsCreated._id}`,
            departmentId: 'parentObjectId',
            hos: true,
            role: 'parentObjectId',
            position: `${positionsCreated._id}`,
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
            type: ['new value'],
            positionId: 'parentObjectId'
        };

        beforeEach(async () => {
            permissionServiceCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new permissionService', () => {
            assert.strictEqual(
                permissionServiceCreated.service,
                options.service
            );
            assert.strictEqual(permissionServiceCreated.create, options.create);
            assert.strictEqual(permissionServiceCreated.create, options.create);
            assert.strictEqual(permissionServiceCreated.read, options.read);
            assert.strictEqual(permissionServiceCreated.read, options.read);
            assert.strictEqual(permissionServiceCreated.update, options.update);
            assert.strictEqual(permissionServiceCreated.update, options.update);
            assert.strictEqual(permissionServiceCreated.delete, options.delete);
            assert.strictEqual(permissionServiceCreated.delete, options.delete);
            assert.strictEqual(permissionServiceCreated.import, options.import);
            assert.strictEqual(permissionServiceCreated.import, options.import);
            assert.strictEqual(permissionServiceCreated.export, options.export);
            assert.strictEqual(permissionServiceCreated.export, options.export);
            assert.strictEqual(permissionServiceCreated.seeder, options.seeder);
            assert.strictEqual(permissionServiceCreated.seeder, options.seeder);
            assert.strictEqual(
                permissionServiceCreated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(
                permissionServiceCreated.roleId.toString(),
                options.roleId.toString()
            );
            assert.strictEqual(
                permissionServiceCreated.profile.toString(),
                options.profile.toString()
            );
            assert.strictEqual(
                permissionServiceCreated.positionId.toString(),
                options.positionId.toString()
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a permissionService by ID', async () => {
            const retrieved = await thisService.Model.findById(
                permissionServiceCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                permissionServiceCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            service: 'updated value',
            create: false,
            read: false,
            update: false,
            delete: false,
            import: false,
            export: false,
            seeder: false,
            userId: `${usersCreated._id}`,
            roleId: `${rolesCreated._id}`,
            profile: `${profilesCreated._id}`,
            positionId: `${positionsCreated._id}`
        };

        it('should update an existing permissionService ', async () => {
            const permissionServiceUpdated =
                await thisService.Model.findByIdAndUpdate(
                    permissionServiceCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                permissionServiceUpdated.service,
                options.service
            );
            assert.strictEqual(permissionServiceUpdated.create, options.create);
            assert.strictEqual(permissionServiceUpdated.create, options.create);
            assert.strictEqual(permissionServiceUpdated.read, options.read);
            assert.strictEqual(permissionServiceUpdated.read, options.read);
            assert.strictEqual(permissionServiceUpdated.update, options.update);
            assert.strictEqual(permissionServiceUpdated.update, options.update);
            assert.strictEqual(permissionServiceUpdated.delete, options.delete);
            assert.strictEqual(permissionServiceUpdated.delete, options.delete);
            assert.strictEqual(permissionServiceUpdated.import, options.import);
            assert.strictEqual(permissionServiceUpdated.import, options.import);
            assert.strictEqual(permissionServiceUpdated.export, options.export);
            assert.strictEqual(permissionServiceUpdated.export, options.export);
            assert.strictEqual(permissionServiceUpdated.seeder, options.seeder);
            assert.strictEqual(permissionServiceUpdated.seeder, options.seeder);
            assert.strictEqual(
                permissionServiceUpdated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(
                permissionServiceUpdated.roleId.toString(),
                options.roleId.toString()
            );
            assert.strictEqual(
                permissionServiceUpdated.profile.toString(),
                options.profile.toString()
            );
            assert.strictEqual(
                permissionServiceUpdated.positionId.toString(),
                options.positionId.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a permissionService', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);
            await app
                .service('roles')
                .Model.findByIdAndDelete(rolesCreated._id);
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
            await app
                .service('profiles')
                .Model.findByIdAndDelete(profilesCreated._id);

            const permissionServiceDeleted =
                await thisService.Model.findByIdAndDelete(
                    permissionServiceCreated._id
                );
            assert.strictEqual(
                permissionServiceDeleted._id.toString(),
                permissionServiceCreated._id.toString()
            );
        });
    });
});
