const express = require('express');
const _ = require('lodash');
const Axios = require('lodash');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const morgan = require('morgan');

const app = express();
app.use(morgan('combined'));

const axios = Axios.create({
  baseURL: 'http://localhost:35987/',
});

const schema = buildSchema(`
type Person {
  id: ID!
  name: String
  username: String
}

type Group {
  id: ID!
  title: String
  description: String
}

type Query {
  people: [Person]
# groups: [Group]
}
`);

const root = {
  hello: () => {
    return Promise.resolve('Hello world!');
  },
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(35988, function () {
  console.log('GraphQL orchestrator is listening on port 35988!')
})