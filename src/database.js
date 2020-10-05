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
        savedStructures[uuid][x][z] = "air";
      }
    }
    return true;
  }
  return false;
}

//https://stackoverflow.com/a/44946686
const TwoDimensional = (arr, size) => {
  var res = []; 
  for(var i=0;i < arr.length;i = i+size)
  res.push(arr.slice(i,i+size));
  return res;
}

const overwriteStructure = (uuid, structureBlocks) => {
  if(savedStructures[uuid]){
    let blockArray = structureBlocks.split(',');
    savedStructures[uuid] = TwoDimensional(blockArray, Math.sqrt(blockArray.length));
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

const getAllStructureUUIDs = () => {
  return Array.from(Object.keys(savedStructures));
}

const saveToFile = (uuid) => {
  // blockPalette
  // Create and save to nbt file
  const rawdata = fs.readFileSync('nbt_files/base_template.nbt'); // We will use this as a template
  nbt.parse(rawdata, (error, data) => {
    if (error) { throw error; }

    for (let x = 0; x < savedStructures[uuid].length; x++) {
      for (let z = 0; z < savedStructures[uuid][0].length; z++) {
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
            if(!savedStructures[uuid]){
              savedStructures[uuid] = [];
            }
            if(!savedStructures[uuid][blockPos[0]]){
              savedStructures[uuid][blockPos[0]] = [];
            }
            let blockName = "air";
            for(let name of Object.keys(blockPalette)){
              if(blockPalette[name] === blockId){
                blockName = name;
                break;
              }
            }
            savedStructures[uuid][blockPos[0]][blockPos[2]] = blockName;
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
  getStructure,
  getAllStructureUUIDs
};
