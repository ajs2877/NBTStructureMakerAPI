const { v4: uuidv4 } = require('uuid');

// Temp storage of users. Cleared on reboots on server
const users = {};

const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

// Send only header
const respondJSONMeta = (request, response, status) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  response.writeHead(status, headers);
  response.end();
};

const getUsers = (request, response) => {
  const responseJSON = {
    users,
  };

  return respondJSON(request, response, 200, responseJSON);
};

// returns only header
const getUsersMeta = (request, response) => respondJSONMeta(request, response, 200);

// function just to update a user info
const updateUser = (request, response) => {
  const newUser = {
    uuid: uuidv4(),
  };

  users[newUser.uuid] = newUser;

  // return a 201 created status
  return respondJSON(request, response, 201, newUser);
};

const notFound = (request, response) => {
  const responseJSON = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  respondJSON(request, response, 404, responseJSON);
};

// return header
const notFoundMeta = (request, response) => {
  respondJSONMeta(request, response, 404);
};

const addUser = (request, response, body) => {
  const responseJSON = {
    message: 'Name and age are both required',
  };

  if (!body.name || !body.age) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  let responseCode = 201;
  let uuid = uuidv4();

  Object.keys(users).forEach((key) => {
    if (users[key].name === body.name) {
      responseCode = 204;
      uuid = key;
    }
  });

  if (responseCode !== 204) {
    users[uuid] = {};
    users[uuid].name = body.name;
  }

  users[uuid].age = body.age;

  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully!';
    return respondJSON(request, response, responseCode, responseJSON);
  }
  if (responseCode === 204) {
    responseJSON.message = 'Updated Successfully!';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

// set public modules
module.exports = {
  getUsers,
  getUsersMeta,
  updateUser,
  notFound,
  notFoundMeta,
  addUser,
};
