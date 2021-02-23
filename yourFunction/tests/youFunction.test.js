const assert = require('assert');
const sinon = require('sinon');

const {yourFunction} = require('..');

it('yourFunction: Post test', async () => {
   const res = {
    send: sinon.stub(),
    set: sinon.stub(),
    status: sinon.stub(),
    json: sinon.stub(),
    end: sinon.stub(),
  };
    
  const req = {
    query: {},
    body: {
        id: 123
    },
    method: 'POST',
    path: '/',
    baseUrl: ''
  };  

  await yourFunction(req, res);

  assert.strictEqual(res.status.firstCall.args[0], 200);

});