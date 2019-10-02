var assert = require('assert');
var loadExtension = require('../src/api/loadExtension');

describe('loadExtension', function() {
    it('default property should be a function', function() {
        assert.equal(typeof loadExtension.default, "function");
    });
});
