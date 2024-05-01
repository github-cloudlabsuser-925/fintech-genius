const request = require('supertest');
const chai = require('chai');
const app = require('./app'); // Import your Express app

const { expect } = chai;

describe('Express app', () => {
  it('should add a credit card', async () => {
    const res = await request(app)
      .post('/add_credit_card')
      .send({ id: '123', card: 'test-card' });
    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
  });

  it('should get credit cards', async () => {
    const res = await request(app)
      .get('/get_credit_card/test-id');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
  });
});