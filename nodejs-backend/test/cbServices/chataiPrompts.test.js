const assert = require('assert');
const app = require('../../src/app');

let usersRefData = [
    {
        name: 'Standard User',
        email: 'standard@example.com',
        password: 'password'
    }
];

describe('chataiPrompts service', async () => {
    let thisService;
    let chataiPromptCreated;
    let usersServiceResults;
    let users;

    const chataiEnablerCreated = await app
        .service('chataiEnabler')
        .Model.create({
            session: 'new value',
            chatAiEnabler: 'parentObjectId',
            name: 'new value',
            serviceName: ['new value'],
            description: 'new value'
        });
    const chataiConfigCreated = await app.service('chataiConfig').Model.create({
        session: 'new value',
        chatAiEnabler: 'parentObjectId',
        name: 'new value',
        serviceName: ['new value'],
        description: 'new value',
        chatAiConfig: 'parentObjectId',
        bedrockModelId: 'new value',
        modelParamsJson: 'new value',
        human: 'new value',
        task: 'new value',
        noCondition: 'new value',
        yesCondition: 'new value',
        documents: 'new value',
        example: 'new value',
        preamble: 'new value'
    });

    beforeEach(async () => {
        thisService = await app.service('chataiPrompts');

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
        assert.ok(thisService, 'Registered the service (chataiPrompts)');
    });

    describe('#create', () => {
        const options = {
            session: 'new value',
            chatAiEnabler: 'parentObjectId',
            name: 'new value',
            serviceName: ['new value'],
            description: 'new value',
            chatAiConfig: `${chataiConfigCreated._id}`,
            bedrockModelId: 'new value',
            modelParamsJson: 'new value',
            human: 'new value',
            task: 'new value',
            noCondition: 'new value',
            yesCondition: 'new value',
            documents: 'new value',
            example: 'new value',
            preamble: 'new value',
            prompt: 'new value',
            refDocs: 'new value',
            responseText: 'new value',
            systemId: 'new value',
            type: 'new value',
            role: 'new value',
            model: 'new value',
            params: 'new value',
            stopReason: 'new value',
            stopSequence: 'new value',
            inputTokens: 23,
            outputTokens: 23,
            cost: 23,
            status: true,
            error: 'new value',
            userRemarks: 'new value',
            thumbsDown: true,
            thumbsUp: true,
            copies: true,
            emailed: true
        };

        beforeEach(async () => {
            chataiPromptCreated = await thisService.Model.create({
                ...options,
                ...users
            });
        });

        it('should create a new chataiPrompt', () => {
            assert.strictEqual(chataiPromptCreated.session, options.session);
            assert.strictEqual(
                chataiPromptCreated.chatAiEnabler.toString(),
                options.chatAiEnabler.toString()
            );
            assert.strictEqual(
                chataiPromptCreated.chatAiConfig.toString(),
                options.chatAiConfig.toString()
            );
            assert.strictEqual(chataiPromptCreated.prompt, options.prompt);
            assert.strictEqual(chataiPromptCreated.refDocs, options.refDocs);
            assert.strictEqual(
                chataiPromptCreated.responseText,
                options.responseText
            );
            assert.strictEqual(chataiPromptCreated.systemId, options.systemId);
            assert.strictEqual(chataiPromptCreated.type, options.type);
            assert.strictEqual(chataiPromptCreated.role, options.role);
            assert.strictEqual(chataiPromptCreated.model, options.model);
            assert.strictEqual(chataiPromptCreated.params, options.params);
            assert.strictEqual(
                chataiPromptCreated.stopReason,
                options.stopReason
            );
            assert.strictEqual(
                chataiPromptCreated.stopSequence,
                options.stopSequence
            );
            assert.strictEqual(
                chataiPromptCreated.inputTokens,
                options.inputTokens
            );
            assert.strictEqual(
                chataiPromptCreated.outputTokens,
                options.outputTokens
            );
            assert.strictEqual(chataiPromptCreated.cost, options.cost);
            assert.strictEqual(chataiPromptCreated.status, options.status);
            assert.strictEqual(chataiPromptCreated.status, options.status);
            assert.strictEqual(chataiPromptCreated.error, options.error);
            assert.strictEqual(
                chataiPromptCreated.userRemarks,
                options.userRemarks
            );
            assert.strictEqual(
                chataiPromptCreated.thumbsDown,
                options.thumbsDown
            );
            assert.strictEqual(
                chataiPromptCreated.thumbsDown,
                options.thumbsDown
            );
            assert.strictEqual(chataiPromptCreated.thumbsUp, options.thumbsUp);
            assert.strictEqual(chataiPromptCreated.thumbsUp, options.thumbsUp);
            assert.strictEqual(chataiPromptCreated.copies, options.copies);
            assert.strictEqual(chataiPromptCreated.copies, options.copies);
            assert.strictEqual(chataiPromptCreated.emailed, options.emailed);
            assert.strictEqual(chataiPromptCreated.emailed, options.emailed);
        });
    });

    describe('#get', () => {
        it('should retrieve a chataiPrompt by ID', async () => {
            const retrieved = await thisService.Model.findById(
                chataiPromptCreated._id
            );
            assert.strictEqual(
                retrieved._id.toString(),
                chataiPromptCreated._id.toString()
            );
        });
    });

    describe('#update', () => {
        const options = {
            session: 'updated value',
            chatAiEnabler: `${chataiEnablerCreated._id}`,
            chatAiConfig: `${chataiConfigCreated._id}`,
            prompt: 'updated value',
            refDocs: 'updated value',
            responseText: 'updated value',
            systemId: 'updated value',
            type: 'updated value',
            role: 'updated value',
            model: 'updated value',
            params: 'updated value',
            stopReason: 'updated value',
            stopSequence: 'updated value',
            inputTokens: 100,
            outputTokens: 100,
            cost: 100,
            status: false,
            error: 'updated value',
            userRemarks: 'updated value',
            thumbsDown: false,
            thumbsUp: false,
            copies: false,
            emailed: false
        };

        it('should update an existing chataiPrompt ', async () => {
            const chataiPromptUpdated =
                await thisService.Model.findByIdAndUpdate(
                    chataiPromptCreated._id,
                    options,
                    { new: true } // Ensure it returns the updated doc
                );
            assert.strictEqual(chataiPromptUpdated.session, options.session);
            assert.strictEqual(
                chataiPromptUpdated.chatAiEnabler.toString(),
                options.chatAiEnabler.toString()
            );
            assert.strictEqual(
                chataiPromptUpdated.chatAiConfig.toString(),
                options.chatAiConfig.toString()
            );
            assert.strictEqual(chataiPromptUpdated.prompt, options.prompt);
            assert.strictEqual(chataiPromptUpdated.refDocs, options.refDocs);
            assert.strictEqual(
                chataiPromptUpdated.responseText,
                options.responseText
            );
            assert.strictEqual(chataiPromptUpdated.systemId, options.systemId);
            assert.strictEqual(chataiPromptUpdated.type, options.type);
            assert.strictEqual(chataiPromptUpdated.role, options.role);
            assert.strictEqual(chataiPromptUpdated.model, options.model);
            assert.strictEqual(chataiPromptUpdated.params, options.params);
            assert.strictEqual(
                chataiPromptUpdated.stopReason,
                options.stopReason
            );
            assert.strictEqual(
                chataiPromptUpdated.stopSequence,
                options.stopSequence
            );
            assert.strictEqual(
                chataiPromptUpdated.inputTokens,
                options.inputTokens
            );
            assert.strictEqual(
                chataiPromptUpdated.outputTokens,
                options.outputTokens
            );
            assert.strictEqual(chataiPromptUpdated.cost, options.cost);
            assert.strictEqual(chataiPromptUpdated.status, options.status);
            assert.strictEqual(chataiPromptUpdated.status, options.status);
            assert.strictEqual(chataiPromptUpdated.error, options.error);
            assert.strictEqual(
                chataiPromptUpdated.userRemarks,
                options.userRemarks
            );
            assert.strictEqual(
                chataiPromptUpdated.thumbsDown,
                options.thumbsDown
            );
            assert.strictEqual(
                chataiPromptUpdated.thumbsDown,
                options.thumbsDown
            );
            assert.strictEqual(chataiPromptUpdated.thumbsUp, options.thumbsUp);
            assert.strictEqual(chataiPromptUpdated.thumbsUp, options.thumbsUp);
            assert.strictEqual(chataiPromptUpdated.copies, options.copies);
            assert.strictEqual(chataiPromptUpdated.copies, options.copies);
            assert.strictEqual(chataiPromptUpdated.emailed, options.emailed);
            assert.strictEqual(chataiPromptUpdated.emailed, options.emailed);
        });
    });

    describe('#delete', async () => {
        it('should delete a chataiPrompt', async () => {
            await app
                .service('chataiEnabler')
                .Model.findByIdAndDelete(chataiEnablerCreated._id);
            await app
                .service('chataiConfig')
                .Model.findByIdAndDelete(chataiConfigCreated._id);

            const chataiPromptDeleted =
                await thisService.Model.findByIdAndDelete(
                    chataiPromptCreated._id
                );
            assert.strictEqual(
                chataiPromptDeleted._id.toString(),
                chataiPromptCreated._id.toString()
            );
        });
    });
});
