const http = require('http');
const url = require('url');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

/**
 * Used for saving user sent nbt data to server's local and file storage.
 *
 * Must be declared above urlStruct or else urlStruct crashes.
 * Maybe this should be moved to jsonHandler...
 */
const handlePost = (request, response) => {
  const body = [];

  request.on('error', () => {
    response.statusCode = 400;
    response.end();
  });

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    jsonHandler.saveToNBT(request, response, bodyParams);
  });
};

// handles what url calls what method.
const urlStruct = {
  GET: {
    '/': htmlHandler.getPage,
    '/style.css': htmlHandler.getPage,
    '/index.js': htmlHandler.getPage,
    '/xhr.js': htmlHandler.getPage,
    '/ui.js': htmlHandler.getPage,
    '/images/bricks.jpg': htmlHandler.getPage,
    '/images/crying_obsidian.jpg': htmlHandler.getPage,
    '/images/dirt.jpg': htmlHandler.getPage,
    '/images/glass.jpg': htmlHandler.getPage,
    '/images/honeycomb_block.jpg': htmlHandler.getPage,
    '/images/oak_planks.jpg': htmlHandler.getPage,
    '/images/prismarine.jpg': htmlHandler.getPage,
    '/images/stone_bricks.jpg': htmlHandler.getPage,
    '/images/stone.jpg': htmlHandler.getPage,
    '/images/air.jpg': htmlHandler.getPage,
    '/getNBTFile': jsonHandler.getNBTFile,
    '/getDownloadableNBTFile': jsonHandler.getDownloadableNBTFile,
    '/getFileList': jsonHandler.getFileList,
    notFound: jsonHandler.notFound,
  },
  POST: {
    '/saveNBT': handlePost,
    notFound: jsonHandler.notFound,
  },
  HEAD: {
    '/getNBTFile': jsonHandler.getNBTFileMeta,
    '/getDownloadableNBTFile': jsonHandler.getDownloadableNBTFileMeta,
    '/getFileList': jsonHandler.getFileListMeta,
    notFound: jsonHandler.notFound,
  },
  notFound: jsonHandler.notFound,
};

/**
 * Takes the incoming request url and triggers the
 * correct method to handle the request
 */
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  const resultFunction = urlStruct[request.method][parsedUrl.pathname];
  if (resultFunction) {
    // Detects if the method requires a parsedUrl param
    if (resultFunction.length === 3) {
      resultFunction(request, response, parsedUrl);
    } else {
      resultFunction(request, response);
    }
  } else {
    urlStruct[request.method].notFound(request, response);
  }
};

// Opens up the server connection
http.createServer(onRequest).listen(port);
// console.log(`Listening on 127.0.0.1: ${port}`);
