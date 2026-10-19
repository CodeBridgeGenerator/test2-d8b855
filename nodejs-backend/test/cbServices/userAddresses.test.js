const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userAddresses service', async () => {
    let thisService;
    let userAddressCreated;
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
        thisService = await app.service('userAddresses');

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
        assert.ok(thisService, 'Registered the service (userAddresses)');
    });

    describe('#create', () => {
        const options = {
            userId: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            street1: 'new value',
            street2: 'new value',
            postalCode: 'new value',
            city: 'new value',
            state: 'new value',
            province: 'new value',
            country: 'new value'
        };

        beforeEach(async () => {
            userAddressCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userAddress', () => {
            assert.strictEqual(
                userAddressCreated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(userAddressCreated.street1, options.street1);
            assert.strictEqual(userAddressCreated.street2, options.street2);
            assert.strictEqual(
                userAddressCreated.postalCode,
                options.postalCode
            );
            assert.strictEqual(userAddressCreated.city, options.city);
            assert.strictEqual(userAddressCreated.state, options.state);
            assert.strictEqual(userAddressCreated.province, options.province);
            assert.strictEqual(userAddressCreated.country, options.country);
        });
    });

    describe('#get', () => {
        it('should retrieve a userAddress by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userAddressCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userAddressCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            userId: `${usersCreated._id}`,
            street1: 'updated value',
            street2: 'updated value',
            postalCode: 'updated value',
            city: 'updated value',
            state: 'updated value',
            province: 'updated value',
            country: 'updated value'
        };

        it('should update an existing userAddress ', async () => {
            const userAddressUpdated =
                await thisService.Model.findByIdAndUpdate(
                    userAddressCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                userAddressUpdated.userId.toString(),
                options.userId.toString()
            );
            assert.strictEqual(userAddressUpdated.street1, options.street1);
            assert.strictEqual(userAddressUpdated.street2, options.street2);
            assert.strictEqual(
                userAddressUpdated.postalCode,
                options.postalCode
            );
            assert.strictEqual(userAddressUpdated.city, options.city);
            assert.strictEqual(userAddressUpdated.state, options.state);
            assert.strictEqual(userAddressUpdated.province, options.province);
            assert.strictEqual(userAddressUpdated.country, options.country);
        });
    });

    describe('#delete', async () => {
        it('should delete a userAddress', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const userAddressDeleted =
                await thisService.Model.findByIdAndDelete(
                    userAddressCreated._id
                );
            assert.strictEqual(
                userAddressDeleted._id.toString(),
                userAddressCreated._id.toString()
            );
        });
    });
});
