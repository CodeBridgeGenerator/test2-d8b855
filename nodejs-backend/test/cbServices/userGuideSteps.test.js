const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userGuideSteps service', async () => {
    let thisService;
    let userGuideStepCreated;
    let usersServiceResults;
    let users;

    const userGuideCreated = await app.service('userGuide').Model.create({
        userGuideID: 'parentObjectId',
        serviceName: 'new value',
        expiry: '2026-02-25T01:01:26.173Z'
    });

    beforeEach(async () => {
        thisService = await app.service('userGuideSteps');

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
        assert.ok(thisService, 'Registered the service (userGuideSteps)');
    });

    describe('#create', () => {
        const options = {
            userGuideID: `${userGuideCreated._id}`,
            serviceName: 'new value',
            expiry: '2026-02-25T01:01:26.173Z',
            Steps: 'new value',
            Description: 'new value'
        };

        beforeEach(async () => {
            userGuideStepCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userGuideStep', () => {
            assert.strictEqual(
                userGuideStepCreated.userGuideID.toString(),
                options.userGuideID.toString()
            );
            assert.strictEqual(userGuideStepCreated.Steps, options.Steps);
            assert.strictEqual(
                userGuideStepCreated.Description,
                options.Description
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a userGuideStep by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userGuideStepCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userGuideStepCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            userGuideID: `${userGuideCreated._id}`,
            Steps: 'updated value',
            Description: 'updated value'
        };

        it('should update an existing userGuideStep ', async () => {
            const userGuideStepUpdated =
                await thisService.Model.findByIdAndUpdate(
                    userGuideStepCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(
                userGuideStepUpdated.userGuideID.toString(),
                options.userGuideID.toString()
            );
            assert.strictEqual(userGuideStepUpdated.Steps, options.Steps);
            assert.strictEqual(
                userGuideStepUpdated.Description,
                options.Description
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a userGuideStep', async () => {
            await app
                .service('userGuide')
                .Model.findByIdAndDelete(userGuideCreated._id);

            const userGuideStepDeleted =
                await thisService.Model.findByIdAndDelete(
                    userGuideStepCreated._id
                );
            assert.strictEqual(
                userGuideStepDeleted._id.toString(),
                userGuideStepCreated._id.toString()
            );
        });
    });
});
