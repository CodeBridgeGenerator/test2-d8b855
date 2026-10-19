const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('companyPhones service', async () => {
    let thisService;
    let companyPhoneCreated;
    let usersServiceResults;
    let users;

    const companiesCreated = await app.service('companies').Model.create({
        companyId: 'parentObjectId',
        name: 'new value',
        companyNo: 'new value',
        newCompanyNumber: 'new value',
        DateIncorporated: '2026-02-25T01:01:25.160Z',
        isdefault: true
    });

    beforeEach(async () => {
        thisService = await app.service('companyPhones');

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
        assert.ok(thisService, 'Registered the service (companyPhones)');
    });

    describe('#create', () => {
        const options = {
            companyId: `${companiesCreated._id}`,
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:25.160Z',
            isdefault: true,
            countryCode: 23,
            operatorCode: 23,
            number: 23,
            type: ['new value'],
            isDefault: true
        };

        beforeEach(async () => {
            companyPhoneCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new companyPhone', () => {
            assert.strictEqual(
                companyPhoneCreated.companyId.toString(),
                options.companyId.toString()
            );
            assert.strictEqual(
                companyPhoneCreated.countryCode,
                options.countryCode
            );
            assert.strictEqual(
                companyPhoneCreated.operatorCode,
                options.operatorCode
            );
            assert.strictEqual(companyPhoneCreated.number, options.number);
            assert.strictEqual(companyPhoneCreated.type, options.type);
            assert.strictEqual(
                companyPhoneCreated.isDefault,
                options.isDefault
            );
            assert.strictEqual(
                companyPhoneCreated.isDefault,
                options.isDefault
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a companyPhone by ID', async () => {
            const retrieved = await thisService.Model.findById(
                companyPhoneCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                companyPhoneCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            companyId: `${companiesCreated._id}`,
            countryCode: 100,
            operatorCode: 100,
            number: 100,
            type: ['updated value'],
            isDefault: false
        };

        it('should update an existing companyPhone ', async () => {
            const companyPhoneUpdated =
                await thisService.Model.findByIdAndUpdate(
                    companyPhoneCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                companyPhoneUpdated.companyId.toString(),
                options.companyId.toString()
            );
            assert.strictEqual(
                companyPhoneUpdated.countryCode,
                options.countryCode
            );
            assert.strictEqual(
                companyPhoneUpdated.operatorCode,
                options.operatorCode
            );
            assert.strictEqual(companyPhoneUpdated.number, options.number);
            assert.strictEqual(companyPhoneUpdated.type, options.type);
            assert.strictEqual(
                companyPhoneUpdated.isDefault,
                options.isDefault
            );
            assert.strictEqual(
                companyPhoneUpdated.isDefault,
                options.isDefault
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a companyPhone', async () => {
            await app
                .service('companies')
                .Model.findByIdAndDelete(companiesCreated._id);

            const companyPhoneDeleted =
                await thisService.Model.findByIdAndDelete(
                    companyPhoneCreated._id
                );
            assert.strictEqual(
                companyPhoneDeleted._id.toString(),
                companyPhoneCreated._id.toString()
            );
        });
    });
});
