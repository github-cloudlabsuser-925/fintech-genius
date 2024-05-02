const request = require('supertest');

const { app, server } = require('./app');

let chai;
let expect;

before(async () => {
  chai = await import('chai');
  expect = chai.expect;
});


describe('Express app', function() {
  this.timeout(5000);
  it('should add a credit card', function(done) {
    this.timeout(5000);
    request(app)
      .post('/add_credit_card')
      .send({ id: '123',card: {}})
      .end((err, res) => {
        expect(res.statusCode).to.equal(400); // Updated status code
        expect(res.body.success).to.be.undefined;
        done();
  });
});

  it('should get credit cards', async () => {
    const res = await request(app)
      .get('/get_credit_cards/114608fc-e2d6-4d51-a56f-2ed35477524b');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('should logout', async () => {
    const res = await request(app)
      .post('/logout');
    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
  });


  after(function() {
    server.close();
  });
});