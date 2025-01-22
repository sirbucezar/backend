function p(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}/*!
 * assign-symbols <https://github.com/jonschlinkert/assign-symbols>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */var o,f;function y(){return f||(f=1,o=function(t,s){if(t===null||typeof t>"u")throw new TypeError("expected first argument to be an object.");if(typeof s>"u"||typeof Symbol>"u"||typeof Object.getOwnPropertySymbols!="function")return t;for(var b=Object.prototype.propertyIsEnumerable,a=Object(t),i=arguments.length,u=0;++u<i;)for(var e=Object(arguments[u]),l=Object.getOwnPropertySymbols(e),r=0;r<l.length;r++){var n=l[r];b.call(e,n)&&(a[n]=e[n])}return a}),o}export{p as g,y as r};
