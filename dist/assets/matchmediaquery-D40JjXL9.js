import{g as p}from"./assign-symbols-T0ZjG-DD.js";import{r as M}from"./css-mediaquery-DL3IrIfu.js";var s,c;function q(){if(c)return s;c=1;var o=M().match,n=typeof window<"u"?window.matchMedia:null;function h(t,a,r){var m=this,e;n&&!r&&(e=n.call(window,t)),e?(this.matches=e.matches,this.media=e.media,e.addListener(d)):(this.matches=o(t,a),this.media=t),this.addListener=f,this.removeListener=v,this.dispose=l;function f(i){e&&e.addListener(i)}function v(i){e&&e.removeListener(i)}function d(i){m.matches=i.matches,m.media=i.media}function l(){e&&e.removeListener(d)}}function u(t,a,r){return new h(t,a,r)}return s=u,s}var L=q();const x=p(L);export{x as m};
