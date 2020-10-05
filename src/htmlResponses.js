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
const bricks = fs.readFileSync(`${__dirname}/../images/bricks.jpg`);
const crying_obsidian = fs.readFileSync(`${__dirname}/../images/crying_obsidian.jpg`);
const dirt = fs.readFileSync(`${__dirname}/../images/dirt.jpg`);
const glass = fs.readFileSync(`${__dirname}/../images/glass.jpg`);
const honeycomb_block = fs.readFileSync(`${__dirname}/../images/honeycomb_block.jpg`);
const oak_planks = fs.readFileSync(`${__dirname}/../images/oak_planks.jpg`);
const prismarine = fs.readFileSync(`${__dirname}/../images/prismarine.jpg`);
const stone_bricks = fs.readFileSync(`${__dirname}/../images/stone_bricks.jpg`);
const stone = fs.readFileSync(`${__dirname}/../images/stone.jpg`);
const air = fs.readFileSync(`${__dirname}/../images/air.jpg`);

const fileStruct = {
  '/': { type: 'text/html', page: index },
  '/style.css': { type: 'text/css', page: css },
  '/index.js': { type: 'text/javascript', page: js },
  '/xhr.js': { type: 'text/javascript', page: xhr },
  '/ui.js': { type: 'text/javascript', page: ui },
  '/images/bricks.jpg': { type: 'image/jpeg', page: bricks },
  '/images/crying_obsidian.jpg': { type: 'image/jpeg', page: crying_obsidian },
  '/images/dirt.jpg': { type: 'image/jpeg', page: dirt },
  '/images/glass.jpg': { type: 'image/jpeg', page: glass },
  '/images/honeycomb_block.jpg': { type: 'image/jpeg', page: honeycomb_block },
  '/images/oak_planks.jpg': { type: 'image/jpeg', page: oak_planks },
  '/images/prismarine.jpg': { type: 'image/jpeg', page: prismarine },
  '/images/stone_bricks.jpg': { type: 'image/jpeg', page: stone_bricks },
  '/images/stone.jpg': { type: 'image/jpeg', page: stone },
  '/images/air.jpg': { type: 'image/jpeg', page: air },
};

// function to get the index page
const getPage = (request, response, parsedUrl) => {
  const file = parsedUrl.pathname;
  response.writeHead(200, { 'Content-Type': fileStruct[file].type });
  response.write(fileStruct[file].page);
  response.end();
};

// set out public exports
module.exports = {
  getPage,
};
