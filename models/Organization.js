var mongoose = require('mongoose');

var organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true },
  Location: {
        address: { type: String, default: '' }
      , latitude: { type: Number, default: ''  }
      , longitude: { type: Number, default: '' }
      },
  phoneNumber: { type: String, lowercase: true, default: ''},
  website: { type: String, default: '' },
  logo: { type: String, default: '' },
  parentOrganization: { type: String, default: '' },
  yearFounded: {type: Number,  min: 1800, max: 2100, default: ''},
  descriptionService: {type: String, default: ''},
  primaryBusinessSector: {type: String, default: ''},
  descriptionCause: {type: String, default: ''},
  socialPurposeCategory: {type: String, default: ''},
  organizationalStructure: {type: String, default: ''},
  privateNote: {type: String, default: ''},
  active: {type: Boolean, default: false},
  lastUpdated: {type: Date, default: Date.now},
  socialMedia: [ {socialMediaUrl: {type: String }, socialMediaName: {type: String} } ],
  additionalResources: [ {resourceUrl: {type: String }, resourceName: {type: String} } ]
});

module.exports = mongoose.model('Organization', organizationSchema);
