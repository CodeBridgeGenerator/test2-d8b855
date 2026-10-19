const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('employees service', async () => {
    let thisService;
    let employeeCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('employees');

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
        assert.ok(thisService, 'Registered the service (employees)');
    });

    describe('#create', () => {
        const options = {
            empNo: 'new value',
            name: 'new value',
            fullName: 'new value',
            company: 'new value',
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
            employeeCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new employee', () => {
            assert.strictEqual(employeeCreated.empNo, options.empNo);
            assert.strictEqual(employeeCreated.name, options.name);
            assert.strictEqual(employeeCreated.fullName, options.fullName);
            assert.strictEqual(employeeCreated.company, options.company);
            assert.strictEqual(employeeCreated.department, options.department);
            assert.strictEqual(employeeCreated.section, options.section);
            assert.strictEqual(employeeCreated.position, options.position);
            assert.strictEqual(employeeCreated.supervisor, options.supervisor);
            assert.strictEqual(employeeCreated.dateJoined, options.dateJoined);
            assert.strictEqual(
                employeeCreated.dateTerminated,
                options.dateTerminated
            );
            assert.strictEqual(employeeCreated.resigned, options.resigned);
            assert.strictEqual(employeeCreated.empGroup, options.empGroup);
            assert.strictEqual(employeeCreated.empCode, options.empCode);
        });
    });

    describe('#get', () => {
        it('should retrieve a employee by ID', async () => {
            const retrieved = await thisService.Model.findById(
                employeeCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                employeeCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            empNo: 'updated value',
            name: 'updated value',
            fullName: 'updated value',
            company: 'updated value',
            department: 'updated value',
            section: 'updated value',
            position: 'updated value',
            supervisor: 'updated value',
            dateJoined: 'updated value',
            dateTerminated: 'updated value',
            resigned: 'updated value',
            empGroup: 'updated value',
            empCode: 'updated value'
        };

        it('should update an existing employee ', async () => {
            const employeeUpdated = await thisService.Model.findByIdAndUpdate(
                employeeCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(employeeUpdated.empNo, options.empNo);
            assert.strictEqual(employeeUpdated.name, options.name);
            assert.strictEqual(employeeUpdated.fullName, options.fullName);
            assert.strictEqual(employeeUpdated.company, options.company);
            assert.strictEqual(employeeUpdated.department, options.department);
            assert.strictEqual(employeeUpdated.section, options.section);
            assert.strictEqual(employeeUpdated.position, options.position);
            assert.strictEqual(employeeUpdated.supervisor, options.supervisor);
            assert.strictEqual(employeeUpdated.dateJoined, options.dateJoined);
            assert.strictEqual(
                employeeUpdated.dateTerminated,
                options.dateTerminated
            );
            assert.strictEqual(employeeUpdated.resigned, options.resigned);
            assert.strictEqual(employeeUpdated.empGroup, options.empGroup);
            assert.strictEqual(employeeUpdated.empCode, options.empCode);
        });
    });

    describe('#delete', async () => {
        it('should delete a employee', async () => {
            const employeeDeleted = await thisService.Model.findByIdAndDelete(
                employeeCreated._id
            );
            assert.strictEqual(
                employeeDeleted._id.toString(),
                employeeCreated._id.toString()
            );
        });
    });
});
