var request = require('supertest');
var app = require('../app.js');
var chai = require('chai');
var should = chai.should();
var Organization = require('../models/Organization');
var utils = require('../libs/utils.js');

describe('GET / website page', function() {
  it('should return 200', function(done) {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('GET /contactus website page', function() {
  it('should return 200', function(done) {
    request(app)
      .get('/contactus')
      .expect(200, done);
  });
});
