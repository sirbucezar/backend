function a(t,e){if(t===e)return!0;if(!t||!e)return!1;const n=Object.keys(t),c=Object.keys(e),l=n.length;if(c.length!==l)return!1;for(let r=0;r<l;r++){const s=n[r];if(t[s]!==e[s]||!Object.prototype.hasOwnProperty.call(e,s))return!1}return!0}export{a as s};
