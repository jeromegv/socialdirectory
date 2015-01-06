'use strict';

var urlNode = require('url');
var _ = require('lodash');
var secrets = require('../config/secrets');
var ig = require('instagram-node').instagram();
ig.use({
  client_id: secrets.instagram.client_id,
  client_secret: secrets.instagram.client_secret
});

function convertToSlug(Text)
{
    return Text
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-')
        ;
}
//make sure every url reference is saved with full HTTP or HTTPS
function saveUrl(entry){
  if (entry!==''){
    if (!/^(f|ht)tps?:\/\//i.test(entry)) {
      entry= 'http://' + entry;
    }
  }
  return entry;
}

//by passing the socialmedia object of an organization, get the instagram id associated with an instagram user (based on instagram url)
var getInstagramId = function(socialMedia,callback){
  if (_.some(socialMedia, { 'socialMediaName': 'instagram' })){
    socialMedia.forEach(function(entry,index) {
      if (entry.socialMediaName==='instagram') {
        var userName = urlNode.parse(entry.socialMediaUrl).pathname;
        userName = userName.replace(/\//g, '').toLowerCase();
        ig.user_search(userName, function(err, users, remaining, limit) {
          if (err) {
            return callback(err);
          } else {
            //since the usersearch does a full string search, we only want the string exact match
            if (users.length>0 && _.some(users, { 'username': userName })){
              var exactUser = _.filter(users, { 'username': userName });
              console.log(exactUser);
              return callback(null,exactUser[0].id,index);
            } else {
              return callback('No user found on instagram for '+userName);
            }
          }
        });
      }
    });
  } else {
    callback(null);
  }
};

exports.saveUrl = saveUrl;
exports.convertToSlug = convertToSlug;
exports.getInstagramId = getInstagramId;
