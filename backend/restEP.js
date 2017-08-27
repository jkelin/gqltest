const data = require('./data');
const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
app.use(bodyParser.json());
app.use(morgan('combined'));

function idpResolve(token) {
  return data.people.find(p => p.id === token);
}

app.get('/groups/list/:skip/:take', function (req, res) {
  const groups = _.chain(data.groups).drop(req.params.skip).take(req.params.take).value();
  
  return res.status(200).send({total: data.groups.length, data: groups});
})

app.get('/groups/with-people/:id', function (req, res) {
  const group = data.groups.find(p => p.id === req.params.id);

  if(group) {
    group.members = group.members.map(m => data.people.find(p => p.id === m));
    return res.status(200).send({data: group});
  } else {
    return res.status(404).send({error: 'GROUP_NOT_FOUND'});
  }
})

app.get('/groups/:id', function (req, res) {
  const group = data.groups.find(p => p.id === req.params.id);

  if(group) {
    return res.status(200).send({data: group});
  } else {
    return res.status(404).send({error: 'GROUP_NOT_FOUND'});
  }
})

app.post('/groups/:id/title', function (req, res) {
  if (!req.headers.authentication) {
    return res.status(404).send({error: 'AUTHENTICATION_REQUIRED'});
  }

  const auth = idpResolve(req.headers.authentication);

  if (!auth) {
    return res.status(404).send({error: 'AUTHENTICATION_INVALID'});
  }

  const group = data.groups.find(p => p.id === req.params.id);

  if (!group) {
    return res.status(400).send({error: 'GROUP_NOT_FOUND'});
  }

  if(!group.admin !== auth.id) {
    return res.status(404).send({error: 'AUTHORIZATION_INVALID'});
  }

  if (!req.body.title) {
    return res.status(400).send({error: 'BODY_FORMAT_INVALID'});
  }

  group.title = req.body.title;
  return res.status(200).send({data: group});
})

app.post('/groups/:id/description', function (req, res) {
  if (!req.headers.authentication) {
    return res.status(404).send({error: 'AUTHENTICATION_REQUIRED'});
  }

  const auth = idpResolve(req.headers.authentication);

  if (!auth) {
    return res.status(404).send({error: 'AUTHENTICATION_INVALID'});
  }

  const group = data.groups.find(p => p.id === req.params.id);

  if (!group) {
    return res.status(400).send({error: 'GROUP_NOT_FOUND'});
  }

  if(!group.admin !== auth.id) {
    return res.status(404).send({error: 'AUTHORIZATION_INVALID'});
  }

  if (!req.body.description) {
    return res.status(400).send({error: 'BODY_FORMAT_INVALID'});
  }

  group.description = req.body.description;
  return res.status(200).send({}); // Someone forgot to implement returning of updated group. Oops!
})

app.post('/groups/', function (req, res) {
  if (!req.headers.authentication) {
    return res.status(404).send({error: 'AUTHENTICATION_REQUIRED'});
  }

  const auth = idpResolve(req.headers.authentication);

  if (!auth) {
    return res.status(404).send({error: 'AUTHENTICATION_INVALID'});
  }

  if (!req.body.name) {
    return res.status(400).send({error: 'BODY_FORMAT_INVALID'});
  }

  req.body.id = data.randomId();
  
  data.groups.push(req.body);
  return res.status(200).send({});
})

app.get('/people/list/:skip/:take', function (req, res) {
  const people = _.chain(data.people).drop(req.params.skip).take(req.params.take).value();
  
  return res.status(200).send({total: data.people.length, data: people});
})

app.get('/people/with-groups/:id', function (req, res) {
  const person = data.people.find(p => p.id === req.params.id);

  if(person) {
    const groups = data.groups.filter(g => g.members.indexOf(person.id) > -1).map(g => g.id);
    return res.status(200).send({data: Object.assign({}, person, { groups })});
  } else {
    return res.status(404).send({error: 'PERSON_NOT_FOUND'});
  }
})

app.get('/people/:id', function (req, res) {
  const person = data.people.find(p => p.id === req.params.id);

  if(person) {
    return res.status(200).send({data: person});
  } else {
    return res.status(404).send({error: 'PERSON_NOT_FOUND'});
  }
})

app.post('/people/:id/name-and-bio', function (req, res) {
  if (!req.headers.authentication) {
    return res.status(404).send({error: 'AUTHENTICATION_REQUIRED'});
  }

  const auth = idpResolve(req.headers.authentication);

  if (!auth) {
    return res.status(404).send({error: 'AUTHENTICATION_INVALID'});
  }

  const person = data.people.find(p => p.id === req.params.id);

  if(!person) {
    return res.status(404).send({error: 'PERSON_NOT_FOUND'});
  }

  if(!person.id !== auth.id) {
    return res.status(404).send({error: 'AUTHORIZATION_INVALID'});
  }

  if (!req.body.name) {
    return res.status(400).send({error: 'BODY_FORMAT_INVALID'});
  }

  if (!req.body.bio) {
    return res.status(400).send({error: 'BODY_FORMAT_INVALID'});
  }

  person.name = req.body.name;
  person.bio = req.body.bio;
  return res.status(200).send({data: person});
})

app.post('/login', function (req, res) {
  if (!req.body.username) {
    return res.status(400).send({error: 'BODY_FORMAT_INVALID'});
  }

  const person = data.people.find(p => p.username === req.body.username);

  if (!person) {
    return res.status(400).send({error: 'INVALID_USERNAME'});
  }

  return res.status(200).send({token: person.id});
})

app.listen(35987, function () {
  console.log('REST Api is listening on port 35987!')
})