const express = require('express');
const _ = require('lodash');
const Axios = require('axios');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const axios = Axios.create({
  baseURL: 'http://localhost:35987/',
});

const schema = buildSchema(`
type Person {
  id: ID!
  name: String
  username: String
  groupIds: [ID]
  groups: [Person]
}

type Group {
  id: ID!
  title: String
  description: String
  memberIds: [ID]
  members: [Person]
}

type Query {
  login(username: String!): String
  allPeople(from: Int, count: Int): [Person]
  allGroups(from: Int, count: Int): [Group]
}
`);

class Group {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.memberIds = data.members;
  }

  members() {
    return Promise.all(this.memberIds.map(Person.fromId));
  }

  static fromId(id) {
    return axios.get(`/group/${id}`).then(({data: { data }}) => new Group(data));
  }
}

class Person {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.username = data.username;
    this.bio = data.bio;
  }

  groupIds() {
    return axios.get(`/people/with-groups/${this.id}`).then(({data: { data }}) => data.groups);
  }

  groups() {
    return this.groupIds().then(groupIds => Promise.all(groupIds.map(Group.fromId))); // TODO fix this
  }

  static fromId(id) {
    return axios.get(`/people/${id}`).then(({data: { data }}) => new Person(data));
  }
}

const root = {
  login: (args) => axios.post('/login', { username: args.username }).then(({ data: { token } }) => token),
  allPeople: (args) => axios.get(`/people/list/${args.from || 0}/${args.count || 10}`).then(({ data: { data } }) => data.map(x => new Person(x))),
  allGroups: (args) => axios.get(`/groups/list/${args.from || 0}/${args.count || 10}`).then(({ data: { data } }) => data.map(x => new Group(x))),
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(35988, function () {
  console.log('GraphQL orchestrator is listening on port 35988!')
})