const models = require('../models');
const fs = require('fs');
const nbt = require('nbt');
const zlib = require('zlib');
const stream = require('stream');

const { Nbt } = models;

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

const makerPage = (req, res) => res.render('app', {
  csrfToken: req.csrfToken(),
});

const saveNBT = (req, res) => {

  if (!req.body.filename || !req.body.size || !req.body.structureBlocks) {
    return res.status(400).json({
      error: 'File name, size, and structureBlocks are required',
    });
  }

  const nbtData = {
    filename: req.body.filename,
    size: req.body.size,
    data: req.body.structureBlocks.split(','),
    owner: req.session.account._id,
  };

  return Nbt.NbtModel.returnDataForOwner(req.session.account._id, nbtData.filename, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    // update existing file
    if (docs.length !== 0) {
      return Nbt.NbtModel.updateOne(
        { _id: docs[0]._id },
        { $set: { size: nbtData.size, data: nbtData.data } },
        (err2) => {
          if (err2) {
            console.log(err2);
            return res.status(400).json({ error: 'An error occurred' });
          }
          return res.json({ action: 'success!', task: 'save'});
        },
      );
    }

    // create new entry as file didn't exist

    const newNbt = new Nbt.NbtModel(nbtData);
    const nbtPromise = newNbt.save();

    nbtPromise.then(() => res.json({
      action: 'success!',
      task: 'save',
    }));

    nbtPromise.catch((err2) => {
      console.log(err2);

      return res.status(400).json({
        error: 'An error occurred',
      });
    });

    return nbtPromise;
  });
};

const downloadNBTFile = (req, res) => {
  
  if (!req.body.filename || !req.body.size || !req.body.structureBlocks) {
    return res.status(400).json({
      error: 'File name, size, and structureBlocks are required',
    });
  }

  // format it as a 2D array for the client side to parse easier
  let unformattedData = req.body.structureBlocks.split(',');

  let size = req.body.size;
  let formattedData = [];
  for(let x = 0; x < size; x++){
    let row = [];
    for(let z = 0; z < size; z++){
      row.push(unformattedData[x * size + z ]);
    }
    formattedData.push(row);
  }

  const rawdata = fs.readFileSync('nbt_files/base_template.nbt'); // We will use this as a template

  // nbt package needed to read and write from nbt files.
  nbt.parse(rawdata, (error, data) => {
    if (error) { throw error; }

    data.value.size.value.value[0] = size;
    data.value.size.value.value[1] = 1;
    data.value.size.value.value[2] = size;

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        // Adds the block entry to the data being saved.
        // The palette is so that minecraft knows what block it is.
        if (blockPalette[formattedData[x][z]] !== -1) {
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
              value: blockPalette[formattedData[x][z]],
            },
          });
        }
      }
    }

    // File name are the UUIDs
    try {
      const zipped = zlib.gzipSync(new Uint8Array(nbt.writeUncompressed(data)));
      fs.writeFileSync(`nbt_files/testzipped.nbt`, zipped); // testing. File is perfect when saved locally.
  
      // Stream is a more effcient and easier way to send files to client
      // https://stackoverflow.com/a/45922316
      let readStream = new stream.PassThrough();
      readStream.end(zipped);
      res.setHeader('Content-Length', Buffer.byteLength(zipped)); 
      res.set('Content-disposition', `attachment; filename=${req.body.filename}.nbt`);
      res.set('Content-Type', 'application/octet-stream');     
      readStream.pipe(res);
      return;
    } 
    catch (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
  });
};

const deleteNbt = (req, res) => Nbt.NbtModel.deleteFileFromowner(
  req.session.account._id,
  req.query.nbt_file, 
  (err2) => {
    if (err2) {
      console.log(err2);
      return res.status(400).json({ error: 'An error occurred' });
    }
    return res.json({ action: 'success!', task: "delete" });
  }
);

const getNBTFile = (req, res) => Nbt.NbtModel.returnDataForOwner(
  req.session.account._id,
  req.query.nbt_file, 
  (err, docs) => {

    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
    // format it as a 2D array for the client side to parse easier
    let formattedData = [];
    for(let x = 0; x < docs[0].size; x++){
      let row = [];
      for(let z = 0; z < docs[0].size; z++){
        row.push(docs[0].data[x * docs[0].size + z ]);
      }
      formattedData.push(row);
    }

    return res.json({ nbt: formattedData, size: docs[0].size, task: "load" });
  },
);

const getFileList = (request, response) => {
  const req = request;
  const res = response;

  Nbt.NbtModel.returnAllDataNamesForOwner(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);

      return res.status(400).json({
        error: 'An error occurred',
      });
    }

    return res.json({
      csrfToken: req.csrfToken(),
      nbts: docs,
    });
  });
};

module.exports.getFileList = getFileList;
module.exports.downloadNBTFile = downloadNBTFile;
module.exports.getNBTFile = getNBTFile;
module.exports.saveNBT = saveNBT;
module.exports.makerPage = makerPage;
module.exports.deleteNbt = deleteNbt;
