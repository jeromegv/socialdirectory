'use strict';

var secrets = require('../config/secrets');
var Organization = require('../models/Organization');
var request = require('request');
var urlNode = require('url');
var _ = require('lodash');
var path = require('path');
var util = require('util');
//load the strings that will be used in the UI for various categories
var businessSector = require('../public/json/primaryBusinessSector.json');
var socialPurposeCategory = require('../public/json/socialPurposeCategory.json');
var demographicImpact = require('../public/json/demographicImpact.json');
var islandGroup = require('../public/json/islandGroup.json').features;

//local dependencies
var downloadImageAndUploadToS3 = require('../libs/downloadImageAndUploadToS3.js');
var azureSearch = require('../libs/azuresearch.js');
var utils = require('../libs/utils.js');
var async = require('async');

//Get root name of website based on hostname (without TLD)
//From: http://stackoverflow.com/questions/8253136/how-to-get-domain-name-only-using-javascript
var TLDs = ['ac', 'ad', 'ae', 'aero', 'af', 'ag', 'ai', 'al', 'am', 'an', 'ao', 'aq', 'ar', 'arpa', 'as', 'asia', 'at', 'au', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'biz', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bv', 'bw', 'by', 'bz', 'ca', 'cat', 'cc', 'cd', 'cf', 'cg', 'ch', 'ci', 'ck', 'cl', 'cm', 'cn', 'co', 'com', 'coop', 'cr', 'cu', 'cv', 'cx', 'cy', 'cz', 'de', 'dj', 'dk', 'dm', 'do', 'dz', 'ec', 'edu', 'ee', 'eg', 'er', 'es', 'et', 'eu', 'fi', 'fj', 'fk', 'fm', 'fo', 'fr', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gov', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw', 'gy', 'hk', 'hm', 'hn', 'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'in', 'info', 'int', 'io', 'iq', 'ir', 'is', 'it', 'je', 'jm', 'jo', 'jobs', 'jp', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'me', 'mg', 'mh', 'mil', 'mk', 'ml', 'mm', 'mn', 'mo', 'mobi', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'museum', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'name', 'nc', 'ne', 'net', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz', 'om', 'org', 'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'pro', 'ps', 'pt', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'ru', 'rw', 'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'st', 'su', 'sv', 'sy', 'sz', 'tc', 'td', 'tel', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tp', 'tr', 'travel', 'tt', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'us', 'uy', 'uz', 'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu', 'wf', 'ws', 'xn--0zwm56d', 'xn--11b5bs3a9aj6g', 'xn--3e0b707e', 'xn--45brj9c', 'xn--80akhbyknj4f', 'xn--90a3ac', 'xn--9t4b11yi5a', 'xn--clchc0ea0b2g2a9gcd', 'xn--deba0ad', 'xn--fiqs8s', 'xn--fiqz9s', 'xn--fpcrj9c3d', 'xn--fzc2c9e2c', 'xn--g6w251d', 'xn--gecrj9c', 'xn--h2brj9c', 'xn--hgbk6aj7f53bba', 'xn--hlcj6aya9esc7a', 'xn--j6w193g', 'xn--jxalpdlp', 'xn--kgbechtv', 'xn--kprw13d', 'xn--kpry57d', 'xn--lgbbat1ad8j', 'xn--mgbaam7a8h', 'xn--mgbayh7gpa', 'xn--mgbbh1a71e', 'xn--mgbc0a9azcg', 'xn--mgberp4a5d4ar', 'xn--o3cw4h', 'xn--ogbpf8fl', 'xn--p1ai', 'xn--pgbs0dh', 'xn--s9brj9c', 'xn--wgbh1c', 'xn--wgbl6a', 'xn--xkc2al3hye2a', 'xn--xkc2dl3a5ee0h', 'xn--yfro4i67o', 'xn--ygbi2ammx', 'xn--zckzah', 'xxx', 'ye', 'yt', 'za', 'zm', 'zw'].join();

function getDomain(url){

    var parts = url.split('.');
    if (parts[0] === 'www' && parts[1] !== 'com'){
        parts.shift();
    }
    var ln = parts.length,
      i = ln,
      minLength = parts[parts.length-1].length,
      part;

    // iterate backwards
    while(part = parts[--i]){
        // stop when we find a non-TLD part
        if (i === 0                    // 'asia.com' (last remaining must be the SLD)
            || i < ln-2                // TLDs only span 2 levels
            || part.length < minLength // 'www.cn.com' (valid TLD as second-level domain)
            || TLDs.indexOf(part) < 0  // officialy not a TLD
        ){
            return part
        }
    }
}
function getSocialMediaName(parsedUrl){
    var socialMediaName;
    switch(getDomain(parsedUrl)) {
        case 'pinterest':
            socialMediaName='pinterest';
            break;
        case 'twitter':
            socialMediaName='twitter';
            break;
        case 'facebook':
            socialMediaName='facebook';
            break;
        case 'soundcloud':
            socialMediaName='soundcloud';
            break;
        case 'youtube':
            socialMediaName='youtube';
            break;
        case 'linkedin':
            socialMediaName='linkedin';
            break;
        case 'tumblr':
            socialMediaName='tumblr';
            break;
        case 'instagram':
            socialMediaName='instagram';
            break;
        case 'google':
            socialMediaName='google plus';
            break;
        case 'blogspot':
            socialMediaName='blogspot';
            break;
        case 'vimeo':
            socialMediaName='vimeo';
            break;
        case 'foursquare':
            socialMediaName='foursquare';
            break;
        case 'wordpress':
            socialMediaName='wordpress';
            break;
        default:
            socialMediaName='other';
    }
    return socialMediaName;
}

function generateIslandCoordinates(data,islandName){
  var geometry = _.pluck(_.filter(data,  
    { 
      properties: {
        island_group : islandName 
      }
    }),'geometry');
  var coordinates = [];

  _.forEach(geometry, function(n, key) { 
    if (n.type==='Polygon'){
      coordinates.push(n.coordinates);
    } else if (n.type==='MultiPolygon'){
      coordinates = _.union(coordinates,n.coordinates);
    }
  });
  return coordinates;
}

function getIslandGroup(slug,callback){
    async.parallel([
      function(callbackAsync){
          var coordinates = generateIslandCoordinates(islandGroup,'Mindanao');

          Organization.find({
            "name_slug": slug,
            "loc": {
                "$geoWithin": {
                    "$geometry": {
                        "type": "MultiPolygon",
                        "coordinates": coordinates
                    }
                }
            }
          }, function(err,foundGeozone) {
              if (err){
                return callbackAsync(err);
              } else {
                if (foundGeozone.length>0){
                  return callbackAsync(null,'Mindanao');
                } else {
                  return callbackAsync(null);
                }
              }
          });
      },
      function(callbackAsync){
          var coordinates = generateIslandCoordinates(islandGroup,'Visayas');

          Organization.find({
            "name_slug": slug,
            "loc": {
                "$geoWithin": {
                    "$geometry": {
                        "type": "MultiPolygon",
                        "coordinates": coordinates
                    }
                }
            }
          }, function(err,foundGeozone) {
              if (err) {
                return callbackAsync(err);
              } else {
                if (foundGeozone.length>0){
                  return callbackAsync(null,'Visayas');
                } else {
                  return callbackAsync(null);
                }
              }
          });
      },
      function(callbackAsync){
          var coordinates = generateIslandCoordinates(islandGroup,'Luzon');

          Organization.find({
            "name_slug": slug,
            "loc": {
                "$geoWithin": {
                    "$geometry": {
                        "type": "MultiPolygon",
                        "coordinates": coordinates
                    }
                }
            }
          }, function(err,foundGeozone) {
              if (err) {
                return callbackAsync(err);
              } else {
                if (foundGeozone.length>0){
                  return callbackAsync(null,'Luzon');
                } else {
                  return callbackAsync(null);
                }
              }
          });
      }
  ],
  function(err, results){
      if (err){
        return callback(err);
      } else {
        var result;
        _.forEach(results, function(n, key) { 
          if (n){
            result=n;
          }
        });
        return callback(null,result);
      }  
  });
}

//when user is loggedin, we want to show privateNote with public api, otherwise, hide it
function loggedInSelectQuery(req){
  if (req.isAuthenticated()|| (req.get('secretkey')==secrets.internalAPIKey)) {
    return ('+privateNote');
  } else {
    return ('');
  }
}
//when user is not logged in, we don't want to show unpublished organizations
function loggedInQuery(req){
  if (req.isAuthenticated()|| (req.get('secretkey')==secrets.internalAPIKey)) {
    return ('');
  } else {
    return ({active: true});
  }
}

/**
 * GET /api/organization
 * List of all organizations
 * ?light=true to bring less fields
 */

exports.getOrganization = function(req, res) {
  if (typeof(req.query.light)!='undefined' && req.query.light!=''){
    Organization.find(loggedInQuery(req)).select('logoThumbnail name name_slug socialPurposeCategoryTags Location primaryBusinessSector_1 demographicImpact primaryBusinessSector_2 islandGroup').exec(function(err, organizations) {
      if (!err && organizations!==null){
        return res.jsonp(organizations);
      } else {
        res.status(400);
        return res.send(err);
      }
    });
  } else {
    Organization.find(loggedInQuery(req)).select(loggedInSelectQuery(req)).exec(function(err, organizations) {
      if (!err && organizations!==null){
        return res.jsonp(organizations);
      } else {
        res.status(400);
        return res.send(err);
      }
    });
  }
};

/**
 * GET /api/organization/:slug
 * Get a specific organization
 */

exports.getOrganizationSlug = function(req, res) {
  Organization.find({ name_slug: req.params.slug }).select(loggedInSelectQuery(req)).exec(function(err, organization) {
    if (!err && organization!==null && organization.length>0 && (organization[0].active===true || req.isAuthenticated() || req.get('secretkey')==secrets.internalAPIKey)){
      return res.jsonp(organization[0]);
    } else if (!err && (organization[0]==null || organization.length<1)){
      res.status(404);
      return res.send(null);
    } else {
      res.status(400);
      return res.send(err);
    }
  });
};

/**
 * GET /reloadOrganizationsInAzure
 * Force send every organizations directly into Azure search
 */
 exports.getReloadOrganizationsInAzure = function(req, res) {
  Organization.find(loggedInQuery(req)).select(loggedInSelectQuery(req)).exec(function(err, organizations) {
    if (!err && organizations!==null){
      azureSearch.uploadRecord(organizations,function(error){
        if (error){
          console.log(error);
        }
      });
      return res.redirect('/admin');
    } else {
      res.status(400);
      return res.send(err);
    }
  });
};

/**
 * GET /admin/organization
 * Render form page to add a new organization
 */

exports.addOrganization = function(req, res) {
  res.render('organization/add', {
    title: 'Add Organization',
    businessSector: businessSector,
    socialPurposeCategory:socialPurposeCategory,
    demographicImpact:demographicImpact
  });
};

/**
 * GET /admin/organization/:slug
 * Render form page to update an organization
 */

exports.updateOrganization = function(req, res) {
  var options = {
      url: res.locals.host+'/api/organization/'+req.params.slug,
      json: true,
      headers: {
        secretkey:secrets.internalAPIKey
      }
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('organization/update', {
        title: 'Update '+body.name,
        organization: body,
        _:_,
        businessSector: businessSector,
        socialPurposeCategory:socialPurposeCategory,
        demographicImpact:demographicImpact
      });
    } else {
      req.flash('errors', { msg: 'The organization requested can\'t be rendered' });
      return res.redirect('back');
    }
  });
};

/**
 * POST /admin/organization
 * Add a new organization
 */

exports.postOrganization = function(req, res,next) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  if (req.body.email!=''){
    req.assert('email', 'Email is not valid').notEmpty().isEmail();
  }

  if (req.body.website!=''){
    req.assert('website','Website URL is not valid').isURL();
  }

  if (req.body.store!=''){
    req.assert('store','Store URL is not valid').isURL();
  }

  if (req.body.logo!=''){
    req.assert('logo','Logo URL is not valid').isURL();
  }

  if (req.body.yearFounded!=''){
    req.assert('yearFounded', 'Year Founded is not valid').isInt();
  }
  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  if (req.body.resourceName.length != req.body.resourceUrl.length){
    req.flash('errors', { msg: 'You must fill both Resource name and URL for each Additional Resources' });
    return res.redirect('back');
  }

  if ((req.body.videoId != '' && req.body.videoSource=='') || (req.body.videoId == '' && req.body.videoSource!='')){
    req.flash('errors', { msg: 'You must fill up both the video source and the video id' });
    return res.redirect('back');
  }

  var organization = new Organization({
    name: req.sanitize('name').trim(),
    name_slug: utils.convertToSlug(req.body.name),
    email: req.body.email,
    Location: {
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    },
    phoneNumber: req.body.phoneNumber,
    website: utils.saveUrl(req.body.website),
    store: utils.saveUrl(req.body.store),
    logo: utils.saveUrl(req.body.logo),
    videoId: req.body.videoId,
    videoSource: req.body.videoSource,
    parentOrganization: req.body.parentOrganization,
    yearFounded: req.body.yearFounded,
    descriptionService: req.body.descriptionService,
    primaryBusinessSector_1: req.body.primaryBusinessSector_1,
    descriptionCause: req.body.descriptionCause,
    organizationalStructure: req.body.organizationalStructure,
    privateNote: req.body.privateNote,
    active: req.sanitize('active').toBoolean(),
    isSocialEnterprise: req.sanitize('isSocialEnterprise').toBoolean(),
    createdBy: req.user._id
  });

  if (!_.isEmpty(req.body.longitude) && !_.isEmpty(req.body.latitude) ){
    organization.loc = {
      type: 'Point',
      coordinates:[req.sanitize('longitude').toFloat(),req.sanitize('latitude').toFloat()]
    };
  }
  if (typeof(req.body.demographicImpact)!='undefined'){
    organization.demographicImpact = req.body.demographicImpact;
  } else {
    organization.demographicImpact = [];
  }
  if (typeof(req.body.socialPurposeCategoryTags)!='undefined'){
    organization.socialPurposeCategoryTags = req.body.socialPurposeCategoryTags;
  } else {
    organization.socialPurposeCategoryTags = [];
  }

  if (typeof(req.body.primaryBusinessSector_2)!='undefined'){
    organization.primaryBusinessSector_2 = req.body.primaryBusinessSector_2;
  } else {
    organization.primaryBusinessSector_2 = [];
  }

  var additionalResources = [];
  req.body.resourceName.forEach(function(entry,index) {
      additionalResources[index]={resourceName:entry,resourceUrl:utils.saveUrl(req.body.resourceUrl[index])};
  });
  //clean empty resources
  _.remove(additionalResources, function(resource) { 
    if (!resource.resourceName && !resource.resourceUrl) {
      return true;
    }
  });

  organization.additionalResources = additionalResources;

  var socialMedia = [];
  req.body.socialMediaUrl.forEach(function(entry,index) {
      if (req.body.socialMediaUrl[index]){
        var parsedUrl = urlNode.parse(utils.saveUrl(req.body.socialMediaUrl[index])).hostname;
        var socialMediaNameParsed = getSocialMediaName(parsedUrl);
        socialMedia.push({socialMediaName:socialMediaNameParsed,socialMediaUrl:utils.saveUrl(req.body.socialMediaUrl[index])});
      }
  });
  organization.socialMedia = socialMedia;

  async.waterfall([
    function(callback){
      Organization.findOne({ name: req.sanitize('name').trim() }, function(err, existingOrganization) {
        if (existingOrganization) {
          callback(new Error('Organization with that name already exists.'));
        } else {
          organization.save(function(err,organization) {
            if (err) { 
              console.log(err);
              callback(err);
            } else {
              //save logo url to S3
              var desiredFileName = utils.convertToSlug(organization.name) + '-' + path.basename(organization.logo);
              downloadImageAndUploadToS3.getAndSaveFile(organization.logo,desiredFileName,function (error,amazonUrl,amazonThumbnailUrl){
                if (error){
                  console.log(error);
                  callback(null,organization);
                } else {
                  //update specific field in organization
                  organization.logo=amazonUrl;
                  organization.logoThumbnail = amazonThumbnailUrl;
                  organization.save(function(err) {
                    if (err) {
                      console.log(err);
                    }
                    callback(null,organization);
                  });
                }
              });
            }
          });
        }
      });
    },function(organization,callback){
        //get island group based on location already saved on the record
        if (organization){
          getIslandGroup(utils.convertToSlug(req.body.name),function(err, islandName) {
            if (err) {
              console.log(err);
              return callback(null,organization);
            }
            if (islandName){
              console.log('Island group is:',islandName);
              organization.islandGroup = islandName;
              organization.save(function(err) {
                if (err) {
                  console.log(err);
                }
                return callback(null,organization);
              });
            } else {
              return callback(null,organization);
            }
          });
        }  
    },function(organization,callback){
      azureSearch.uploadRecord(organization,function(error){
        if (error){
          console.log(error);
        }
      });
      return callback(null);
    }],function(err, results){
      if (err){
        return next(err);
      } else {
        return res.redirect('/admin');
      }
    }
  );
};


/**
 * PUT /admin/organization/:name_slug
 * Update an organization
 */
exports.putOrganization = function(req, res,next) {
    req.assert('name', 'Name cannot be blank').notEmpty();
    if (req.body.email!=''){
      req.assert('email', 'Email is not valid').notEmpty().isEmail();
    }

    if (req.body.website!=''){
      req.assert('website','Website URL is not valid').isURL();
    }

    if (req.body.store!=''){
      req.assert('store','Store URL is not valid').isURL();
    }

    if (req.body.logo!='' && req.body.logo.indexOf('/logos/') === -1){
      req.assert('logo','Logo URL is not valid').isURL();
    }

    if (req.body.yearFounded!=''){
      req.assert('yearFounded', 'Year Founded is not valid').isInt();
    }

    if ((req.body.videoId != '' && req.body.videoSource=='') || (req.body.videoId == '' && req.body.videoSource!='')){
      req.flash('errors', { msg: 'You must fill up both the video source and the video id' });
      return res.redirect('back');
    }

    if (req.body.resourceName.length != req.body.resourceUrl.length){
      req.flash('errors', { msg: 'You must fill both Resource name and URL for each Additional Resources' });
      return res.redirect('back');
    }

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('back');
    }

  var organization = {
    name: req.sanitize('name').trim(),
    name_slug: utils.convertToSlug(req.body.name),
    email: req.body.email,
    Location: {
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    },
    phoneNumber: req.body.phoneNumber,
    website: utils.saveUrl(req.body.website),
    store: utils.saveUrl(req.body.store),
    logo: req.body.logo,
    videoId: req.body.videoId,
    videoSource: req.body.videoSource,
    parentOrganization: req.body.parentOrganization,
    yearFounded: req.body.yearFounded,
    descriptionService: req.body.descriptionService,
    primaryBusinessSector_1: req.body.primaryBusinessSector_1,
    descriptionCause: req.body.descriptionCause,
    organizationalStructure: req.body.organizationalStructure,
    privateNote: req.body.privateNote,
    active: req.sanitize('active').toBoolean(),
    isSocialEnterprise: req.sanitize('isSocialEnterprise').toBoolean(),
    lastUpdated: Date.now()
  };
  if (!_.isEmpty(req.body.longitude) && !_.isEmpty(req.body.latitude) ){
    organization.loc = {
      type: 'Point',
      coordinates:[req.sanitize('longitude').toFloat(),req.sanitize('latitude').toFloat()]
    };
  }

  if (typeof(req.body.demographicImpact)!='undefined'){
    organization.demographicImpact = req.body.demographicImpact;
  } else {
    organization.demographicImpact = [];
  }
  if (typeof(req.body.socialPurposeCategoryTags)!='undefined'){
    organization.socialPurposeCategoryTags = req.body.socialPurposeCategoryTags;
  } else {
    organization.socialPurposeCategoryTags = [];
  }
  if (typeof(req.body.primaryBusinessSector_2)!='undefined'){
    organization.primaryBusinessSector_2 = req.body.primaryBusinessSector_2;
  } else {
    organization.primaryBusinessSector_2 = [];
  }
  var additionalResources = [];
  req.body.resourceName.forEach(function(entry,index) {
      additionalResources[index]={resourceName:entry,resourceUrl:utils.saveUrl(req.body.resourceUrl[index])};
  });
  //clean empty resources
  _.remove(additionalResources, function(resource) { 
    if (!resource.resourceName && !resource.resourceUrl) {
      return true;
    }
  });
  organization.additionalResources = additionalResources;

  var socialMedia = [];
  req.body.socialMediaUrl.forEach(function(entry,index) {
      if (req.body.socialMediaUrl[index]){
        var parsedUrl = urlNode.parse(utils.saveUrl(req.body.socialMediaUrl[index])).hostname;  
        var socialMediaNameParsed = getSocialMediaName(parsedUrl);
        socialMedia.push({socialMediaName:socialMediaNameParsed,socialMediaUrl:utils.saveUrl(req.body.socialMediaUrl[index])});
      }
  });
  organization.socialMedia = socialMedia;

  async.waterfall([
    function(callback){
      Organization.findOneAndUpdate({ name_slug: req.params.slug }, organization, function(err, resultOrg){
        if (err) {
          console.log(err);
          callback(err);
        } else if (!resultOrg) {
          console.log('No records were updated');
          callback(new Error('No records were updated'));
        } else {
          //save logo url to S3
          //we only get the logo url and save on S3 if it's NOT already a relative url (so if http/https is missing) of a local bucket S3 amazon URL or if the thumbnail is missing
          if (/^(f|ht)tps?:\/\//i.test(resultOrg.logo)|| !resultOrg.logoThumbnail) {
            var desiredFileName = utils.convertToSlug(resultOrg.name) + '-' + path.basename(resultOrg.logo);
            downloadImageAndUploadToS3.getAndSaveFile(resultOrg.logo,desiredFileName,function (error,amazonUrl,amazonThumbnailUrl){
              if (error) {
                console.log(error);
                callback(null,resultOrg);
              } else {
                console.log('S3 upload worked, update the record');
                //update specific field in organization
                resultOrg.logo=amazonUrl;
                resultOrg.logoThumbnail = amazonThumbnailUrl;
                resultOrg.save(function(err) {
                  if (err) {
                    console.log(err);
                  }
                  callback(null,resultOrg);
                });
              }
            });
          } else {
            callback(null,resultOrg);
          }
          
        }
      });
    },function(resultOrg,callback){
        //get island group based on location already saved on the record
        if (resultOrg){
          getIslandGroup(utils.convertToSlug(req.body.name),function(err, islandName) {
            if (err) {
              console.log(err);
              return callback(null,resultOrg);
            }
            if (islandName){
              console.log('Island group is:',islandName);
              resultOrg.islandGroup = islandName;
              resultOrg.save(function(err) {
                if (err) {
                  console.log(err);
                }
                return callback(null,resultOrg);
              });
            } else {
              return callback(null,resultOrg);
            }
          });
        }  
    },function(resultOrg,callback){
      azureSearch.uploadRecord(resultOrg,function(error){
        if (error){
          console.log(error);
        }
      });
      return callback(null);
    }],function(err, results){
      if (err){
        return next(err);
      } else {
        return res.redirect('/admin');
      }
    }
  );
};

/**
 * DELETE /admin/organization/:slug
 * Update an organization
 */
exports.deleteOrganization = function (req,res,next){
  Organization.findOneAndRemove({
      name_slug:req.params.slug
    }, function(err, org) {
      if (err){
        console.log(err);
        return next(err);
      } else {
        azureSearch.deleteRecord(org,function(error){
            if (error){
              console.log(error);
            }
        });
        return res.send('');
      }
    });
};

/**
 * GET /searchorganization/
 * Search an organization with Azure Search Suggestion service and return as JSON 
 * Since we don't want client side javascript from our site to talk directly with the service
 */
exports.searchOrganization = function (req,res,next){
  azureSearch.searchSuggestions(req,function(error,response){
    if (error){
      console.log(error);
      return res.send(null);
    } else {
      res.json(response);
    }
  });
};