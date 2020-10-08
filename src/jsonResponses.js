const { v4: uuidv4 } = require('uuid');
const query = require('querystring');
const database = require('./database.js');

/**
 * writes the header and sends the response to
 * the user along with the JSON payload.
 * Use this for payload responses.
 */
const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

/**
 * Sends only the header info. use this for meta responses.
 */
const respondJSONMeta = (request, response, status, headerInfo) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Learned Object.assign from https://stackoverflow.com/a/30871719
  if (headerInfo) {
    const headersFinal = { ...headers, ...headerInfo };
    response.writeHead(status, headersFinal);
    response.end();
    return;
  }

  response.writeHead(status, headers);
  response.end();
};

/**
 * Using the passed in UUID by query param,
 * will return the actual nbt file itself.
 */
const getDownloadableNBTFile = (request, response, parsedUrl) => {
  const params = query.parse(parsedUrl.query);
  if (params.uuid) {
    const file = database.returnNBTFile(params.uuid);

    if (file) {
      // Sending a full file to user: https://stackoverflow.com/a/21578563
      response.setHeader('Content-Length', file.size);
      response.setHeader('Content-Type', 'application/octet-stream'); // binary data MIME type: https://stackoverflow.com/a/6783972
      response.setHeader('Content-Disposition', `attachment; filename=${params.uuid}.nbt`);
      response.write(file.file, 'binary');
      response.end();
      return;
    }

    const responseJSON = {
      message: 'No file found with that uuid.',
    };

    respondJSON(request, response, 404, responseJSON);
    return;
  }

  const responseJSON = {
    message: 'Please select a file to load.',
  };

  respondJSON(request, response, 400, responseJSON);
};

/**
 * Using the passed in UUID by query param,
 * will return the size of the nbt file by header.
 */
const getDownloadableNBTFileMeta = (request, response, parsedUrl) => {
  const params = query.parse(parsedUrl.query);
  let responseJSON = {};

  if (params.uuid) {
    const file = database.returnNBTFile(params.uuid);

    if (file) {
      responseJSON = {
        'X-file-size': `${file.size}`,
      };

      return respondJSONMeta(request, response, 200, responseJSON);
    }

    responseJSON = {
      'X-database-error': 'No file found with that uuid',
    };
    return respondJSONMeta(request, response, 404, responseJSON);
  }

  responseJSON = {
    'X-database-error': 'Please pass in a uuid for a file to search for.',
  };
  return respondJSONMeta(request, response, 400, responseJSON);
};

/**
 * Using the passed in UUID by query param, crafts and
 * sends back the nbt data in a response.
 */
const getNBTFile = (request, response, parsedUrl) => {
  const params = query.parse(parsedUrl.query);
  if (params.uuid) {
    let responseJSON = {
      structureData: database.getStructure(params.uuid),
    };

    if (responseJSON.structureData) {
      return respondJSON(request, response, 200, responseJSON);
    }

    responseJSON = {
      message: 'No file found with that uuid.',
    };
    return respondJSON(request, response, 404, responseJSON);
  }

  const responseJSON = {
    message: 'Please select a file to load.',
  };
  return respondJSON(request, response, 400, responseJSON);
};

/**
 * Using the passed in UUID by query param, crafts and
 * sends back the size of the nbt data by header.
 */
const getNBTFileMeta = (request, response, parsedUrl) => {
  const params = query.parse(parsedUrl.query);
  if (params.uuid) {
    const structureObj = database.getStructure(params.uuid);
    let responseJSON = {
      'X-structure-dimensions': `${structureObj.length}, ${structureObj[0].length}`,
    };
    if (structureObj) {
      return respondJSONMeta(request, response, 200, responseJSON);
    }

    responseJSON = {
      'X-database-error': 'No file found with that uuid',
    };
    return respondJSONMeta(request, response, 404, responseJSON);
  }

  const responseJSON = {
    'X-database-error': 'Please pass in a uuid for a file to search for.',
  };
  return respondJSONMeta(request, response, 400, responseJSON);
};

/**
 * Will return a list of all UUIDs except for the template file's as a response.
 */
const getFileList = (request, response) => {
  const responseJSON = {
    uuids: database.getAllStructureUUIDs().filter((uuid) => uuid !== 'base_template'),
  };
  return respondJSON(request, response, 200, responseJSON);
};

/**
 * Will return how many usable UUIDs there are
 * minus the template file's through header.
 */
const getFileListMeta = (request, response) => {
  const responseJSON = {
    'X-files-avaliable': `${database.getAllStructureUUIDs().filter((uuid) => uuid !== 'base_template').length}`,
  };
  respondJSONMeta(request, response, 200, responseJSON);
};

/**
 * Sneaky Little Hobbitses...
 * How did they get here???
 *
 * Nevertheless, they just got 404'ed!
 */
const notFound = (request, response) => {
  const responseJSON = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  respondJSON(request, response, 404, responseJSON);
};

/**
 * Sneaky Little Hobbitses...
 * How did they get here???
 *
 * Nevertheless, they just got 404'ed!
 */
const notFoundMeta = (request, response) => {
  respondJSONMeta(request, response, 404);
};

/**
 * Will take the payload out of the body (the nbt data) and
 * will save it locally and then to an actual nbt file.
 * If file existed locally or physically, it will be overwritten.
 */
const saveToNBT = (request, response, body) => {
  const responseJSON = {
    message: 'Structure data required',
  };

  // validate the payload
  if (!body.structureBlocks) {
    responseJSON.id = 'missing structureBody parameter';
    return respondJSON(request, response, 400, responseJSON);
  }
  if (!body.size) {
    responseJSON.id = 'missing size parameter';
    return respondJSON(request, response, 400, responseJSON);
  }

  // new id for structure if no uuid is passed in
  let uuid = uuidv4();
  if (body.uuid) {
    uuid = body.uuid;
  }

  // if a new structure was made, set the response code to state that
  let responseCode = 204;
  if (database.createNewStructure(uuid, body.size)) {
    responseCode = 201;
  }

  // Data is now set on server
  database.overwriteStructure(uuid, body.structureBlocks);
  database.saveToFile(uuid);

  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully!';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  // No need to change message for updating as code 204
  // will automatically not return the response text
  return respondJSON(request, response, responseCode, responseJSON);
};

// set public modules
module.exports = {
  getNBTFile,
  getNBTFileMeta,
  getFileList,
  getFileListMeta,
  getDownloadableNBTFile,
  getDownloadableNBTFileMeta,
  notFound,
  notFoundMeta,
  saveToNBT,
};
