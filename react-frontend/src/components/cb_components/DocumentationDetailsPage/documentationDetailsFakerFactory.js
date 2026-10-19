import { faker } from '@faker-js/faker';
export default (user, count, documentationFileIds) => {
    let data = [];
    for (let i = 0; i < count; i++) {
        const fake = {
            fileName: faker.lorem.sentence(1),
            documentationFile: documentationFileIds[i % documentationFileIds.length],

            updatedBy: user._id,
            createdBy: user._id
        };
        data = [...data, fake];
    }
    return data;
};
