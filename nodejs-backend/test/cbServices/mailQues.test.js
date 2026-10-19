const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('mailQues service', async () => {
    let thisService;
    let mailQueCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('mailQues');

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
        assert.ok(thisService, 'Registered the service (mailQues)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            from: 'new value',
            subject: 'new value',
            recipients: ['new value'],
            content: 'new value',
            payload: {
                name: 'John Doe Many',
                age: 20,
                dateofbirth: '1999-01-01T00:00:00.000Z'
            },
            templateId: 'new value',
            status: true,
            jobId: 23,
            end: '2026-02-25T01:01:27.886Z'
        };

        beforeEach(async () => {
            mailQueCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new mailQue', () => {
            assert.strictEqual(mailQueCreated.name, options.name);
            assert.strictEqual(mailQueCreated.from, options.from);
            assert.strictEqual(mailQueCreated.subject, options.subject);
            assert.strictEqual(mailQueCreated.recipients, options.recipients);
            assert.strictEqual(mailQueCreated.content, options.content);
            assert.strictEqual(mailQueCreated.payload, options.payload);
            assert.strictEqual(mailQueCreated.templateId, options.templateId);
            assert.strictEqual(mailQueCreated.status, options.status);
            assert.strictEqual(mailQueCreated.status, options.status);
            assert.strictEqual(mailQueCreated.jobId, options.jobId);
            assert.strictEqual(mailQueCreated.end, options.end);
        });
    });

    describe('#get', () => {
        it('should retrieve a mailQue by ID', async () => {
            const retrieved = await thisService.Model.findById(
                mailQueCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                mailQueCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            from: 'updated value',
            subject: 'updated value',
            recipients: ['updated value'],
            content: 'updated value',
            payload: {
                name: 'John Doe',
                age: 200,
                dateofbirth: '2025-01-31T00:00:00.000Z'
            },
            templateId: 'updated value',
            status: false,
            jobId: 100,
            end: '2026-02-25T01:01:27.886Z'
        };

        it('should update an existing mailQue ', async () => {
            const mailQueUpdated = await thisService.Model.findByIdAndUpdate(
                mailQueCreated._id,
                options,
                { new: true } // Ensure it returns the updated doc
            );
            assert.strictEqual(mailQueUpdated.name, options.name);
            assert.strictEqual(mailQueUpdated.from, options.from);
            assert.strictEqual(mailQueUpdated.subject, options.subject);
            assert.strictEqual(mailQueUpdated.recipients, options.recipients);
            assert.strictEqual(mailQueUpdated.content, options.content);
            assert.strictEqual(mailQueUpdated.payload, options.payload);
            assert.strictEqual(mailQueUpdated.templateId, options.templateId);
            assert.strictEqual(mailQueUpdated.status, options.status);
            assert.strictEqual(mailQueUpdated.status, options.status);
            assert.strictEqual(mailQueUpdated.jobId, options.jobId);
            assert.strictEqual(mailQueUpdated.end, options.end);
        });
    });

    describe('#delete', async () => {
        it('should delete a mailQue', async () => {
            const mailQueDeleted = await thisService.Model.findByIdAndDelete(
                mailQueCreated._id
            );
            assert.strictEqual(
                mailQueDeleted._id.toString(),
                mailQueCreated._id.toString()
            );
        });
    });
});
