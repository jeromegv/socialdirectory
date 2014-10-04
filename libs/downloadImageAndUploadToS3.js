var secrets = require('../config/secrets');
var request = require('request');
var fs = require('fs');
var async = require('async');
var path = require('path');
var knox = require('knox');
var Imagemin = require('imagemin');
var fs = require('fs');
var mimeMagic = require( "node-ee-mime-magic" );
var sharp = require('sharp');

var getAndSaveFile = function(url,desiredFileName,callback) {
	if (!secrets.s3.key || !secrets.s3.secret || !secrets.s3.bucket){
		return callback('S3 is not configured in the secrets file, logo will not be uploaded');
	}
	if (!url){
		return callback('No URL in the organization, logo will not be uploaded');
	}
	async.waterfall([
	  //downloading logo from url
	  //save to temp directory
	  function(callback){
	    var filePath = '/tmp/'+desiredFileName;
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
	  },function (filePath,contentType,callback){
	    //read temp file from disk
	    fs.readFile(filePath, function (error, data) {
	      if (error){
	        callback(error);
	      } else {
	        callback(null,data,filePath,contentType);
	      }
	    });
	  },function (fileData,filePath,contentType,callback){
	    //make sure the link given is an image
	    mimeMagic( fileData, function( err, mimeType ){
	        if (err) {
	          callback('Error finding the mimeType: '+err);
	        } else if (!mimeType) {
	          callback('Mimetype cannot be found, logo url is most likely not an image');
	        } else {
	          callback(null,mimeType,fileData,filePath,contentType);
	        }
	    } );
	  },function (mimeType,fileData,filePath,contentType,callback){
  		//we take the image and optimize it (reduce the size)
	    var imagemin = new Imagemin().src(filePath).dest('/tmp/optimized');
	    var optimizedFilePath = '/tmp/optimized/'+path.basename(filePath);
	    if (mimeType.mime=="image/gif"){
		    imagemin = imagemin.use(Imagemin.gifsicle({ interlaced: true }));
	    } else if (mimeType.mime=="image/jpeg"){
	    	imagemin = imagemin.use(Imagemin.jpegtran({ progressive: true }));
	    } else if (mimeType.mime == "image/png"){
	    	imagemin = imagemin.use(Imagemin.optipng({ optimizationLevel: 3 }));
	    } else {
        	return callback(null,mimeType,fileData,filePath,'',contentType);
	    }
	    imagemin.run(function (err, files) {
		    if (err) {
		    	console.log('Error running imagemin, skipping image optimization step');
		    	console.log(err);
		    	callback(null,mimeType,fileData,filePath,'',contentType);
		    } else {
		    	//imagemin completed optimization, reading this new file
		    	fs.readFile(optimizedFilePath, function (error, data) {
					if (error){
				    	console.log('Error reading imagemin optimized file, skipping image optimization step');
						console.log(error);
		    			callback(null,mimeType,fileData,filePath,'',contentType);
					} else {
						callback(null,mimeType,data,filePath,optimizedFilePath,contentType);
					}
				});
		    }
		});
	  }, function (mimeType,fileData,filePath,optimizedFilePath,contentType,callback){
	  	//upload full size optimized image to amazon
	    uploadToKnox(fileData,optimizedFilePath,contentType,function(err,amazonUrl){
	    	if (!err){
	    		callback(null,mimeType,filePath,optimizedFilePath,contentType,amazonUrl);
	    	} else {
	    		callback(err,filePath,optimizedFilePath);
	    	}
	    });
	  }, function (mimeType,filePath,optimizedFilePath,contentType,amazonUrl,callback){
	  	var sharpObject = sharp(filePath);
	  	//this library do not support output in GIF, only in input, so we will convert to PNG
	  	if (mimeType.mime=="image/gif"){
		    sharpObject = sharpObject.png();
		    contentType == 'image/png';
	    }

	  	//create a thumbnail (smaller size)
	  	sharpObject.resize(240,240).max().quality(90).progressive().toBuffer(function(err, buffer) {
			//fs.writeFileSync('out.jpg', buffer);
			uploadToKnox(buffer,'thumbnail_'+path.basename(filePath),contentType,function( err,amazonThumbnailUrl ){
				if (!err){
					callback(null,filePath,optimizedFilePath,amazonUrl,amazonThumbnailUrl);
				} else {
					callback(err,filePath,optimizedFilePath);
				}
			});
		});
		//create a retina version, if size allows
	  	/*sharp(filePath).resize(null, 500).max().withoutEnlargement().progressive().quality(90).toBuffer(function(err, buffer,info) {
		  fs.writeFileSync('out.jpg', buffer);
			if (info.height==500){
				callback(null,fileData,filePath,contentType);
			}	
		});*/
	  }],function (error, filePath,optimizedFilePath,amazonUrl,amazonThumbnailUrl) {
	    //we are done with the temp file, delete it
	    if (filePath){
	      fs.unlink(filePath, function (err) {
	        if (err){
	          console.log(err);
	        }
	      });
	    }
	    if (optimizedFilePath){
	      fs.unlink(optimizedFilePath, function (err) {
	        if (err){
	          console.log(err);
	        }
	      });
	    }
	    if (error){
		    console.log(error);
	    } else {
	    	callback(null,amazonUrl,amazonThumbnailUrl);
	    }
	  }
	);
};
var uploadToKnox = function(fileData,filePath,contentType,callback){
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
          callback(null,uploadknox.url);
        } else {
          callback('S3 did not respond with 200, response was:'+response.statusCode);
        }
      });
      uploadknox.on('error', function(err) {
        callback(err);
      });
      uploadknox.end(fileData);  
    } else {
      callback('File size was 0, no upload occured');
    } 
};
exports.getAndSaveFile = getAndSaveFile;