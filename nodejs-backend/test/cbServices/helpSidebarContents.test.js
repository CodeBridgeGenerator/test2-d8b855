const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('helpSidebarContents service', async () => {
    let thisService;
    let helpSidebarContentCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('helpSidebarContents');

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
        assert.ok(thisService, 'Registered the service (helpSidebarContents)');
    });

    describe('#create', () => {
        const options = { serviceName: 'new value', content: 'new value' };

        beforeEach(async () => {
            helpSidebarContentCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new helpSidebarContent', () => {
            assert.strictEqual(
                helpSidebarContentCreated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                helpSidebarContentCreated.content,
                options.content
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a helpSidebarContent by ID', async () => {
            const retrieved = await thisService.Model.findById(
                helpSidebarContentCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                helpSidebarContentCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            serviceName: 'updated value',
            content: 'updated value'
        };

        it('should update an existing helpSidebarContent ', async () => {
            const helpSidebarContentUpdated =
                await thisService.Model.findByIdAndUpdate(
                    helpSidebarContentCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                helpSidebarContentUpdated.serviceName,
                options.serviceName
            );
            assert.strictEqual(
                helpSidebarContentUpdated.content,
                options.content
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a helpSidebarContent', async () => {
            const helpSidebarContentDeleted =
                await thisService.Model.findByIdAndDelete(
                    helpSidebarContentCreated._id
                );
            assert.strictEqual(
                helpSidebarContentDeleted._id.toString(),
                helpSidebarContentCreated._id.toString()
            );
        });
    });
});
