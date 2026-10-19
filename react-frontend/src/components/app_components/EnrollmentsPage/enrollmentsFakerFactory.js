
import { faker } from "@faker-js/faker";
export default (user,count,studentIds,courseIds) => {
    let data = [];
    for (let i = 0; i < count; i++) {
        const fake = {
student: studentIds[i % studentIds.length],
course: courseIds[i % courseIds.length],
startDate: faker.date.soon(),
endDate: faker.date.soon(),
status: faker.datatype.boolean(),

updatedBy: user._id,
createdBy: user._id
        };
        data = [...data, fake];
    }
    return data;
};
