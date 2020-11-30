const fs = require('fs');
const nbt = require('nbt');
const zlib = require('zlib');
const models = require('../models');

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

// This const and bytesToBase64 are needed to convert our binary data into a
// base64 string to send to the client to download as a file. Due to an unknown
// issue I am having, express keeps converting my binary data to utf8 strings and
// losing data in the process instead of sending straight binary. This base64
// encoding bypasses the issue and client side will decode it back to binary.
// https://stackoverflow.com/a/57111228
const base64abc = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/',
];

// https://stackoverflow.com/a/57111228
function bytesToBase64(bytes) {
  /* eslint-disable no-bitwise */
  let result = ''; let i; const
    l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
    result += base64abc[bytes[i] & 0x3F];
  }
  if (i === l + 1) { // 1 octet yet to write
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 0x03) << 4];
    result += '==';
  }
  if (i === l) { // 2 octets yet to write
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[(bytes[i - 1] & 0x0F) << 2];
    result += '=';
  }
  return result;
}

/// ////////////////////////////////////////////////////////////

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
          return res.json({ action: 'success!', task: 'save' });
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
  const unformattedData = req.body.structureBlocks.split(',');

  const { size } = req.body;
  const formattedData = [];
  for (let x = 0; x < size; x++) {
    const row = [];
    for (let z = 0; z < size; z++) {
      row.push(unformattedData[x * size + z]);
    }
    formattedData.push(row);
  }

  const rawdata = fs.readFileSync('nbt_files/base_template.nbt'); // We will use this as a template

  // nbt package needed to read and write from nbt files.
  return nbt.parse(rawdata, (error, dataResult) => {
    if (error) { throw error; }

    const data = dataResult;

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

    try {
      // Minecraft only parses nbt data that is compressed. Hence, the compression here lol
      const zipped = zlib.gzipSync(new Uint8Array(nbt.writeUncompressed(data)));

      // This encoding is needed to convert our binary data into a base64 string to
      // send to the client to download as a file. Due to an unknown issue I am having,
      // express keeps converting my binary data to utf8 strings and losing data in the
      // process instead of sending straight binary. This base64 encoding bypasses the
      // issue and client side will decode it back to binary.
      const stringEncoded = bytesToBase64(zipped);

      // EXPRESS, WHY CANT YOU JUST SEND BINARY DATA AS BINARY DATA LIKE I SPECIFY?!
      // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': stringEncoded.length,
        'Content-Transfer-Encoding': 'binary',
        'Content-disposition': `filename=${req.body.filename}.nbt`,
      });
      res.type('application/octet-stream');
      res.end(stringEncoded, 'binary'); // cursed
      return res;
    } catch (err) {
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
    return res.json({ action: 'success!', task: 'delete' });
  },
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
    const formattedData = [];
    for (let x = 0; x < docs[0].size; x++) {
      const row = [];
      for (let z = 0; z < docs[0].size; z++) {
        row.push(docs[0].data[x * docs[0].size + z]);
      }
      formattedData.push(row);
    }

    return res.json({ nbt: formattedData, size: docs[0].size, task: 'load' });
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
