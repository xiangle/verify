"use strict";

let validator = require('validator')

let customize = require('./customize')

let Handler = require('./handler')

let filterNull = require('./filterNull')


/**
 * 验证器
 * @param {*} data 数据源
 * @param {*} options 验证表达式
 * @param {*} handler 验证结果处理
 */
function Verify(data, options, handler = {}) {

   // 数据导出容器
   let output = {
      error: null,//错误信息
      data: {},//验证结果
   }

   // 递归验证
   let error = recursionVerify(data, options, output.data, null, data, output)

   if (error) {
      output.error = error
      return output
   }

   // 空值过滤
   output = filterNull(output)

   // 验证结果处理函数
   for (let name in handler) {
      let fun = Handler[name]
      let options = handler[name]
      // 使用处理函数处理
      if (fun) {
         fun(output, options)
      }
      // 使用自定义构造函数处理
      else if (typeof options === 'function') {
         let outData = options.call(output.data)
         output[name] = filterNull(outData)
      }
   }

   return output

}


/**
 * 递归验证器
 * @param {*} data 验证数据
 * @param {*} options 验证规则选项
 * @param {*} parent 当前父级对象
 * @param {*} key 数据索引
 * @param {*} input 原始输入数据
 * @param {*} output 验证输出数据
 */
function recursionVerify(data, options, parent, key, input, output) {

   // 选项为对象
   if (typeof options === 'object') {

      // 选项为数组（数据结构）
      if (Array.isArray(options)) {

         if (!Array.isArray(data)) {
            return `${key}参数必须为数组`
         }

         // 非根对象时创建数组结构
         if (key) {
            parent[key] = []
            parent = parent[key]
         }

         let itemKey = 0
         let itemOptions = options[0]
         for (let itemData of data) {
            let error = recursionVerify(itemData, itemOptions, parent, itemKey++, input, output)
            if (error) {
               return `${key}数组Key:${error}`
            }
         }

         // 空数组提示
         if (itemOptions.allowNull === false && itemKey === 0) {
            return `${key}数组不能为空`
         }

      }

      // 选项为对象
      else {

         // 选项为验证表达式（type作为保留关键字，只允许定义数据类型，不能作为参数名使用）
         if (options.type) {

            // 空值处理
            if (data === undefined || data === '') {

               // 默认
               if (options.default) {
                  data = options.default
               }

               // 允许为空
               else if (options.allowNull === false) {
                  return `${key}参数不能为空`
               }

               else {
                  return
               }

            }

            // type为JS内置数据类型
            else if (typeof options.type === 'function') {

               // 字符串类型
               if (options.type === String) {

                  if (typeof data !== 'string') {
                     return `${key}参数必须为字符串`
                  }

                  // 长度验证
                  if (options.minLength) {
                     if (data.length < options.minLength) {
                        return `${key}参数长度不能小于${options.minLength}个字符`
                     }
                  }

                  if (options.maxLength) {
                     if (data.length > options.maxLength) {
                        return `${key}参数长度不能大于${options.maxLength}个字符`
                     }
                  }

                  // 包含
                  if (options.in) {
                     let result = options.in.indexOf(data)
                     if (result === -1) {
                        return `${key}参数可选值必须为:${options.in}`
                     }
                  }

                  // 包含字符串
                  // if (options.contain) {
                  //    if (options.contain === Number) {
                  //       if (data.search(/\d+/) === -1) {
                  //          return `${key}参数必须包含数字`
                  //       }
                  //    }
                  // }

                  // // 不包含
                  // if (options.noContain) {
                  //    if (options.noContain === Number) {
                  //       if (data.search(/\d+/) > -1) {
                  //          return `${key}参数不能包含数字`
                  //       }
                  //    }
                  // }

                  // 正则表达式
                  if (options.reg) {
                     if (data.search(options.reg) === -1) {
                        return `${key}参数格式错误`
                     }
                  }

               }

               // 数值型
               else if (options.type === Number) {

                  data = Number(data)
                  if (isNaN(data)) {
                     return `${key}参数必须为数值或可转换为数值的字符串`
                  }

                  // 数值范围验证
                  if (options.min) {
                     if (data < options.min) {
                        return `${key}参数不能小于${options.min}`
                     }
                  }

                  if (options.max) {
                     if (data > options.max) {
                        return `${key}参数不能大于${options.max}`
                     }
                  }

                  // 包含
                  if (options.in) {
                     let result = options.in.indexOf(data)
                     if (result === -1) {
                        return `${key}参数可选值必须为:${options.in}`
                     }
                  }

                  // 数值转布尔值
                  if (options.conversion) {
                     if (options.conversion === Boolean) {
                        if (data) {
                           data = true
                        } else {
                           data = false
                        }
                     }
                  }

               }

               // 对象
               else if (options.type === Object) {
                  if (typeof data !== 'object') {
                     return `${key}参数必须为对象`
                  }
               }

               // 数组
               else if (options.type === Array) {

                  if (!Array.isArray(data)) {
                     return `${key}参数必须为数组`
                  }

               }

               // 日期
               else if (options.type === Date) {

                  if (!validator.toDate(data + '')) {
                     return `${key}参数必须为日期类型`
                  }

               }

               // 布尔
               else if (options.type === Boolean) {

                  if (typeof data !== 'boolean') {
                     return `${key}参数必须为布尔值`
                  }

               }

            }

            // type为字符串，表示自定义数据类型
            else if (typeof options.type === 'string') {

               if (customize[options.type]) {
                  let result = customize[options.type](data, key)
                  if (result) return result
               } else {
                  return `${options.type}自定义类型不存在`
               }

            }

            // type为对象，用于为对象结构添加表达式
            else if (typeof options.type === 'object') {
               let error = recursionVerify(data, options.type, parent, key, input, output)
               if (error) {
                  if (Array.isArray(data)) {
                     return `${error}`
                  } else {
                     return `${key}下${error}`
                  }
               }
            }

            // 自定义构建方法
            if (options.method) {

               data = options.method.call(output, data)

            }

            parent[key] = data

         }

         // 选项为对象（数据结构）
         else {

            if (typeof data !== 'object') {
               return `${key}参数必须为对象`
            }

            // 非根对象时创建对象结构
            if (key) {
               parent[key] = {}
               parent = parent[key]
            }

            // 泛验证器（具有相同数据类型的可复用验证器）
            if (options.$) {
               for (let subKey in data) {
                  let itemData = data[subKey]
                  let itemOptions = options.$
                  let error = recursionVerify(itemData, itemOptions, parent, subKey, input, output)
                  if (error) return error
               }
            }

            // 子集递归验证
            else {
               for (let subKey in options) {
                  let itemData = data[subKey]
                  let itemOptions = options[subKey]
                  let error = recursionVerify(itemData, itemOptions, parent, subKey, input, output)
                  if (error) return error
               }
            }

         }
      }

   }

   // 选项为函数
   else if (typeof options === 'function') {

      if (data === undefined || data === '') {

         // 自定义构建方法（根据Function.length长度判定是否为自定义构造器）
         if (options.length === 0) {

            data = options.call(output.data, output)

         } else {
            return
         }

      }

      // 字符串类型
      else if (options === String) {

         if (typeof data !== 'string') {
            return `${key}参数必须为字符串`
         }

      }

      // 数值型
      else if (options === Number) {

         data = Number(data)
         if (isNaN(data)) {
            return `${key}参数必须为数值或可转换为数值的字符串`
         }

      }

      // 对象
      else if (options === Object) {

         if (typeof data !== 'object') {
            return `${key}参数必须为对象`
         }

      }

      // 数组
      else if (options === Array) {

         if (!Array.isArray(data)) {
            return `${key}参数必须为数组`
         }

      }

      // 日期
      else if (options === Date) {

         if (!validator.toDate(data + '')) {
            return `${key}参数必须为日期类型`
         }

      }

      // 布尔
      else if (options === Boolean) {

         if (typeof data !== 'boolean') {
            return `${key}参数必须为布尔值`
         }

      }

      //将验证数据保存至父节点
      parent[key] = data

   }

   // 选项为字符串（自定义数据类型）
   else if (typeof options === 'string') {

      if (customize[options]) {
         return customize[options](data, key)
      } else {
         return `${options}自定义类型不存在`
      }

      //将验证数据保存至父节点
      parent[key] = data
   }

}


// /**
//  * 通过Path获取数据
//  * @param {*} data 数据源
//  * @param {String} path 数据路径
//  */
// function pathGetData(data, path) {
//    let pathArray = path.split('.')
//    for (let key of pathArray) {
//       if (data[key] === undefined) {
//          return undefined
//       } else {
//          data = data[key]
//       }
//    }
//    return data
// }


// 扩展自定义验证中间件
// Verify.middleware = []
// Verify.use = function (fn) {
//    this.middleware.push(fn)
// }

module.exports = Verify