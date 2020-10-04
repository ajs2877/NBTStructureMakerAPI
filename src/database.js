const { v4: uuidv4 } = require('uuid');
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
    for (let i = 0; i < size; i++) {
      savedStructures[uuid].push([]);
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
  
  fs.readdir("nbt_files", function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile("nbt_files" + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
        nbt.parse(rawdata, (error, data) => {
          if (error) { throw error; }

          createNewStructure(filename, data.value.size.value[0]);
      
          for (let blockObj in data.value.blocks.value.value) {
            blockId = blockObj.state.value.value;
            blockPos = blockObj.pos.value.value.value.value;
            savedStructures[filename][blockPos[0]][blockPos[2]] = blockId
          }
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
  loadFromFile
};
