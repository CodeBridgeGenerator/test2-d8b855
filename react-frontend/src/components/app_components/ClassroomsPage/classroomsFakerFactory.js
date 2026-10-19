
import { faker } from "@faker-js/faker";
export default (user,count) => {
    let data = [];
    for (let i = 0; i < count; i++) {
        const fake = {
room: faker.lorem.sentence(1),
building: faker.lorem.sentence(1),
floor: faker.lorem.sentence(1),
capacity: faker.lorem.sentence(1),
hasProjector: faker.lorem.sentence(1),

updatedBy: user._id,
createdBy: user._id
        };
        data = [...data, fake];
    }
    return data;
};
