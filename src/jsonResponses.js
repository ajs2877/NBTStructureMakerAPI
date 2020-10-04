const database = require('./database.js');
const fs = require('fs');
const nbt = require('nbt');

// Temp storage of users. Cleared on reboots on server
const savedStructures = {};

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
  };

  return respondJSON(request, response, 200, responseJSON);
};

// returns only header
const getUsersMeta = (request, response) => respondJSONMeta(request, response, 200);

// overwrite a save
const updateUser = (request, response, uuid) => {
  const newUser = {
    uuid: uuidv4(),
  };

  if(database.overwriteStructure(uuid, body.size, body.structureBlocks)){

  }

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

const saveToNBT = (request, response, body) => {
  const responseJSON = {
    message: 'Structure data required',
  };

  if (!body.structureBlocks) {
    responseJSON.id = 'missing structureBody parameter';
    return respondJSON(request, response, 400, responseJSON);
  }
  if (!body.size) {
    responseJSON.id = 'missing size parameter';
    return respondJSON(request, response, 400, responseJSON);
  }
  
  // new id for structure if no uuid is passed in
  const uuid = uuidv4(); 
  if (body.uuid) {
    uuid = body.uuid;
  }

  let responseCode = 204;

  // if a new structure was made, set the response to state that
  if (database.createNewStructure(uuid, body.size)) {
    responseCode = 201;
  }
  
  // Creature Structure in temp memory
  database.overwriteStructure(uuid, body.size, body.structureBlocks);

  // blockPalette
  // Create and save to nbt file
  database.saveToFile(uuid, body.size);


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
  saveToNBT,
};
