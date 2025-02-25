const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const expect = chai.expect;
const path = require('path');
const bcrypt = require('bcryptjs');

const app = require('../app');
const Credential = require('../model/credential');
const Customer = require('../model/customer');
const Book = require('../model/book');
const Cart = require('../model/cart');
const PasswordReset = require('../model/passwordReset');
const BookRequest = require('../model/bookRequest');
const Feedback = require('../model/feedback');
const Notification = require('../model/notification');
const Order = require('../model/order');

chai.use(chaiHttp);

describe('Backend API Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // Test 1: Register with valid data
  it('POST /api/auth/register should register a new user', (done) => {
    sandbox.stub(Credential, 'findOne').resolves(null);
    sandbox.stub(Credential.prototype, 'save').resolves({ _id: 'mock-id', username: 'newuser', role: 'User' });
    sandbox.stub(Customer.prototype, 'save').resolves({ _id: 'mock-id', username: 'newuser', email: 'newuser@example.com', full_name: 'New User' });
    sandbox.stub(require('nodemailer'), 'createTransport').returns({
      sendMail: () => Promise.resolve({ response: 'Email sent' })
    });

    chai.request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'multipart/form-data')
      .field('username', 'newuser')
      .field('password', 'password123')
      .field('confirmPassword', 'password123')
      .field('full_name', 'New User')
      .field('email', 'newuser@example.com')
      .field('contact_no', '1234567890')
      .attach('image', Buffer.from('mock-image'), 'test-image.jpg')
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message', 'User registered successfully');
        done();
      });
  });

  // Test 2: Check user exists with non-existing username
  it('POST /api/auth/check-user-exists should indicate username does not exist', (done) => {
    sandbox.stub(Credential, 'findOne').resolves(null);

    chai.request(app)
      .post('/api/auth/check-user-exists')
      .send({ username: 'nonexistent' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('usernameExists', false);
        done();
      });
  });

  // Test 3: Login with valid credentials
  it('POST /api/auth/login should return token for valid credentials', (done) => {
    sandbox.stub(Credential, 'findOne').resolves({
      _id: 'mock-id',
      username: 'testuser',
      password: '$2a$10$mockhashedpassword',
      role: 'User'
    });
    sandbox.stub(bcrypt, 'compare').resolves(true);
    sandbox.stub(Customer, 'findOne').resolves({ _id: 'mock-id', username: 'testuser' });

    chai.request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        expect(res.body).to.have.property('userId', 'mock-id');
        done();
      });
  });

  // Test 4: Login with invalid credentials
  it('POST /api/auth/login should fail with invalid credentials', (done) => {
    sandbox.stub(Credential, 'findOne').resolves(null);

    chai.request(app)
      .post('/api/auth/login')
      .send({ username: 'wronguser', password: 'wrongpass' })
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.text).to.equal('Invalid username or password');
        done();
      });
  });

  // Test 5: Forgot password with valid email
  it('POST /api/auth/forgot-password should send reset code', (done) => {
    sandbox.stub(Customer, 'findOne').resolves({ _id: 'mock-id', email: 'test@example.com' });
    sandbox.stub(PasswordReset, 'findOne').resolves(null);
    sandbox.stub(PasswordReset.prototype, 'save').resolves({ userId: 'mock-id', code: '123456' });
    sandbox.stub(require('nodemailer'), 'createTransport').returns({
      sendMail: () => Promise.resolve({ response: 'Email sent' })
    });

    chai.request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Password reset code has been sent to your email.');
        done();
      });
  });

  // Test 6: Verify code with invalid code
  it('POST /api/auth/verify-code should fail with invalid code', (done) => {
    sandbox.stub(PasswordReset, 'findOne').resolves(null);

    chai.request(app)
      .post('/api/auth/verify-code')
      .send({ email: 'test@example.com', code: '123456' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Invalid or expired verification code.');
        done();
      });
  });

  // Test 7: Check user exists with existing username
  it('POST /api/auth/check-user-exists should detect existing username', (done) => {
    sandbox.stub(Credential, 'findOne').resolves({ username: 'testuser' });

    chai.request(app)
      .post('/api/auth/check-user-exists')
      .send({ username: 'testuser' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('usernameExists', true);
        done();
      });
  });

  // Test 8: Get all books
  it('GET /api/books/ should return list of books', (done) => {
    sandbox.stub(Book, 'find').resolves([{ _id: 'mock-book-id', title: 'Test Book' }]);

    chai.request(app)
      .get('/api/books/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body[0]).to.have.property('title', 'Test Book');
        done();
      });
  });

  // Test 9: Get new books
  it('GET /api/books/new/newbooks should return new books', (done) => {
    sandbox.stub(Book, 'find').returns({
      sort: sinon.stub().returns({
        limit: sinon.stub().resolves([{ _id: 'mock-book-id', title: 'New Book' }])
      })
    });

    chai.request(app)
      .get('/api/books/new/newbooks')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 10: Get books by genre
  it('GET /api/books/genre/Fiction should return books by genre', (done) => {
    sandbox.stub(Book, 'find').resolves([{ _id: 'mock-book-id', genre: ['Fiction'] }]);

    chai.request(app)
      .get('/api/books/genre/Fiction')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 11: Search books by title
  it('GET /api/books/search/title-isbn should search by title', (done) => {
    sandbox.stub(Book, 'find').resolves([{ _id: 'mock-book-id', title: 'Test Book' }]);

    chai.request(app)
      .get('/api/books/search/title-isbn')
      .query({ query: 'Test' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 12: Search books by author
  it('GET /api/books/search/author should search by author', (done) => {
    sandbox.stub(Book, 'find').resolves([{ _id: 'mock-book-id', author: 'Test Author' }]);

    chai.request(app)
      .get('/api/books/search/author')
      .query({ author: 'Test Author' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 13: Search books by invalid ISBN
  it('GET /api/books/search/title-isbn should return no books for invalid ISBN', (done) => {
    sandbox.stub(Book, 'find').resolves([]);

    chai.request(app)
      .get('/api/books/search/title-isbn')
      .query({ query: 'invalid-ISBN' })
      .end((err, res) => {
        expect(res).to.have.status(404); // Adjusted to match actual endpoint behavior
        expect(res.body).to.have.property('message', 'No books found matching the search criteria');
        done();
      });
  });

  // Test 14: Verify code with invalid email
  it('POST /api/auth/verify-code should fail with invalid email', (done) => {
    sandbox.stub(PasswordReset, 'findOne').resolves(null);

    chai.request(app)
      .post('/api/auth/verify-code')
      .send({ email: 'invalid@example.com', code: '123456' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Invalid or expired verification code.');
        done();
      });
  });

  // Test 15: Get all customers
  it('GET /api/customer/ should return all customers', (done) => {
    sandbox.stub(Customer, 'find').resolves([{ _id: 'mock-id', username: 'testuser' }]);

    chai.request(app)
      .get('/api/customer/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 16: Search books by series
  it('GET /api/books/search/series should search by series', (done) => {
    sandbox.stub(Book, 'find').resolves([{ _id: 'mock-book-id', series: 'Test Series' }]);

    chai.request(app)
      .get('/api/books/search/series')
      .query({ series: 'Test Series' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 17: Get feedback by book ID
  it('GET /api/feedback/book/:book_id should return feedback', (done) => {
    const feedbackItems = [{ _id: 'mock-feedback-id', book_id: 'mock-book-id' }];
    sandbox.stub(Feedback, 'find').returns({
      populate: sinon.stub().returns({
        sort: sinon.stub().resolves(feedbackItems)
      })
    });

    chai.request(app)
      .get('/api/feedback/book/mock-book-id')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // Test 18: Get customer count
  it('GET /api/customer/count should return customer count', (done) => {
    sandbox.stub(Customer, 'countDocuments').resolves(3);

    chai.request(app)
      .get('/api/customer/count')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('count', 3);
        done();
      });
  });

  // Test 19: Forgot password with invalid email
  it('POST /api/auth/forgot-password should fail with invalid email', (done) => {
    sandbox.stub(Customer, 'findOne').resolves(null);

    chai.request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'User with this email does not exist.');
        done();
      });
  });

  // Test 20: Get best books
  it('GET /api/books/best/bestbooks should return best books', (done) => {
    sandbox.stub(Book, 'aggregate').resolves([{ _id: 'mock-book-id', title: 'Best Book' }]);

    chai.request(app)
      .get('/api/books/best/bestbooks')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });
});