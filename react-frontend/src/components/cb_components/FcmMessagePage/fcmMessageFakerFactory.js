import { faker } from '@faker-js/faker';
export default (user, count, recipientsIds, fromIds) => {
    let data = [];
    for (let i = 0; i < count; i++) {
        const fake = {
            title: faker.lorem.sentence(''),
            body: faker.lorem.sentence(''),
            recipients: recipientsIds[i % recipientsIds.length],
            image: faker.lorem.sentence(''),
            from: fromIds[i % fromIds.length],

            updatedBy: user._id,
            createdBy: user._id
        };
        data = [...data, fake];
    }
    return data;
};
