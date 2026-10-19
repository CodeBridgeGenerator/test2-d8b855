const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('mails service', async () => {
    let thisService;
    let mailCreated;
    let usersServiceResults;
    let users;

    beforeEach(async () => {
        thisService = await app.service('mails');

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
        assert.ok(thisService, 'Registered the service (mails)');
    });

    describe('#create', () => {
        const options = {
            sentDateTime: new Date('2026-01-01T00:00:00.000Z'),
            sentStatus: true,
            status: true,
            mailType: 'system',
            toHistory: ['standard@example.com'],
            subject: 'Welcome',
            body: 'Hello'
        };

        beforeEach(async () => {
            mailCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new mail log', () => {
            assert.strictEqual(mailCreated.mailType, options.mailType);
            assert.strictEqual(mailCreated.sentStatus, options.sentStatus);
            assert.strictEqual(mailCreated.subject, options.subject);
        });
    });

    describe('#get', () => {
        it('should retrieve a mail log by ID', async () => {
            const retrieved = await thisService.Model.findById(mailCreated._id);
            assert.strictEqual(
                retrieved._id.toString(),
                mailCreated._id.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a mail log', async () => {
            const mailDeleted = await thisService.Model.findByIdAndDelete(
                mailCreated._id
            );
            assert.strictEqual(
                mailDeleted._id.toString(),
                mailCreated._id.toString()
            );
        });
    });
});
