const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('companies service', async () => {
    let thisService;
    let companyCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('companies');

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
        assert.ok(thisService, 'Registered the service (companies)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            companyNo: 'new value',
            newCompanyNumber: 'new value',
            DateIncorporated: '2026-02-25T01:01:23.123Z',
            isdefault: true
        };

        beforeEach(async () => {
            companyCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new company', () => {
            assert.strictEqual(companyCreated.name, options.name);
            assert.strictEqual(companyCreated.companyNo, options.companyNo);
            assert.strictEqual(
                companyCreated.newCompanyNumber,
                options.newCompanyNumber
            );
            assert.strictEqual(
                companyCreated.DateIncorporated,
                options.DateIncorporated
            );
            assert.strictEqual(companyCreated.isdefault, options.isdefault);
            assert.strictEqual(companyCreated.isdefault, options.isdefault);
        });
    });

    describe('#get', () => {
        it('should retrieve a company by ID', async () => {
            const retrieved = await thisService.Model.findById(
                companyCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                companyCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            companyNo: 'updated value',
            newCompanyNumber: 'updated value',
            DateIncorporated: '2026-02-25T01:01:23.123Z',
            isdefault: false
        };

        it('should update an existing company ', async () => {
            const companyUpdated = await thisService.Model.findByIdAndUpdate(
                companyCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(companyUpdated.name, options.name);
            assert.strictEqual(companyUpdated.companyNo, options.companyNo);
            assert.strictEqual(
                companyUpdated.newCompanyNumber,
                options.newCompanyNumber
            );
            assert.strictEqual(
                companyUpdated.DateIncorporated,
                options.DateIncorporated
            );
            assert.strictEqual(companyUpdated.isdefault, options.isdefault);
            assert.strictEqual(companyUpdated.isdefault, options.isdefault);
        });
    });

    describe('#delete', async () => {
        it('should delete a company', async () => {
            const companyDeleted = await thisService.Model.findByIdAndDelete(
                companyCreated._id
            );
            assert.strictEqual(
                companyDeleted._id.toString(),
                companyCreated._id.toString()
            );
        });
    });
});
