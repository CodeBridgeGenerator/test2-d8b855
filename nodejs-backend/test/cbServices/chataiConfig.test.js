const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('chataiConfig service', async () => {
    let thisService;
    let chataiConfigCreated;
    let usersServiceResults;
    let users;

    const chataiEnablerCreated = await app
        .service('chataiEnabler')
        .Model.create({
            name: 'new value',
            chatAiEnabler: 'parentObjectId',
            serviceName: ['new value'],
            description: 'new value'
        });

    beforeEach(async () => {
        thisService = await app.service('chataiConfig');

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
        assert.ok(thisService, 'Registered the service (chataiConfig)');
    });

    describe('#create', () => {
        const options = {
            name: 'new value',
            chatAiEnabler: `${chataiEnablerCreated._id}`,
            serviceName: ['new value'],
            description: 'new value',
            bedrockModelId: 'new value',
            modelParamsJson: 'new value',
            human: 'new value',
            task: 'new value',
            noCondition: 'new value',
            yesCondition: 'new value',
            documents: 'new value',
            example: 'new value',
            preamble: 'new value'
        };

        beforeEach(async () => {
            chataiConfigCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new chataiConfig', () => {
            assert.strictEqual(chataiConfigCreated.name, options.name);
            assert.strictEqual(
                chataiConfigCreated.chatAiEnabler.toString(),
                options.chatAiEnabler.toString()
            );
            assert.strictEqual(
                chataiConfigCreated.bedrockModelId,
                options.bedrockModelId
            );
            assert.strictEqual(
                chataiConfigCreated.modelParamsJson,
                options.modelParamsJson
            );
            assert.strictEqual(chataiConfigCreated.human, options.human);
            assert.strictEqual(chataiConfigCreated.task, options.task);
            assert.strictEqual(
                chataiConfigCreated.noCondition,
                options.noCondition
            );
            assert.strictEqual(
                chataiConfigCreated.yesCondition,
                options.yesCondition
            );
            assert.strictEqual(
                chataiConfigCreated.documents,
                options.documents
            );
            assert.strictEqual(chataiConfigCreated.example, options.example);
            assert.strictEqual(chataiConfigCreated.preamble, options.preamble);
        });
    });

    describe('#get', () => {
        it('should retrieve a chataiConfig by ID', async () => {
            const retrieved = await thisService.Model.findById(
                chataiConfigCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                chataiConfigCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            name: 'updated value',
            chatAiEnabler: `${chataiEnablerCreated._id}`,
            bedrockModelId: 'updated value',
            modelParamsJson: 'updated value',
            human: 'updated value',
            task: 'updated value',
            noCondition: 'updated value',
            yesCondition: 'updated value',
            documents: 'updated value',
            example: 'updated value',
            preamble: 'updated value'
        };

        it('should update an existing chataiConfig ', async () => {
            const chataiConfigUpdated =
                await thisService.Model.findByIdAndUpdate(
                    chataiConfigCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(chataiConfigUpdated.name, options.name);
            assert.strictEqual(
                chataiConfigUpdated.chatAiEnabler.toString(),
                options.chatAiEnabler.toString()
            );
            assert.strictEqual(
                chataiConfigUpdated.bedrockModelId,
                options.bedrockModelId
            );
            assert.strictEqual(
                chataiConfigUpdated.modelParamsJson,
                options.modelParamsJson
            );
            assert.strictEqual(chataiConfigUpdated.human, options.human);
            assert.strictEqual(chataiConfigUpdated.task, options.task);
            assert.strictEqual(
                chataiConfigUpdated.noCondition,
                options.noCondition
            );
            assert.strictEqual(
                chataiConfigUpdated.yesCondition,
                options.yesCondition
            );
            assert.strictEqual(
                chataiConfigUpdated.documents,
                options.documents
            );
            assert.strictEqual(chataiConfigUpdated.example, options.example);
            assert.strictEqual(chataiConfigUpdated.preamble, options.preamble);
        });
    });

    describe('#delete', async () => {
        it('should delete a chataiConfig', async () => {
            await app
                .service('chataiEnabler')
                .Model.findByIdAndDelete(chataiEnablerCreated._id);

            const chataiConfigDeleted =
                await thisService.Model.findByIdAndDelete(
                    chataiConfigCreated._id
                );
            assert.strictEqual(
                chataiConfigDeleted._id.toString(),
                chataiConfigCreated._id.toString()
            );
        });
    });
});
