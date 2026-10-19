const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('documentStorages service', async () => {
    let thisService;
    let documentStorageCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('documentStorages');

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
        assert.ok(thisService, 'Registered the service (documentStorages)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            size: 23,
            path: 'new value',
            lastModifiedDate: '2026-02-25T01:01:26.886Z',
            lastModified: 23,
            eTag: 'new value',
            versionId: 'new value',
            url: 'new value',
            tableId: 'new value',
            tableName: 'new value'
        };

        beforeEach(async () => {
            documentStorageCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new documentStorage', () => {
            assert.strictEqual(documentStorageCreated.name, options.name);
            assert.strictEqual(documentStorageCreated.size, options.size);
            assert.strictEqual(documentStorageCreated.path, options.path);
            assert.strictEqual(
                documentStorageCreated.lastModifiedDate,
                options.lastModifiedDate
            );
            assert.strictEqual(
                documentStorageCreated.lastModified,
                options.lastModified
            );
            assert.strictEqual(documentStorageCreated.eTag, options.eTag);
            assert.strictEqual(
                documentStorageCreated.versionId,
                options.versionId
            );
            assert.strictEqual(documentStorageCreated.url, options.url);
            assert.strictEqual(documentStorageCreated.tableId, options.tableId);
            assert.strictEqual(
                documentStorageCreated.tableName,
                options.tableName
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a documentStorage by ID', async () => {
            const retrieved = await thisService.Model.findById(
                documentStorageCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                documentStorageCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            size: 100,
            path: 'updated value',
            lastModifiedDate: '2026-02-25T01:01:26.886Z',
            lastModified: 100,
            eTag: 'updated value',
            versionId: 'updated value',
            url: 'updated value',
            tableId: 'updated value',
            tableName: 'updated value'
        };

        it('should update an existing documentStorage ', async () => {
            const documentStorageUpdated =
                await thisService.Model.findByIdAndUpdate(
                    documentStorageCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(documentStorageUpdated.name, options.name);
            assert.strictEqual(documentStorageUpdated.size, options.size);
            assert.strictEqual(documentStorageUpdated.path, options.path);
            assert.strictEqual(
                documentStorageUpdated.lastModifiedDate,
                options.lastModifiedDate
            );
            assert.strictEqual(
                documentStorageUpdated.lastModified,
                options.lastModified
            );
            assert.strictEqual(documentStorageUpdated.eTag, options.eTag);
            assert.strictEqual(
                documentStorageUpdated.versionId,
                options.versionId
            );
            assert.strictEqual(documentStorageUpdated.url, options.url);
            assert.strictEqual(documentStorageUpdated.tableId, options.tableId);
            assert.strictEqual(
                documentStorageUpdated.tableName,
                options.tableName
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a documentStorage', async () => {
            const documentStorageDeleted =
                await thisService.Model.findByIdAndDelete(
                    documentStorageCreated._id
                );
            assert.strictEqual(
                documentStorageDeleted._id.toString(),
                documentStorageCreated._id.toString()
            );
        });
    });
});
