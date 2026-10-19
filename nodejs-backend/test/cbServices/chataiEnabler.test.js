const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('chataiEnabler service', async () => {
    let thisService;
    let chataiEnablerCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('chataiEnabler');

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
        assert.ok(thisService, 'Registered the service (chataiEnabler)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            serviceName: ['new value'],
            description: 'new value'
        };

        beforeEach(async () => {
            chataiEnablerCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new chataiEnabler', () => {
            assert.strictEqual(chataiEnablerCreated.name, options.name);
            assert.strictEqual(
                chataiEnablerCreated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                chataiEnablerCreated.description,
                options.description
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a chataiEnabler by ID', async () => {
            const retrieved = await thisService.Model.findById(
                chataiEnablerCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                chataiEnablerCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            serviceName: ['updated value'],
            description: 'updated value'
        };

        it('should update an existing chataiEnabler ', async () => {
            const chataiEnablerUpdated =
                await thisService.Model.findByIdAndUpdate(
                    chataiEnablerCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(chataiEnablerUpdated.name, options.name);
            assert.strictEqual(
                chataiEnablerUpdated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                chataiEnablerUpdated.description,
                options.description
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a chataiEnabler', async () => {
            const chataiEnablerDeleted =
                await thisService.Model.findByIdAndDelete(
                    chataiEnablerCreated._id
                );
            assert.strictEqual(
                chataiEnablerDeleted._id.toString(),
                chataiEnablerCreated._id.toString()
            );
        });
    });
});
