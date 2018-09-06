"use strict"

const test = require('jtf')
const typea = require('..')

test("strict", t => {

   let sample = {
      a: "888",
      b: ["kkk", "xxx"],
      c: "666",
      d: {
         s: 88
      }
   }

   let { error, data } = typea.strict(sample, {
      a: {
         type: String,
         allowNull: false,
      },
      b: [String],
      c: {
         type: String
      },
      d: {
         s: Number
      }
   })

   // console.log(data);

   t.deepEqual(sample, data, error);

});


test("loose", t => {

   let sample = {
      a: "888",
      b: ["kkk", "xxx"],
      c: "666",
      d: {
         s: "x"
      }
   }

   let { error, data } = typea.loose(sample, {
      a: {
         type: String,
         allowNull: false,
         default: 'xxx',
      },
      b: [String],
      c: {
         type: String
      },
      d: {
         s: String
      }
   })

   // console.log(data);

   t.deepEqual(sample, data, error);

});