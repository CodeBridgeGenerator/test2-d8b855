const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('superiors service', async () => {
    let thisService;
    let superiorCreated;
    let usersServiceResults;
    let users;

    const staffinfoCreated = await app.service('staffinfo').Model.create({
        superior: 'parentObjectId',
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
    });

    beforeEach(async () => {
        thisService = await app.service('superiors');

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
        assert.ok(thisService, 'Registered the service (superiors)');
    });

    describe('#create', () => {
        const options = {
            superior: `${staffinfoCreated._id}`,
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
            terminationDate: 'new value',
            subordinate: 'parentObjectId'
        };

        beforeEach(async () => {
            superiorCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new superior', () => {
            assert.strictEqual(
                superiorCreated.superior.toString(),
                options.superior.toString()
            );
            assert.strictEqual(
                superiorCreated.subordinate.toString(),
                options.subordinate.toString()
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a superior by ID', async () => {
            const retrieved = await thisService.Model.findById(
                superiorCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                superiorCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            superior: `${staffinfoCreated._id}`,
            subordinate: `${staffinfoCreated._id}`
        };

        it('should update an existing superior ', async () => {
            const superiorUpdated = await thisService.Model.findByIdAndUpdate(
                superiorCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                superiorUpdated.superior.toString(),
                options.superior.toString()
            );
            assert.strictEqual(
                superiorUpdated.subordinate.toString(),
                options.subordinate.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a superior', async () => {
            await app
                .service('staffinfo')
                .Model.findByIdAndDelete(staffinfoCreated._id);

            const superiorDeleted = await thisService.Model.findByIdAndDelete(
                superiorCreated._id
            );
            assert.strictEqual(
                superiorDeleted._id.toString(),
                superiorCreated._id.toString()
            );
        });
    });
});
