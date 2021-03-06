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

describe('GET /aboutus website page', function() {
  it('should return 200', function(done) {
    request(app)
      .get('/aboutus')
      .expect(200, done);
  });
});

describe('GET /explore website page', function() {
  it('should return 200', function(done) {
    request(app)
      .get('/explore')
      .expect(200, done);
  });
});

describe('GET /explore/business/retail-ecommerce website page', function() {
  it('should return 200', function(done) {
    request(app)
      .get('/explore/business/retail-ecommerce')
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

describe('GET /organization/:slug website page that does not exist', function() {
  it('should return 404', function(done) {
    request(app)
      .get('/organization/wrongorgthatdoesnotexist')
      .expect(404, done);
  });
});

describe('GET /organization/:slug website page', function() {
  it('should return 200', function(done) {
    var name = 'Best social enterprise in Philippines';
    var org = new Organization({
      email: 'test@test.com',
      name: name,
      name_slug: utils.convertToSlug(name),
      active: true
    });
    org.save(function(err,organization) {
      if (err) {
        return done(err)
      } else {
        request(app)
          .get('/organization/'+organization.name_slug)
          .expect(200)
          .end(function(err, res){
            if (err) return done(err);
            Organization.remove({ email: 'test@test.com' }, function(err) {
              if (err) return done(err);
              done();
            });
          });
      }
    });
  });
});


