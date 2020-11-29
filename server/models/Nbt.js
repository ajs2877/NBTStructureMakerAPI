const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const _ = require('underscore');

let NbtModel = {};

// mongoose.Types.ObjectID is a function that
// converts string ID to real mongo ID
const convertId = mongoose.Types.ObjectId;
const setName = (name) => _.escape(name).trim();

const NbtSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },
  size: {
    type: Number,
    required: true,
  },
  data: [{
    type: String,
  }],
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  createdData: {
    type: Date,
    default: Date.now,
  },
});

NbtSchema.statics.toAPI = (doc) => ({
  filename: doc.filename,
  size: doc.size,
  data: doc.data,
});

NbtSchema.statics.returnAllDataNamesForOwner = (ownerId, callback) => {
  const search = {
    owner: convertId(ownerId),
  };

  return NbtModel.find(search).select('filename').lean().exec(callback);
};

NbtSchema.statics.returnDataForOwner = (ownerId, nameIn, callback) => {
  const search = {
    owner: convertId(ownerId),
    filename: nameIn,
  };

  return NbtModel.find(search).select('size data').lean().exec(callback);
};

NbtSchema.statics.deleteFileFromowner = (ownerId, nameIn, callback) => {
  const search = {
    owner: convertId(ownerId),
    filename: nameIn,
  };

  return NbtModel.deleteOne(search, callback);
};

NbtModel = mongoose.model('Nbt', NbtSchema);

module.exports.NbtModel = NbtModel;
module.exports.NbtSchema = NbtSchema;
