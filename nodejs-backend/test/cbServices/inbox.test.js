const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('inbox service', async () => {
    let thisService;
    let inboxCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        from: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });

    beforeEach(async () => {
        thisService = await app.service('inbox');

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
        assert.ok(thisService, 'Registered the service (inbox)');
    });

    describe('#create', () => {
        const options = {
            from: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true,
            toUser: 'parentObjectId',
            subject: 'new value',
            content: 'new value',
            service: 'new value',
            read: true,
            flagged: true,
            sent: true,
            links: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            }
        };

        beforeEach(async () => {
            inboxCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new inbox', () => {
            assert.strictEqual(
                inboxCreated.from.toString(),
                options.from.toString()
            );
            assert.strictEqual(
                inboxCreated.toUser.toString(),
                options.toUser.toString()
            );
            assert.strictEqual(inboxCreated.subject, options.subject);
            assert.strictEqual(inboxCreated.content, options.content);
            assert.strictEqual(inboxCreated.service, options.service);
            assert.strictEqual(inboxCreated.read, options.read);
            assert.strictEqual(inboxCreated.read, options.read);
            assert.strictEqual(inboxCreated.flagged, options.flagged);
            assert.strictEqual(inboxCreated.flagged, options.flagged);
            assert.strictEqual(inboxCreated.sent, options.sent);
            assert.strictEqual(inboxCreated.sent, options.sent);
            assert.strictEqual(inboxCreated.links, options.links);
        });
    });

    describe('#get', () => {
        it('should retrieve a inbox by ID', async () => {
            const retrieved = await thisService.Model.findById(
                inboxCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                inboxCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            from: `${usersCreated._id}`,
            toUser: `${usersCreated._id}`,
            subject: 'updated value',
            content: 'updated value',
            service: 'updated value',
            read: false,
            flagged: false,
            sent: false,
            links: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            }
        };

        it('should update an existing inbox ', async () => {
            const inboxUpdated = await thisService.Model.findByIdAndUpdate(
                inboxCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(
                inboxUpdated.from.toString(),
                options.from.toString()
            );
            assert.strictEqual(
                inboxUpdated.toUser.toString(),
                options.toUser.toString()
            );
            assert.strictEqual(inboxUpdated.subject, options.subject);
            assert.strictEqual(inboxUpdated.content, options.content);
            assert.strictEqual(inboxUpdated.service, options.service);
            assert.strictEqual(inboxUpdated.read, options.read);
            assert.strictEqual(inboxUpdated.read, options.read);
            assert.strictEqual(inboxUpdated.flagged, options.flagged);
            assert.strictEqual(inboxUpdated.flagged, options.flagged);
            assert.strictEqual(inboxUpdated.sent, options.sent);
            assert.strictEqual(inboxUpdated.sent, options.sent);
            assert.strictEqual(inboxUpdated.links, options.links);
        });
    });

    describe('#delete', async () => {
        it('should delete a inbox', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const inboxDeleted = await thisService.Model.findByIdAndDelete(
                inboxCreated._id
            );
            assert.strictEqual(
                inboxDeleted._id.toString(),
                inboxCreated._id.toString()
            );
        });
    });
});
