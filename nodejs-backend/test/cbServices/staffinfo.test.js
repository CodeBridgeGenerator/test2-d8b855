const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('staffinfo service', async () => {
    let thisService;
    let staffinfoCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('staffinfo');

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
        assert.ok(thisService, 'Registered the service (staffinfo)');
    });

    describe('#create', () => {
        const options = {
            empNo: 23,
            name: 'new value',
            nameNric: 'new value',
            compCode: 23,
            compName: 'new value',
            deptCode: 'new value',
            deptDesc: 'new value',
            sectCode: 23,
            sectDesc: 'new value',
            designation: 'new value',
            email: 'new value',
            resign: 'new value',
            supervisor: 'new value',
            dateJoin: 23,
            empGroup: 'new value',
            empGradeCode: 'new value',
            terminationDate: 'new value'
        };

        beforeEach(async () => {
            staffinfoCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new staffinfo', () => {
            assert.strictEqual(staffinfoCreated.empNo, options.empNo);
            assert.strictEqual(staffinfoCreated.name, options.name);
            assert.strictEqual(staffinfoCreated.nameNric, options.nameNric);
            assert.strictEqual(staffinfoCreated.compCode, options.compCode);
            assert.strictEqual(staffinfoCreated.compName, options.compName);
            assert.strictEqual(staffinfoCreated.deptCode, options.deptCode);
            assert.strictEqual(staffinfoCreated.deptDesc, options.deptDesc);
            assert.strictEqual(staffinfoCreated.sectCode, options.sectCode);
            assert.strictEqual(staffinfoCreated.sectDesc, options.sectDesc);
            assert.strictEqual(
                staffinfoCreated.designation,
                options.designation
            );
            assert.strictEqual(staffinfoCreated.email, options.email);
            assert.strictEqual(staffinfoCreated.resign, options.resign);
            assert.strictEqual(staffinfoCreated.supervisor, options.supervisor);
            assert.strictEqual(staffinfoCreated.dateJoin, options.dateJoin);
            assert.strictEqual(staffinfoCreated.empGroup, options.empGroup);
            assert.strictEqual(
                staffinfoCreated.empGradeCode,
                options.empGradeCode
            );
            assert.strictEqual(
                staffinfoCreated.terminationDate,
                options.terminationDate
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a staffinfo by ID', async () => {
            const retrieved = await thisService.Model.findById(
                staffinfoCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                staffinfoCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            empNo: 100,
            name: 'updated value',
            nameNric: 'updated value',
            compCode: 100,
            compName: 'updated value',
            deptCode: 'updated value',
            deptDesc: 'updated value',
            sectCode: 100,
            sectDesc: 'updated value',
            designation: 'updated value',
            email: 'updated value',
            resign: 'updated value',
            supervisor: 'updated value',
            dateJoin: 100,
            empGroup: 'updated value',
            empGradeCode: 'updated value',
            terminationDate: 'updated value'
        };

        it('should update an existing staffinfo ', async () => {
            const staffinfoUpdated = await thisService.Model.findByIdAndUpdate(
                staffinfoCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(staffinfoUpdated.empNo, options.empNo);
            assert.strictEqual(staffinfoUpdated.name, options.name);
            assert.strictEqual(staffinfoUpdated.nameNric, options.nameNric);
            assert.strictEqual(staffinfoUpdated.compCode, options.compCode);
            assert.strictEqual(staffinfoUpdated.compName, options.compName);
            assert.strictEqual(staffinfoUpdated.deptCode, options.deptCode);
            assert.strictEqual(staffinfoUpdated.deptDesc, options.deptDesc);
            assert.strictEqual(staffinfoUpdated.sectCode, options.sectCode);
            assert.strictEqual(staffinfoUpdated.sectDesc, options.sectDesc);
            assert.strictEqual(
                staffinfoUpdated.designation,
                options.designation
            );
            assert.strictEqual(staffinfoUpdated.email, options.email);
            assert.strictEqual(staffinfoUpdated.resign, options.resign);
            assert.strictEqual(staffinfoUpdated.supervisor, options.supervisor);
            assert.strictEqual(staffinfoUpdated.dateJoin, options.dateJoin);
            assert.strictEqual(staffinfoUpdated.empGroup, options.empGroup);
            assert.strictEqual(
                staffinfoUpdated.empGradeCode,
                options.empGradeCode
            );
            assert.strictEqual(
                staffinfoUpdated.terminationDate,
                options.terminationDate
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a staffinfo', async () => {
            const staffinfoDeleted = await thisService.Model.findByIdAndDelete(
                staffinfoCreated._id
            );
            assert.strictEqual(
                staffinfoDeleted._id.toString(),
                staffinfoCreated._id.toString()
            );
        });
    });
});
