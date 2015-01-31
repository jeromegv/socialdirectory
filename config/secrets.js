'use strict';

/**
 * IMPORTANT * IMPORTANT * IMPORTANT * IMPORTANT * IMPORTANT * IMPORTANT *
 *
 * You should never commit this file to a public repository on GitHub!
 * All public code on GitHub can be searched, that means anyone can see your
 * uploaded secrets.js file.
 *
 * I did it for your convenience using "throw away" credentials so that
 * all features could work out of the box.
 *
 * Untrack secrets.js before pushing your code to public GitHub repository:
 *
 * git rm --cached config/secrets.js
 *
 * If you have already commited this file to GitHub with your keys, then
 * refer to https://help.github.com/articles/remove-sensitive-data
*/

module.exports = {

  db: process.env.MONGODB|| 'mongodb://localhost:27017/test',
  externalUrl: 'URL of the website once it is being hosted (used by sitemap)',

  azureSearch: {
    url: '',
    apiKey: '',
    indexName: 'social',
    apiVersion: '2014-10-20-Preview'
  },

  s3: {
    key: process.env.S3_KEY || 'S3 key goes here',
    secret: process.env.S3_SECRET || 'S3 secret goes here',
    bucket: process.env.S3_BUCKET || 'S3 bucket goes here',
    region: process.env.S3_REGION || 'S3 Region goes here',
    fullFileHost: 'Full host to reach your image/files from the outside goes here'
  },

  instagram: {
    client_id: '',
    client_secret: ''
  },

  //to send forgot password emails
  sendgrid: {
    user: 'Your SendGrid Username',
    password: 'Your SendGrid Password',
    emailFrom: 'The email the sendgrid emails should be sent from',
    emailForContactUs: 'The email the contact us page should send emails to'
  },

  sessionSecret: process.env.SESSION_SECRET || 'Your Session Secret goes here',
  internalAPIKey: process.env.INTERNAL_API_KEY || 'Internal API key for logged in users to get more data back from DB'

};
