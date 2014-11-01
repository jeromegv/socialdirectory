var request = require('supertest');
var app = require('../app.js');
var chai = require('chai');
var should = chai.should();
var Organization = require('../models/Organization');
var utils = require('../libs/utils.js');

describe('GET /admin', function() {
  it('should return 302 redirect and go to /login', function(done) {
    request(app)
      .get('/admin')
      .expect(302)
      .end(function(err, res){
        if (err) return done(err);
        res.headers.location.should.eql('/login');
        done()
      });
  });
});

describe('GET /login', function() {
  it('should return 200 OK', function(done) {
    request(app)
      .get('/login')
      .expect(200, done);
  });
});

describe('GET /signup', function() {
  it('should return 200 OK', function(done) {
    request(app)
      .get('/signup')
      .expect(200, done);
  });
});

describe('GET /api/organization', function() {
  it('should return 200 OK for list of all organizations', function(done) {
    request(app)
      .get('/api/organization')
      .expect(200, done);
  });
});

describe('GET /api/organization/560fbfaf2669ba68e5ebbfd6', function() {
  it('should return 404 because organization slug cannot be found', function(done) {
    request(app)
      .get('/api/organization/560fbfaf2669ba68e5ebbfd6')
      .expect(404, done);
  });
});

describe('GET /random-url', function() {
  it('should return 404', function(done) {
    request(app)
      .get('/random-url')
      .expect(404, done);
  });
});

describe('Test a working /api/organization/:slug', function() {
  it('should be able to read a newly created organization', function(done) {
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
            .get('/api/organization/'+organization.name_slug)
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

//suggestion future test: test non-active org, test public note, searchsuggestion, get org through internalAPIKey
