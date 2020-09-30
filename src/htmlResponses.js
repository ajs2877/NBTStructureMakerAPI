const fs = require('fs'); // pull in the file system module

// load files into memory
// This is a synchronous operation, so you'd only
// want to do it on startup.
// This not the best way to load files unless you have few files.
const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const js = fs.readFileSync(`${__dirname}/../client/index.js`);
const xhr = fs.readFileSync(`${__dirname}/../client/xhr.js`);
const ui = fs.readFileSync(`${__dirname}/../client/ui.js`);


const fileStruct = {
  '/': {'type':'text/html', 'page':index},
  '/style.css': {'type':'text/css', 'page':css},
  '/index.js': {'type':'text/javascript', 'page':js},
  '/xhr.js': {'type':'text/javascript', 'page':xhr},
  '/ui.js': {'type':'text/javascript', 'page':ui}
};


// function to get the index page
const getPage = (request, response, file) => {
  response.writeHead(200, { 'Content-Type': fileStruct[file]['type'] });
  response.write(fileStruct[file]['page']);
  response.end();
};

// set out public exports
module.exports = {
  getPage
};
