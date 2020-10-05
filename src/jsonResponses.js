const database = require('./database.js');
const { v4: uuidv4 } = require('uuid');
const query = require('querystring');

const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

const respondJSONMeta = (request, response, status, headerInfo) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  //https://stackoverflow.com/a/30871719
  if(headerInfo){
    const headersFinal = Object.assign({}, headers, headerInfo);
    response.writeHead(status, headersFinal);
    response.end();
    return;
  }

  response.writeHead(status, headers);
  response.end();
};



const getNBTFile = (request, response, parsedUrl) => {
  const params = query.parse(parsedUrl.query);
  if(params.uuid){

    let responseJSON = {
      structureData: database.getStructure(params.uuid)
    }

    if(Object.keys(responseJSON.structureData).length !== 0){
      return respondJSON(request, response, 200, responseJSON);
    }

    responseJSON = {
      message : "No file found with that uuid"
    };
    return respondJSON(request, response, 404, responseJSON);
  }
  else{
    const responseJSON = {
      message : "Please pass in a uuid for a file to search for."
    };
    return respondJSON(request, response, 400, responseJSON);
  }
};


const getNBTFileMeta = (request, response, parsedUrl) => {
  
  const params = query.parse(parsedUrl.query);
  if(params.uuid){
    const structureObj = database.getStructure(params.uuid);
    let responseJSON = {
      "X-structure-dimensions": `${structureObj.length}, ${structureObj[0].length}`
    };
    if(Object.keys(structureObj).length !== 0){
      return respondJSONMeta(request, response, 200, responseJSON);
    }

    responseJSON = {
      "X-database-error": "No file found with that uuid"
    };
    return respondJSONMeta(request, response, 404, responseJSON);
  }
  else{
    const responseJSON = {
      "X-database-error": "Please pass in a uuid for a file to search for."
    };
    respondJSONMeta(request, response, 400, responseJSON);
  }
};



const getFileList = (request, response) => {
  const responseJSON = {
    message: `List of avaliable files successfully retrieved}`,
    uuids: database.getAllStructureUUIDs()
  };
  return respondJSON(request, response, 200, responseJSON);
};

// returns only header
const getFileListMeta = (request, response) => {
  const responseJSON = {
    "X-files-avaliable": `${database.getAllStructureUUIDs().length}`
  };
  respondJSONMeta(request, response, 201, responseJSON);
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

  // if a new structure was made, set the response to state that
  let responseCode = 204;
  if (database.createNewStructure(uuid, body.size)) {
    responseCode = 201;
  }
  
  database.overwriteStructure(uuid, body.size, body.structureBlocks);
  database.saveToFile(uuid, body.size);


  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully!';
    return respondJSON(request, response, responseCode, responseJSON);
  }
  else{
    responseJSON.message = 'Updated Successfully!';
    return respondJSON(request, response, responseCode, responseJSON);
  }
};

// set public modules
module.exports = {
  getNBTFile,
  getNBTFileMeta,
  getFileList,
  getFileListMeta,
  notFound,
  notFoundMeta,
  saveToNBT,
};
