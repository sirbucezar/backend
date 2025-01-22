import{r as c}from"./isobject-nfgcKFwJ.js";/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */var i,o;function u(){if(o)return i;o=1;var s=c();function n(r){return s(r)===!0&&Object.prototype.toString.call(r)==="[object Object]"}return i=function(a){var t,e;return!(n(a)===!1||(t=a.constructor,typeof t!="function")||(e=t.prototype,n(e)===!1)||e.hasOwnProperty("isPrototypeOf")===!1)},i}export{u as r};
