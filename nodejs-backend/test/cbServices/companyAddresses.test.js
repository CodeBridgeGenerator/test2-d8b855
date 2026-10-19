const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('companyAddresses service', async () => {
    let thisService;
    let companyAddressCreated;
    let usersServiceResults;
    let users;

    const companiesCreated = await app.service('companies').Model.create({
        company: 'parentObjectId',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:24.990Z',
        isdefault: true
    });

    beforeEach(async () => {
        thisService = await app.service('companyAddresses');

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
        assert.ok(thisService, 'Registered the service (companyAddresses)');
    });

    describe('#create', () => {
        const options = {
            company: `${companiesCreated._id}`,
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:24.990Z',
            isdefault: true,
            street1: 'new value',
            street2: 'new value',
            poscode: 'new value',
            city: 'new value',
            state: 'new value',
            province: 'new value',
            country: 'new value',
            isDefault: true
        };

        beforeEach(async () => {
            companyAddressCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new companyAddress', () => {
            assert.strictEqual(
                companyAddressCreated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(companyAddressCreated.street1, options.street1);
            assert.strictEqual(companyAddressCreated.street2, options.street2);
            assert.strictEqual(companyAddressCreated.poscode, options.poscode);
            assert.strictEqual(companyAddressCreated.city, options.city);
            assert.strictEqual(companyAddressCreated.state, options.state);
            assert.strictEqual(
                companyAddressCreated.province,
                options.province
            );
            assert.strictEqual(companyAddressCreated.country, options.country);
            assert.strictEqual(
                companyAddressCreated.isDefault,
                options.isDefault
            );
            assert.strictEqual(
                companyAddressCreated.isDefault,
                options.isDefault
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a companyAddress by ID', async () => {
            const retrieved = await thisService.Model.findById(
                companyAddressCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                companyAddressCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            company: `${companiesCreated._id}`,
            street1: 'updated value',
            street2: 'updated value',
            poscode: 'updated value',
            city: 'updated value',
            state: 'updated value',
            province: 'updated value',
            country: 'updated value',
            isDefault: false
        };

        it('should update an existing companyAddress ', async () => {
            const companyAddressUpdated =
                await thisService.Model.findByIdAndUpdate(
                    companyAddressCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                companyAddressUpdated.company.toString(),
                options.company.toString()
            );
            assert.strictEqual(companyAddressUpdated.street1, options.street1);
            assert.strictEqual(companyAddressUpdated.street2, options.street2);
            assert.strictEqual(companyAddressUpdated.poscode, options.poscode);
            assert.strictEqual(companyAddressUpdated.city, options.city);
            assert.strictEqual(companyAddressUpdated.state, options.state);
            assert.strictEqual(
                companyAddressUpdated.province,
                options.province
            );
            assert.strictEqual(companyAddressUpdated.country, options.country);
            assert.strictEqual(
                companyAddressUpdated.isDefault,
                options.isDefault
            );
            assert.strictEqual(
                companyAddressUpdated.isDefault,
                options.isDefault
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a companyAddress', async () => {
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);

            const companyAddressDeleted =
                await thisService.Model.findByIdAndDelete(
                    companyAddressCreated._id
                );
            assert.strictEqual(
                companyAddressDeleted._id.toString(),
                companyAddressCreated._id.toString()
            );
        });
    });
});
