"use strict"

const test = require('jtf')
const typea = require('..')


test('string', t => {

   let { error, data } = typea("xxx", String)

   // console.log(data);

   t.deepEqual('xxx', data, error);

});