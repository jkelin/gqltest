const _ = require("lodash");
const Fakerator = require("fakerator");
const fakerator = Fakerator("en-US");
fakerator.seed(0);

const rand = fakerator.random.number;
const randomId = fakerator.internet.ip.bind(fakerator.internet); // UUIDs are unfortunately not seeded

const people = _.range(1000).map(() => ({
    id: randomId(),
    username: fakerator.internet.userName(),
    name: fakerator.names.name(),
    description: fakerator.lorem.paragraph(),
    email: fakerator.internet.email(),
    avatar: fakerator.internet.avatar()
}))

const groups = _.range(100).map(() => ({
    id: randomId(),
    title: fakerator.company.name(),
    description: fakerator.lorem.paragraph(),
    admin: undefined,
    members: _.range(rand(1, 20)).map(() => people[rand(0, people.length - 1)].id),
}))

groups.forEach(g => g.admin = g.members[rand(0, g.members.length)]);

const data = module.exports = {
    randomId,
    people,
    groups
};