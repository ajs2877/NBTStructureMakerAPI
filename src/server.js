const http = require('http');
const url = require('url');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

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

    jsonHandler.addUser(request, response, bodyParams);
  });
};

const urlStruct = {
  GET: {
    '/': htmlHandler.getIndex,
    '/style.css': htmlHandler.getCSS,
    '/index.js': htmlHandler.getIndexJavascript,
    '/xhr.js': htmlHandler.getXHRJavascript,
    '/getUsers': jsonHandler.getUsers,
    '/updateUser': jsonHandler.updateUser,
    notFound: jsonHandler.notFound,
  },
  POST: {
    '/addUser': handlePost,
    notFound: jsonHandler.notFound,
  },
  HEAD: {
    '/getUsers': jsonHandler.getUsersMeta,
    notFound: jsonHandler.getUsersMeta,
  },
  notFound: jsonHandler.notFound,
};

// function to handle requests
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  if (urlStruct[request.method][parsedUrl.pathname]) {
    urlStruct[request.method][parsedUrl.pathname](request, response);
  } else {
    urlStruct[request.method].notFound(request, response);
  }
};

http.createServer(onRequest).listen(port);
console.log(`Listening on 127.0.0.1: ${port}`);
