'use strict';

var mongoose = require('mongoose');

var organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  name_slug: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true },
  Location: {
    address: { type: String, default: '' },
    latitude: { type: Number, default: ''  },
    longitude: { type: Number, default: '' }
  },
  //coordinates is [longitude, latitude]
  loc: {
    type: { type: String },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  islandGroup:{ type: String, default: '' },
  phoneNumber: { type: String, lowercase: true, default: ''},
  website: { type: String, default: '' },
  store: { type: String, default: '' },
  videoId: { type: String, default: '' },
  videoSource: { type: String, default: '' },
  logo: { type: String, default: '' },
  logoThumbnail: { type: String, default: '' },
  parentOrganization: { type: String, default: '' },
  yearFounded: {type: Number,  min: 1800, max: 2100, default: ''},
  descriptionService: {type: String, default: ''},
  primaryBusinessSector_1: {type: String, default: ''},
  primaryBusinessSector_2: [{type: String, default: ''}],
  descriptionCause: {type: String, default: ''},
  socialPurposeCategoryTags: [{type: String,default:''}],
  demographicImpact: [{type: String,default:''}],
  organizationalStructure: {type: String, default: ''},
  privateNote: {type: String, default: '',select: false},
  active: {type: Boolean, default: false},
  isSocialEnterprise: {type:Boolean, default:true},
  lastUpdated: {type: Date, default: Date.now},
  socialMedia: [ {socialMediaUrl: {type: String }, socialMediaName: {type: String}, id: {type: String, default:''} } ],
  additionalResources: [ {resourceUrl: {type: String }, resourceName: {type: String} } ]
});

module.exports = mongoose.model('Organization', organizationSchema);
