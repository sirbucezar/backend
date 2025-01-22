/*!
 * is-extendable <https://github.com/jonschlinkert/is-extendable>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */var i,s;function c(){return s||(s=1,i=function(n){return typeof n<"u"&&n!==null&&(typeof n=="object"||typeof n=="function")}),i}var f,l;function x(){if(l)return f;l=1;var a=c();f=function(e){a(e)||(e={});for(var r=arguments.length,u=1;u<r;u++){var o=arguments[u];a(o)&&n(e,o)}return e};function n(t,e){for(var r in e)d(e,r)&&(t[r]=e[r])}function d(t,e){return Object.prototype.hasOwnProperty.call(t,e)}return f}export{x as r};
