var mongoose = require('mongoose');

var organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true },
  Location: {
        address: { type: String, default: '' }
      , latitude: { type: Number  }
      , longitude: { type: Number }
      },
  phoneNumber: { type: String, lowercase: true },
  website: { type: String, default: '' },
  twitter: { type: String, default: '' },
  facebook: { type: String, default: '' },
  logo: { type: String, default: '' },
  parentOrganization: { type: String, default: '' },
  yearFounded: {type: Number,  min: 1800, max: 2100},
  description: {type: String, default: ''},
  active: {type: Boolean, default: false},
  sources: [ {url: {type: String }, sourceName: {type: String} } ]
});