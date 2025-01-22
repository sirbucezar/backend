/*!
 * get-value <https://github.com/jonschlinkert/get-value>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */var f,l;function V(){if(l)return f;l=1,f=function(e,t,s,a,c){if(!g(e)||!t)return e;if(t=r(t),s&&(t+="."+r(s)),a&&(t+="."+r(a)),c&&(t+="."+r(c)),t in e)return e[t];for(var i=t.split("."),h=i.length,u=-1;e&&++u<h;){for(var n=i[u];n[n.length-1]==="\\";)n=n.slice(0,-1)+"."+i[++u];e=e[n]}return e};function g(e){return e!==null&&(typeof e=="object"||typeof e=="function")}function r(e){return e?Array.isArray(e)?e.join("."):e:""}return f}export{V as r};
