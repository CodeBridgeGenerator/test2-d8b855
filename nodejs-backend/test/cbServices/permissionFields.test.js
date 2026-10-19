const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('permissionFields service', async () => {
    let thisService;
    let permissionFieldCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        servicePermissionId: 'parentObjectId',
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
        servicePermissionId: 'parentObjectId',
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
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
        isdefault: true
    });
    const departmentsCreated = await app.service('departments').Model.create({
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value'
    });
    const sectionsCreated = await app.service('sections').Model.create({
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
        isdefault: true,
        deptName: 'new value',
        code: 'new value',
        hod: true,
        section: 'parentObjectId',
        departmentId: 'parentObjectId'
    });
    const positionsCreated = await app.service('positions').Model.create({
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
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
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
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
            servicePermissionId: 'parentObjectId',
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
            DateIncorporated: '2026-02-25T01:01:29.307Z',
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
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
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
        servicePermissionId: 'parentObjectId',
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
        DateIncorporated: '2026-02-25T01:01:29.307Z',
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
    const permissionServicesCreated = await app
        .service('permissionServices')
        .Model.create({
            servicePermissionId: 'parentObjectId',
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
            DateIncorporated: '2026-02-25T01:01:29.307Z',
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
        });

    beforeEach(async () => {
        thisService = await app.service('permissionFields');

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
        assert.ok(thisService, 'Registered the service (permissionFields)');
    });

    describe('#create', () => {
        const options = {
            servicePermissionId: `${permissionServicesCreated._id}`,
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
            DateIncorporated: '2026-02-25T01:01:29.307Z',
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
            positionId: 'parentObjectId',
            fieldName: 'new value',
            onCreate: true,
            onUpdate: true,
            onDetail: true,
            onTable: true
        };

        beforeEach(async () => {
            permissionFieldCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new permissionField', () => {
            assert.strictEqual(
                permissionFieldCreated.servicePermissionId.toString(),
                options.servicePermissionId.toString()
            );
            assert.strictEqual(
                permissionFieldCreated.fieldName,
                options.fieldName
            );
            assert.strictEqual(
                permissionFieldCreated.onCreate,
                options.onCreate
            );
            assert.strictEqual(
                permissionFieldCreated.onCreate,
                options.onCreate
            );
            assert.strictEqual(
                permissionFieldCreated.onUpdate,
                options.onUpdate
            );
            assert.strictEqual(
                permissionFieldCreated.onUpdate,
                options.onUpdate
            );
            assert.strictEqual(
                permissionFieldCreated.onDetail,
                options.onDetail
            );
            assert.strictEqual(
                permissionFieldCreated.onDetail,
                options.onDetail
            );
            assert.strictEqual(permissionFieldCreated.onTable, options.onTable);
            assert.strictEqual(permissionFieldCreated.onTable, options.onTable);
        });
    });

    describe('#get', () => {
        it('should retrieve a permissionField by ID', async () => {
            const retrieved = await thisService.Model.findById(
                permissionFieldCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                permissionFieldCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            servicePermissionId: `${permissionServicesCreated._id}`,
            fieldName: 'updated value',
            onCreate: false,
            onUpdate: false,
            onDetail: false,
            onTable: false
        };

        it('should update an existing permissionField ', async () => {
            const permissionFieldUpdated =
                await thisService.Model.findByIdAndUpdate(
                    permissionFieldCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                permissionFieldUpdated.servicePermissionId.toString(),
                options.servicePermissionId.toString()
            );
            assert.strictEqual(
                permissionFieldUpdated.fieldName,
                options.fieldName
            );
            assert.strictEqual(
                permissionFieldUpdated.onCreate,
                options.onCreate
            );
            assert.strictEqual(
                permissionFieldUpdated.onCreate,
                options.onCreate
            );
            assert.strictEqual(
                permissionFieldUpdated.onUpdate,
                options.onUpdate
            );
            assert.strictEqual(
                permissionFieldUpdated.onUpdate,
                options.onUpdate
            );
            assert.strictEqual(
                permissionFieldUpdated.onDetail,
                options.onDetail
            );
            assert.strictEqual(
                permissionFieldUpdated.onDetail,
                options.onDetail
            );
            assert.strictEqual(permissionFieldUpdated.onTable, options.onTable);
            assert.strictEqual(permissionFieldUpdated.onTable, options.onTable);
        });
    });

    describe('#delete', async () => {
        it('should delete a permissionField', async () => {
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
            await app
                .service('permissionServices')
                .Model.findByIdAndDelete(permissionServicesCreated._id);

            const permissionFieldDeleted =
                await thisService.Model.findByIdAndDelete(
                    permissionFieldCreated._id
                );
            assert.strictEqual(
                permissionFieldDeleted._id.toString(),
                permissionFieldCreated._id.toString()
            );
        });
    });
});
