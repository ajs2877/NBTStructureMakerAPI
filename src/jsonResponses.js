const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const nbt = require('nbt');

// Temp storage of users. Cleared on reboots on server
const savedStructures = {};
const blockPalette = {
  "air": -1,
  "dirt": 0,
  "stone": 1,
  "oak_planks": 2,
  "glass": 3,
  "bricks": 4,
  "stone_bricks": 5,
  "prismarine": 6,
  "crying_obsidian": 7,
  "honeycomb_block": 8
}

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
    users: savedStructures,
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

  savedStructures[newUser.uuid] = newUser;

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
    message: 'Name and age are both required',
  };

  if (!body.structureBlocks) {
    responseJSON.id = 'missing structureBody parameter';
    return respondJSON(request, response, 400, responseJSON);
  }
  else if (!body.size) {
    responseJSON.id = 'missing size parameter';
    return respondJSON(request, response, 400, responseJSON);
  }

  let responseCode = 204;
  let uuid = uuidv4(); //new id for structure

  if (!savedStructures[uuid]) {
    responseCode = 201;
    savedStructures[uuid] = [];
    for(let i = 0; i < body.size; i++){
      savedStructures[uuid].push([]);
    }
  }
  
  // Creature Structure in temp memory
  let blockArray = body.structureBlocks.split(',');
  for(let x = 0; x < body.size; x++){
    for(let z = 0; z < body.size; z++){
      savedStructures[uuid][x][z] = blockArray[x * body.size + z];
    }
  }

  // blockPalette
  // Create and save to nbt file
  let data = fs.readFileSync('nbt_files/base_template.nbt'); // We will use this as a template
  nbt.parse(data, function(error, data) {
      if (error) { throw error; }

      for(let x = 0; x < body.size; x++){
        for(let z = 0; z < body.size; z++){
          if(blockPalette[savedStructures[uuid][x][z]] !== -1){
            data.value['blocks'].value.value.push({
              pos: {
                'type': 'list',
                'value': {
                  'type': 'int',
                  'value': [x, 0, z]
                }
              },
              state: {
                'type': 'int',
                'value': blockPalette[savedStructures[uuid][x][z]]
              }
            });
          }
        }
      }
      
      fs.writeFileSync(`nbt_files/${uuid}.nbt`, new Uint8Array(nbt.writeUncompressed(data)));
  });


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
