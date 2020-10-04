const http = require('http');
const url = require('url');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

/*
example of how to use nbt from https://www.npmjs.com/package/nbt
docs: http://sjmulder.github.io/nbt-js/
*/

// var data = fs.readFileSync('nbt_files/test.nbt');
// nbt.parse(data, function(error, data) {
//     if (error) { throw error; }
//     console.log(data);
// });

/*
Output:
{
  name: '',
  value: {
    size: { type: 'list', value: [Object] },       // do not touch
    entities: { type: 'list', value: [Object] },  // do not touch
    blocks: { type: 'list', value: [Object] },   // add/remove blocks here
    palette: { type: 'list', value: [Object] }, // do not touch
    DataVersion: { type: 'int', value: 2580 }  // do not touch
  }
}

allowed blocks:

0 minecraft:dirt
1 minecraft:stone
2 minecraft:oak_planks
3 minecraft:glass
4 minecraft:bricks
5 minecraft:stone_bricks
6 minecraft:prismarine
7 minecraft:crying_obsidian
8 minecraft:honeycomb_block

*/

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handlePost = (request, response) => {
  const body = [];

  request.on('error', (err) => {
    response.statusCode = 400;
    console.log(err);
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
      resultFunction(request, response, parsedUrl.pathname);
    } else {
      resultFunction(request, response);
    }
  } else {
    urlStruct[request.method].notFound(request, response);
  }
};

http.createServer(onRequest).listen(port);
console.log(`Listening on 127.0.0.1: ${port}`);
