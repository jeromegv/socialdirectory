var secrets = require('../config/secrets');
var Organization = require('../models/Organization');
var request = require('request');
var urlNode = require('url');
var util = require('util');
var moment = require('moment');
var _ = require('lodash');

//make sure every url reference is saved with full HTTP or HTTPS
function saveUrl(entry){
  if (entry!=''){
    if (!/^(f|ht)tps?:\/\//i.test(entry)) {
      entry= "http://" + entry;
    }
  }
  return entry;
}

//Get root name of website based on hostname (without TLD)
//From: http://stackoverflow.com/questions/8253136/how-to-get-domain-name-only-using-javascript
var TLDs = ["ac", "ad", "ae", "aero", "af", "ag", "ai", "al", "am", "an", "ao", "aq", "ar", "arpa", "as", "asia", "at", "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "biz", "bj", "bm", "bn", "bo", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca", "cat", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "com", "coop", "cr", "cu", "cv", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "edu", "ee", "eg", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gov", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "info", "int", "io", "iq", "ir", "is", "it", "je", "jm", "jo", "jobs", "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh", "mil", "mk", "ml", "mm", "mn", "mo", "mobi", "mp", "mq", "mr", "ms", "mt", "mu", "museum", "mv", "mw", "mx", "my", "mz", "na", "name", "nc", "ne", "net", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "org", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "pro", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "st", "su", "sv", "sy", "sz", "tc", "td", "tel", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tp", "tr", "travel", "tt", "tv", "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "xn--0zwm56d", "xn--11b5bs3a9aj6g", "xn--3e0b707e", "xn--45brj9c", "xn--80akhbyknj4f", "xn--90a3ac", "xn--9t4b11yi5a", "xn--clchc0ea0b2g2a9gcd", "xn--deba0ad", "xn--fiqs8s", "xn--fiqz9s", "xn--fpcrj9c3d", "xn--fzc2c9e2c", "xn--g6w251d", "xn--gecrj9c", "xn--h2brj9c", "xn--hgbk6aj7f53bba", "xn--hlcj6aya9esc7a", "xn--j6w193g", "xn--jxalpdlp", "xn--kgbechtv", "xn--kprw13d", "xn--kpry57d", "xn--lgbbat1ad8j", "xn--mgbaam7a8h", "xn--mgbayh7gpa", "xn--mgbbh1a71e", "xn--mgbc0a9azcg", "xn--mgberp4a5d4ar", "xn--o3cw4h", "xn--ogbpf8fl", "xn--p1ai", "xn--pgbs0dh", "xn--s9brj9c", "xn--wgbh1c", "xn--wgbl6a", "xn--xkc2al3hye2a", "xn--xkc2dl3a5ee0h", "xn--yfro4i67o", "xn--ygbi2ammx", "xn--zckzah", "xxx", "ye", "yt", "za", "zm", "zw"].join()

function getDomain(url){

    var parts = url.split('.');
    if (parts[0] === 'www' && parts[1] !== 'com'){
        parts.shift()
    }
    var ln = parts.length
      , i = ln
      , minLength = parts[parts.length-1].length
      , part

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
        default:
            socialMediaName='other';
    }
    return socialMediaName;
}

/**
 * GET /api/organization
 * List of all organizations
 */

exports.getOrganization = function(req, res) {
  Organization.find(function(err, organizations) {
    if (!err){
      return res.jsonp(organizations);
    } else {
      return res.send(err);
    }
  });
};

/**
 * GET /api/organization/:id
 * Get a specific organization
 */

exports.getOrganizationId = function(req, res) {
  Organization.findById(req.params.id,function(err, organization) {
    if (!err){
      return res.jsonp(organization);
    } else {
      return res.send(err);
    }
  });
};

/**
 * GET /organization
 * Render form page to add a new organization
 */

exports.addOrganization = function(req, res) {
  res.render('organization/add', {
    title: 'Add Organization'
  });
};

/**
 * GET /organization/:id
 * Render form page to add a new organization
 */

exports.updateOrganization = function(req, res) {
  var options = {
      url: res.locals.host+'/api/organization/'+req.params.id,
      json: true
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('organization/update', {
        title: 'Update '+body.name,
        organization: body,
        _:_
      });
    }
  });
};

/**
 * POST /organization
 * Add a new organization
 */

exports.postOrganization = function(req, res,next) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  if (req.body.email!=''){
    req.assert('email', 'Email is not valid').notEmpty().isEmail();
  }

  if (req.body.website!=''){
    req.assert('website','URL is not valid').isURL();
  }
  if (req.body.logo!=''){
    req.assert('logo','URL is not valid').isURL();
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

  var organization = new Organization({
    name: req.sanitize('name').trim(),
    email: req.body.email,
    Location: {
          address: req.body.address
        , latitude: req.body.latitude
        , longitude: req.body.longitude
        },
    phoneNumber: req.body.phoneNumber,
    website: saveUrl(req.body.website),
    logo: saveUrl(req.body.logo),
    parentOrganization: req.body.parentOrganization,
    yearFounded: req.body.yearFounded,
    descriptionService: req.body.descriptionService,
    primaryBusinessSector: req.body.primaryBusinessSector,
    descriptionCause: req.body.descriptionCause,
    socialPurposeCategory: req.body.socialPurposeCategory,
    demographicImpact : req.body.demographicImpact,
    organizationalStructure: req.body.organizationalStructure,
    privateNote: req.body.privateNote,
    active: req.sanitize('active').toBoolean(),
    createdBy: req.user._id
  });

  var additionalResources = new Array();
  var additionalResourcesName = new Array();
  req.body.resourceName.forEach(function(entry,index) {
      additionalResources[index]={resourceName:entry,resourceUrl:saveUrl(req.body.resourceUrl[index])};
      additionalResourcesName[index]=entry;
  });

  organization.additionalResources = additionalResources;

  var socialMedia = new Array();
  req.body.socialMediaUrl.forEach(function(entry,index) {
      if (req.body.socialMediaUrl[index]!=''){
        var parsedUrl = urlNode.parse(req.body.socialMediaUrl[index]).hostname;
        socialMedia[index]={socialMediaName:getSocialMediaName(parsedUrl),socialMediaUrl:saveUrl(req.body.socialMediaUrl[index])};
      }
  });
  organization.socialMedia = socialMedia;

  Organization.findOne({ name: req.sanitize('name').trim() }, function(err, existingOrganization) {
    if (existingOrganization) {
      req.flash('errors', { msg: 'Organization with that name already exists.' });
      return res.redirect('/organization');
    }
    organization.save(function(err,organization) {
      if (err) { 
        return next(err);
      } else {
        //was able to update mongo, now update azure
        var organizationAzure = [{
          "@search.action": "upload",
          orgId:organization._id,
          name: req.sanitize('name').trim(),
          email: req.body.email,
          locationAddress:req.body.address,
          phoneNumber: req.body.phoneNumber,
          website: saveUrl(req.body.website),
          parentOrganization: req.body.parentOrganization,
          descriptionService: req.body.descriptionService,
          primaryBusinessSector: req.body.primaryBusinessSector,
          descriptionCause: req.body.descriptionCause,
          socialPurposeCategory: req.body.socialPurposeCategory,
          demographicImpact: req.body.demographicImpact,
          organizationalStructure: req.body.organizationalStructure,
          active: organization.active,
          //need to derive date created from ID 
          dateCreated: moment.utc(parseInt(organization._id.toString().substr(0, 8),16)*1000).toISOString(),
          lastUpdated: moment.utc(Date.now()).toISOString(),
          additionalResourcesNameList: additionalResourcesName
        }];
        if (req.body.yearFounded!=''){
          organizationAzure.yearFounded=req.body.yearFounded;
        }
        if (req.body.longitude!='' && req.body.latitude!=''){
          organizationAzure.location={ 
            "type": "Point", 
            "coordinates": [req.sanitize('longitude').toFloat(), req.sanitize('latitude').toFloat()]
          };
        }
        var options = {
          url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/index?api-version='+secrets.azureSearch.apiVersion,
          json: true,
          method: 'POST',
          headers: {
            'host': secrets.azureSearch.url,
            'api-key': secrets.azureSearch.apiKey,
            'Content-Type': 'application/json'
          },
          body: {"value":organizationAzure}
        };
        console.log(util.inspect(options.body,{  depth: null }));
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            //console.log('organization '+ req.sanitize('name').trim() + ' created, success');
          } else {
            if (error){
              console.log(error);
            }
            console.log('organization '+ req.sanitize('name').trim() + ' failed to be created on Azure Search, query was: ');
            console.log(options);
            if (response) {
              console.log('http status code was: '+response.statusCode)
            };
          }
        });
        return res.redirect('/');
      }
    });
  });
};


/**
 * PUT /organization/:id
 * Update an organization
 */
exports.putOrganization = function(req, res,next) {
    req.assert('name', 'Name cannot be blank').notEmpty();
    if (req.body.email!=''){
      req.assert('email', 'Email is not valid').notEmpty().isEmail();
    }

    if (req.body.website!=''){
      req.assert('website','URL is not valid').isURL();
    }

    if (req.body.logo!=''){
      req.assert('logo','URL is not valid').isURL();
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

  var organization = {
    name: req.sanitize('name').trim(),
    email: req.body.email,
    Location: {
          address: req.body.address
        , latitude: req.body.latitude
        , longitude: req.body.longitude
        },
    phoneNumber: req.body.phoneNumber,
    website: saveUrl(req.body.website),
    logo: saveUrl(req.body.logo),
    parentOrganization: req.body.parentOrganization,
    yearFounded: req.body.yearFounded,
    descriptionService: req.body.descriptionService,
    primaryBusinessSector: req.body.primaryBusinessSector,
    descriptionCause: req.body.descriptionCause,
    socialPurposeCategory: req.body.socialPurposeCategory,
    demographicImpact : req.body.demographicImpact,
    organizationalStructure: req.body.organizationalStructure,
    privateNote: req.body.privateNote,
    active: req.sanitize('active').toBoolean(),
    lastUpdated: Date.now()
  };    
  var additionalResources = new Array();
  var additionalResourcesName = new Array();
  req.body.resourceName.forEach(function(entry,index) {
      additionalResources[index]={resourceName:entry,resourceUrl:saveUrl(req.body.resourceUrl[index])};
      additionalResourcesName[index]=entry;
  });
  organization.additionalResources = additionalResources;

  var socialMedia = new Array();
  req.body.socialMediaUrl.forEach(function(entry,index) {
      if (req.body.socialMediaUrl[index]!=''){
        var parsedUrl = urlNode.parse(req.body.socialMediaUrl[index]).hostname;      
        socialMedia[index]={socialMediaName:getSocialMediaName(parsedUrl),socialMediaUrl:saveUrl(req.body.socialMediaUrl[index])};
      }
  });
  organization.socialMedia = socialMedia;

//we lose createdBy if we dont do findbyidupdate
  Organization.update({ _id: req.params.id }, organization, {safe:true, multi:false}, function(err, result){
    if (err) {
        console.log(err);
        return next(err);
    } else {
      if (result===1){
        //was able to update mongo, now update azure search
        var organizationAzure = [{
          "@search.action": "upload",
          orgId:req.params.id,
          name: req.sanitize('name').trim(),
          email: req.body.email,
          locationAddress:req.body.address,
          phoneNumber: req.body.phoneNumber,
          website: saveUrl(req.body.website),
          parentOrganization: req.body.parentOrganization,
          descriptionService: req.body.descriptionService,
          primaryBusinessSector: req.body.primaryBusinessSector,
          descriptionCause: req.body.descriptionCause,
          socialPurposeCategory: req.body.socialPurposeCategory,
          demographicImpact: req.body.demographicImpact,
          organizationalStructure: req.body.organizationalStructure,
          active: req.sanitize('active').toBoolean(),
          //need to derive date created from ID 
          dateCreated: moment.utc(parseInt(req.params.id.substr(0, 8),16)*1000).toISOString(),
          lastUpdated: moment.utc(Date.now()).toISOString(),
          additionalResourcesNameList:additionalResourcesName

        }];
        if (req.body.yearFounded!=''){
          organizationAzure.yearFounded=req.body.yearFounded;
        }
        if (req.body.longitude!='' && req.body.latitude!=''){
          organizationAzure.location={ 
            "type": "Point", 
            "coordinates": [req.sanitize('longitude').toFloat(), req.sanitize('latitude').toFloat()]
          };
        }
        var options = {
          url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/index?api-version='+secrets.azureSearch.apiVersion,
          json: true,
          method: 'POST',
          headers: {
            'host': secrets.azureSearch.url,
            'api-key': secrets.azureSearch.apiKey,
            'Content-Type': 'application/json'
          },
          body: {"value":organizationAzure}
        };
        console.log(util.inspect(options.body,{  depth: null }));
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            //console.log('organization '+ req.sanitize('name').trim() + ' created, success');
          } else {
            if (error){
              console.log(error);
            }
            console.log('organization '+ req.sanitize('name').trim() + ' failed to be updated on Azure Search, query was: ');
            console.log(options);
            if (response) {
              console.log('http status code was: '+response.statusCode)
            };

          }
        });
        return res.redirect('/');
      } else {
        console.log('No records were updated');
        return next(new Error('No records were updated'));
      }
    }
    
  });
};

/**
 * DELETE /organization/:id
 * Update an organization
 */
exports.deleteOrganization = function (req,res,next){
  Organization.remove({
      _id:req.params.id
    }, function(err, org) {
      if (err){
        console.log(err);
        return next(err);
      } else {
        return res.send('');
      }
    });
}

/**
 * GET /searchorganization/
 * Search an organization with Azure Search Suggestion service and return as JSON 
 * Since we don't want client side javascript from our site to talk directly with the service
 */
exports.searchOrganization = function (req,res,next){
  if (typeof(req.query.search)!='undefined' && req.query.search!=''){
    req.assert('search','search as you type length must be between 3 and 100').isLength(3, 100);
    var errors = req.validationErrors();
    if (errors) {
      return res.send(null);
    }
    var options = {
      url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/suggest?search='+req.query.search+'&fuzzy=true&api-version='+secrets.azureSearch.apiVersion,
          json: true,
          method: 'GET',
          headers: {
            'host': secrets.azureSearch.url,
            'api-key': secrets.azureSearch.apiKey,
            'Content-Type': 'application/json'
          }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        return res.json(body.value);
       } else {
          if (error){
            console.log(error);
          }
          console.log('search failed to execute on Azure Search, query was:');
          console.log(options);
          if (response) {
            console.log('http status code was: '+response.statusCode)
          };
        return res.send(null);
       }
    });
  } else {
    return res.send(null);
  }
}