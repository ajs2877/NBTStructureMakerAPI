const path = require('path');
const fs = require('fs');
const nbt = require('nbt');

// Temp storage of users. Cleared on reboots on server
const savedStructures = {};
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


const createNewStructure = (uuid, size) => {
  if(!savedStructures[uuid]){
    savedStructures[uuid] = [];
    for (let x = 0; x < size; x++) {
      savedStructures[uuid].push([]);
      for (let z = 0; z < size; z++) {
        savedStructures[uuid][x][z] = -1;
      }
    }
    return true;
  }
  return false;
}

const overwriteStructure = (uuid, size, structureBlocks) => {
  if(savedStructures[uuid]){
    const blockArray = structureBlocks.split(',');
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        savedStructures[uuid][x][z] = blockArray[x * size + z];
      }
    }
    return true;
  }
  return false;
}

const getStructure = (uuid) => {
  if(savedStructures[uuid]){
    return savedStructures[uuid];
  }
  return {};
}

const saveToFile = (uuid, size) => {
  // blockPalette
  // Create and save to nbt file
  const rawdata = fs.readFileSync('nbt_files/base_template.nbt'); // We will use this as a template
  nbt.parse(rawdata, (error, data) => {
    if (error) { throw error; }

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
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

    fs.writeFileSync(`nbt_files/${uuid}.nbt`, new Uint8Array(nbt.writeUncompressed(data)));
  });
};

const loadFromFile = () => {
  
  // https://stackoverflow.com/a/10049704
  fs.readdir("nbt_files", function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile("nbt_files/" + filename, function(err, content) {
        if (err) {
          onError(err);
          return;
        }

        const uuid = path.parse(filename).name;

        nbt.parse(content, (error, data) => {
          if (error) { throw error; }

          createNewStructure(uuid, data.value.size.value.value[0]);
      
          data.value.blocks.value.value.forEach(blockObj =>{
            blockId = blockObj.state.value;
            blockPos = blockObj.pos.value.value;
            savedStructures[uuid][blockPos[0]][blockPos[2]] = blockId
          });
        });
      });
    });
  });
}
loadFromFile(); // load immediately at startup

// set public modules
module.exports = {
  createNewStructure,
  overwriteStructure,
  saveToFile,
  loadFromFile,
  getStructure
};
