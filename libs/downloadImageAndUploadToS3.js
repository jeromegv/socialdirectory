var secrets = require('../config/secrets');
var request = require('request');
var fs = require('fs');
var async = require('async');
var path = require('path');
var knox = require('knox');
var fs = require('fs');
var mimeMagic = require( "node-ee-mime-magic" );

var getAndSaveFile = function(url,callback) {
	if (!secrets.s3.key || !secrets.s3.secret || !secrets.s3.bucket){
		return callback('S3 is not configured in the secrets file, logo will not be uploaded');
	}
	async.waterfall([
	  //downloading logo from url
	  //save to temp directory
	  function(callback){
	    var filePath = '/tmp/'+path.basename(url);
	    var req = request(url);
		req.on('response', function(response) {
			if (response.statusCode == 200) {
				var picStream = fs.createWriteStream(filePath);
				picStream.on('finish', function() {
				  callback(null,filePath,response.headers['content-type']);
				});
				req.pipe(picStream);
			} else {
				callback('status code error while trying to download the file: '+url+' '+response.statusCode);
			}
		}).on('error',function(error){
			callback('error while trying to download the url: '+url+' '+error);
		});
	  },function(filePath,contentType,callback){
	    //read temp file from disk
	    fs.readFile(filePath, function (error, data) {
	      if (error){
	        callback(error);
	      } else {
	        callback(null,data,filePath,contentType);
	      }
	    });
	  },function(fileData,filePath,contentType,callback){
	    //make sure the link given is an image
	    mimeMagic( fileData, function( err, mimeType ){
	        if (err) {
	          callback('Error finding the mimeType: '+err);
	        } else if (!mimeType) {
	          callback('Mimetype cannot be found, logo url is most likely not an image');
	        } else {
	          callback(null,fileData,filePath,contentType);
	        }
	    } );
	  },function (fileData,filePath,contentType,callback){
	    if (fileData.length>0){
	      //upload image S3 with Knox
	      var knoxclient = knox.createClient({
	          key: secrets.s3.key,
	          secret: secrets.s3.secret,
	          bucket: secrets.s3.bucket
	      });
	      var uploadknox = knoxclient.put('logos/'+path.basename(filePath), {
	        'Content-length': fileData.length,
	        'Content-Type': contentType,
	        'x-amz-acl': 'public-read'
	      });
	      uploadknox.on('response', function(response){
	        if (200 == response.statusCode) {
	          console.log('saved logo to %s', uploadknox.url);
	          callback(null,filePath,uploadknox.url);
	        } else {
	          callback('S3 did not respond with 200, response was:'+response.statusCode,filePath);
	        }
	      });
	      uploadknox.on('error', function(err) {
	        callback(err,filePath);
	      });
	      uploadknox.end(fileData);  
	    } else {
	      callback('File size was 0, no upload occured',filePath);
	    } 
	  }],function (error, filePath, amazonUrl) {
	    //TODO save new amazon url in the record

	    //we are done with the temp file, delete it
	    if (filePath){
	      fs.unlink(filePath, function (err) {
	        if (err){
	          console.log(err);
	        }
	      });
	    }
	    if (error){
		    console.log(error);
	    } else {
	    	callback(null,amazonUrl);
	    }
	  }
	);
};
exports.getAndSaveFile = getAndSaveFile;