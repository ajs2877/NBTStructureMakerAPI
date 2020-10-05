const http = require('http');
const url = require('url');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

/*
example of how to use nbt from https://www.npmjs.com/package/nbt
docs: http://sjmulder.github.io/nbt-js/
*/

const port = process.env.PORT || process.env.NODE_PORT || 3000;

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
    '/getFileList': jsonHandler.getFileList,
    notFound: jsonHandler.notFound,
  },
  POST: {
    '/saveNBT': handlePost,
    notFound: jsonHandler.notFound,
  },
  HEAD: {
    '/getNBTFile': jsonHandler.getNBTFileMeta,
    '/getFileList': jsonHandler.getFileListMeta,
    notFound: jsonHandler.getFileMeta,
  },
  notFound: jsonHandler.notFound,
};

// function to handle requests
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  const resultFunction = urlStruct[request.method][parsedUrl.pathname];
  if (resultFunction) {
    if (resultFunction.length === 3) {
      resultFunction(request, response, parsedUrl);
    } else {
      resultFunction(request, response);
    }
  } else {
    urlStruct[request.method].notFound(request, response);
  }
};

http.createServer(onRequest).listen(port);
// console.log(`Listening on 127.0.0.1: ${port}`);
