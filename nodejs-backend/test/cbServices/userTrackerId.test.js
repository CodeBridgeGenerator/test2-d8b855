const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('userTrackerId service', async () => {
    let thisService;
    let userTrackerIdCreated;
    let usersServiceResults;
    let users;

    const usersCreated = await app.service('users').Model.create({
        pageName: 'new value',
        trackerCode: 'new value',
        userAgent: 'new value',
        language: 'new value',
        timeZone: 'new value',
        cookeisEnabled: 'new value',
        doNotTrack: 'new value',
        hardConcurrency: 'new value',
        marketCode: 'new value',
        isLoggedIn: true,
        userId: 'parentObjectId',
        name: 'new value',
        email: 'new value',
        password: 'new value',
        status: true
    });

    beforeEach(async () => {
        thisService = await app.service('userTrackerId');

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
        assert.ok(thisService, 'Registered the service (userTrackerId)');
    });

    describe('#create', () => {
        const options = {
            pageName: 'new value',
            trackerCode: 'new value',
            userAgent: 'new value',
            language: 'new value',
            timeZone: 'new value',
            cookeisEnabled: 'new value',
            doNotTrack: 'new value',
            hardConcurrency: 'new value',
            marketCode: 'new value',
            isLoggedIn: true,
            userId: `${usersCreated._id}`,
            name: 'new value',
            email: 'new value',
            password: 'new value',
            status: true
        };

        beforeEach(async () => {
            userTrackerIdCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new userTrackerId', () => {
            assert.strictEqual(userTrackerIdCreated.pageName, options.pageName);
            assert.strictEqual(
                userTrackerIdCreated.trackerCode,
                options.trackerCode
            );
            assert.strictEqual(
                userTrackerIdCreated.userAgent,
                options.userAgent
            );
            assert.strictEqual(userTrackerIdCreated.language, options.language);
            assert.strictEqual(userTrackerIdCreated.timeZone, options.timeZone);
            assert.strictEqual(
                userTrackerIdCreated.cookeisEnabled,
                options.cookeisEnabled
            );
            assert.strictEqual(
                userTrackerIdCreated.doNotTrack,
                options.doNotTrack
            );
            assert.strictEqual(
                userTrackerIdCreated.hardConcurrency,
                options.hardConcurrency
            );
            assert.strictEqual(
                userTrackerIdCreated.marketCode,
                options.marketCode
            );
            assert.strictEqual(
                userTrackerIdCreated.isLoggedIn,
                options.isLoggedIn
            );
            assert.strictEqual(
                userTrackerIdCreated.isLoggedIn,
                options.isLoggedIn
            );
            assert.strictEqual(
                userTrackerIdCreated.userId.toString(),
                options.userId.toString()
            );
        });
    });

    describe('#get', () => {
        it('should retrieve a userTrackerId by ID', async () => {
            const retrieved = await thisService.Model.findById(
                userTrackerIdCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                userTrackerIdCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            pageName: 'updated value',
            trackerCode: 'updated value',
            userAgent: 'updated value',
            language: 'updated value',
            timeZone: 'updated value',
            cookeisEnabled: 'updated value',
            doNotTrack: 'updated value',
            hardConcurrency: 'updated value',
            marketCode: 'updated value',
            isLoggedIn: false,
            userId: `${usersCreated._id}`
        };

        it('should update an existing userTrackerId ', async () => {
            const userTrackerIdUpdated =
                await thisService.Model.findByIdAndUpdate(
                    userTrackerIdCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(userTrackerIdUpdated.pageName, options.pageName);
            assert.strictEqual(
                userTrackerIdUpdated.trackerCode,
                options.trackerCode
            );
            assert.strictEqual(
                userTrackerIdUpdated.userAgent,
                options.userAgent
            );
            assert.strictEqual(userTrackerIdUpdated.language, options.language);
            assert.strictEqual(userTrackerIdUpdated.timeZone, options.timeZone);
            assert.strictEqual(
                userTrackerIdUpdated.cookeisEnabled,
                options.cookeisEnabled
            );
            assert.strictEqual(
                userTrackerIdUpdated.doNotTrack,
                options.doNotTrack
            );
            assert.strictEqual(
                userTrackerIdUpdated.hardConcurrency,
                options.hardConcurrency
            );
            assert.strictEqual(
                userTrackerIdUpdated.marketCode,
                options.marketCode
            );
            assert.strictEqual(
                userTrackerIdUpdated.isLoggedIn,
                options.isLoggedIn
            );
            assert.strictEqual(
                userTrackerIdUpdated.isLoggedIn,
                options.isLoggedIn
            );
            assert.strictEqual(
                userTrackerIdUpdated.userId.toString(),
                options.userId.toString()
            );
        });
    });

    describe('#delete', async () => {
        it('should delete a userTrackerId', async () => {
            await app
                .service('users')
                .Model.findByIdAndDelete(usersCreated._id);

            const userTrackerIdDeleted =
                await thisService.Model.findByIdAndDelete(
                    userTrackerIdCreated._id
                );
            assert.strictEqual(
                userTrackerIdDeleted._id.toString(),
                userTrackerIdCreated._id.toString()
            );
        });
    });
});
