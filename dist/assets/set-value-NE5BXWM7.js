import{r as m}from"./split-string-CjBVBAbN.js";import{r as b}from"./extend-shallow-BULDLYXf.js";import{r as h}from"./is-plain-object-CQ5lcLGj.js";/*!
 * is-extendable <https://github.com/jonschlinkert/is-extendable>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */var f,v;function E(){return v||(v=1,f=function(i){return typeof i<"u"&&i!==null&&(typeof i=="object"||typeof i=="function")}),f}/*!
 * set-value <https://github.com/jonschlinkert/set-value>
 *
 * Copyright (c) 2014-2015, 2017, Jon Schlinkert.
 * Released under the MIT License.
 */var s,x;function g(){if(x)return s;x=1;var o=m(),i=b(),c=h(),l=E();s=function(r,n,u){if(!l(r)||(Array.isArray(n)&&(n=[].concat.apply([],n).join(".")),typeof n!="string"))return r;for(var d=o(n,{sep:".",brackets:!0}).filter(q),p=d.length,a=-1,e=r;++a<p;){var t=d[a];if(a!==p-1){l(e[t])||(e[t]={}),e=e[t];continue}c(e[t])&&c(u)?e[t]=i({},e[t],u):e[t]=u}return r};function q(r){return r!=="__proto__"&&r!=="constructor"&&r!=="prototype"}return s}export{g as r};
