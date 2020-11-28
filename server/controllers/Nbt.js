const models = require('../models');

const { Nbt } = models;

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

const getDownloadableNBTFile = (req, res) => Nbt.NbtModel.returnAllDataNamesForOwner(
  req.session.account._id,
  (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
    return res.json({ nbts: docs });
  },
);

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
module.exports.getDownloadableNBTFile = getDownloadableNBTFile;
module.exports.getNBTFile = getNBTFile;
module.exports.saveNBT = saveNBT;
module.exports.makerPage = makerPage;
module.exports.deleteNbt = deleteNbt;
