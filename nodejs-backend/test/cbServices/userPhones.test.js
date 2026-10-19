const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userPhones service', async () => {
    let thisService;
    let userPhoneCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });

    beforeEach(async () => {
        thisService = await app.service('userPhones');

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
        assert.ok(thisService, 'Registered the service (userPhones)');
    });

    describe('#create', () => {
        const options = {
            userId: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            countryCode: 23,
            operatorCode: 23,
            number: 23,
            type: ['new value'],
            isDefault: true
        };

        beforeEach(async () => {
            userPhoneCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userPhone', () => {
            assert.strictEqual(
                userPhoneCreated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(
                userPhoneCreated.countryCode,
                options.countryCode
            );
            assert.strictEqual(
                userPhoneCreated.operatorCode,
                options.operatorCode
            );
            assert.strictEqual(userPhoneCreated.number, options.number);
            assert.strictEqual(userPhoneCreated.type, options.type);
            assert.strictEqual(userPhoneCreated.isDefault, options.isDefault);
            assert.strictEqual(userPhoneCreated.isDefault, options.isDefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a userPhone by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userPhoneCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userPhoneCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            userId: `${usersCreated._id}`,
            countryCode: 100,
            operatorCode: 100,
            number: 100,
            type: ['updated value'],
            isDefault: false
        };

        it('should update an existing userPhone ', async () => {
            const userPhoneUpdated = await thisService.Model.findByIdAndUpdate(
                userPhoneCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                userPhoneUpdated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(
                userPhoneUpdated.countryCode,
                options.countryCode
            );
            assert.strictEqual(
                userPhoneUpdated.operatorCode,
                options.operatorCode
            );
            assert.strictEqual(userPhoneUpdated.number, options.number);
            assert.strictEqual(userPhoneUpdated.type, options.type);
            assert.strictEqual(userPhoneUpdated.isDefault, options.isDefault);
            assert.strictEqual(userPhoneUpdated.isDefault, options.isDefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a userPhone', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const userPhoneDeleted = await thisService.Model.findByIdAndDelete(
                userPhoneCreated._id
            );
            assert.strictEqual(
                userPhoneDeleted._id.toString(),
                userPhoneCreated._id.toString()
            );
        });
    });
});
