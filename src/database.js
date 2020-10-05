const path = require('path');
const fs = require('fs');
const nbt = require('nbt');
/*
nbt package: https://www.npmjs.com/package/nbt
nbt package docs: http://sjmulder.github.io/nbt-js/
*/

// Store the nbt data locally. Might be best to move it entirely to 
// just be reading from and writing to actual files instead of loading to RAM.
const savedStructures = {};

// Block IDs to their numeric IDs. 
// Must match the palette in base_template.nbt file. (Use NBTExplorer to view the file)
const blockPalette = {
  air: -1,
  dirt: 0,
  stone: 1,
  oak_planks: 2,
  glass: 3,
  bricks: 4,
  stone_bricks: 5,
  prismarine: 6,
  crying_obsidian: 7,
  honeycomb_block: 8,
};

/**
 * Creates a new nbt data locally if one doesn't exist.
 * Otherwise, returns false to show failure to create.
 * 
 * @param {*} uuid file id
 * @param {*} size length of one side (assumed to be square)
 */
const createNewStructure = (uuid, size) => {
  if (!savedStructures[uuid]) {
    savedStructures[uuid] = [];
    for (let x = 0; x < size; x++) {
      savedStructures[uuid].push([]);
      for (let z = 0; z < size; z++) {
        savedStructures[uuid][x][z] = 'air';
      }
    }
    return true;
  }
  return false;
};

/**
 * Helper method to turn an array into a 2D array for me.
 * Very useful!
 * 
 * https://stackoverflow.com/a/44946686
 */
const TwoDimensional = (arr, size) => {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
};

/**
 * Will replace the local nbt data with the passed in one.
 * If the local data doesn't exist, returns false to signal failure to overwrite.
 * 
 * @param {*} uuid file id
 * @param {*} structureBlocks nbt data to save 
 */
const overwriteStructure = (uuid, structureBlocks) => {
  if (savedStructures[uuid]) {
    const blockArray = structureBlocks.split(',');
    savedStructures[uuid] = TwoDimensional(blockArray, Math.sqrt(blockArray.length));
    return true;
  }
  return false;
};

/**
 * Returns the nbt data if found. Otherwise, returns an empty object.
 * 
 * @param {*} uuid file id
 */
const getStructure = (uuid) => {
  if (savedStructures[uuid]) {
    return savedStructures[uuid];
  }
  return {};
};

/**
 * Creates an array of all the local nbt data's UUIDs.
 * Note: base_template is also included. Filter it out afterwards if 
 * that file is to remain hidden from end users.
 */
const getAllStructureUUIDs = () => Array.from(Object.keys(savedStructures));

/**
 * Will save the specified local nbt data into an 
 * actual nbt file that persists across server reloads.
 * 
 * @param {*} uuid file id 
 */
const saveToFile = (uuid) => {

  const rawdata = fs.readFileSync('nbt_files/base_template.nbt'); // We will use this as a template
  
  // nbt package needed to read and write from nbt files.
  nbt.parse(rawdata, (error, data) => {
    if (error) { throw error; }

    for (let x = 0; x < savedStructures[uuid].length; x++) {
      for (let z = 0; z < savedStructures[uuid][0].length; z++) {
        // Adds the block entry to the data being saved.
        // The palette is so that minecraft knows what block it is.
        if (blockPalette[savedStructures[uuid][x][z]] !== -1) {
          data.value.blocks.value.value.push({
            pos: {
              type: 'list',
              value: {
                type: 'int',
                value: [x, 0, z],
              },
            },
            state: {
              type: 'int',
              value: blockPalette[savedStructures[uuid][x][z]],
            },
          });
        }
      }
    }

    // File name are the UUIDs
    fs.writeFileSync(`nbt_files/${uuid}.nbt`, new Uint8Array(nbt.writeUncompressed(data)));
  });
};

/**
 * Loads all the nbt data to local storage from all the nbt files in the nbt_file directory.
 */
const loadFromFile = () => {
  // How to open all files in a directory: https://stackoverflow.com/a/10049704
  fs.readdir('nbt_files', (err, filenames) => {
    if (err) {
      return;
    }

    filenames.forEach((filename) => {
      fs.readFile(`nbt_files/${filename}`, (err2, content) => {
        if (err2) {
          return;
        }

        // File name are the UUIDs
        const uuid = path.parse(filename).name;

        nbt.parse(content, (error, data) => {
          if (error) { throw error; }

          // Makes new blank nbt data array to fill after 
          createNewStructure(uuid, data.value.size.value.value[0]);

          // Mega cursed. Parses the nbt format to pull out 
          // the block's numeric ID (we convert it to block name)
          // and get the position of the block.
          data.value.blocks.value.value.forEach((blockObj) => {
            const blockId = blockObj.state.value;
            const blockPos = blockObj.pos.value.value;

            // Sanity checks
            if (!savedStructures[uuid]) {
              savedStructures[uuid] = [];
            }
            if (!savedStructures[uuid][blockPos[0]]) {
              savedStructures[uuid][blockPos[0]] = [];
            }

            // A bimap would be more ideal for this instead of an object palette.
            let blockName = 'air';
            const keys = Object.keys(blockPalette);
            for (let index = 0; index < keys.length; index++) {
              if (blockPalette[keys[index]] === blockId) {
                blockName = keys[index];
                break;
              }
            }

            // Finally, we save the block entry to local nbt data
            savedStructures[uuid][blockPos[0]][blockPos[2]] = blockName;
          });
        });
      });
    });
  });
};
loadFromFile(); // load immediately at startup

// set public modules
module.exports = {
  createNewStructure,
  overwriteStructure,
  saveToFile,
  loadFromFile,
  getStructure,
  getAllStructureUUIDs,
};
