import{r as E}from"./react-CmEzmXpT.js";import{r as jt}from"./react-dom-DXFLI2Zf.js";const It=["top","right","bottom","left"],X=Math.min,F=Math.max,st=Math.round,ot=Math.floor,V=t=>({x:t,y:t}),Yt={left:"right",right:"left",bottom:"top",top:"bottom"},qt={start:"end",end:"start"};function gt(t,e,n){return F(t,X(e,n))}function I(t,e){return typeof t=="function"?t(e):t}function Y(t){return t.split("-")[0]}function Z(t){return t.split("-")[1]}function xt(t){return t==="x"?"y":"x"}function yt(t){return t==="y"?"height":"width"}function U(t){return["top","bottom"].includes(Y(t))?"y":"x"}function bt(t){return xt(U(t))}function Xt(t,e,n){n===void 0&&(n=!1);const i=Z(t),o=bt(t),r=yt(o);let s=o==="x"?i===(n?"end":"start")?"right":"left":i==="start"?"bottom":"top";return e.reference[r]>e.floating[r]&&(s=ct(s)),[s,ct(s)]}function Ut(t){const e=ct(t);return[pt(t),e,pt(e)]}function pt(t){return t.replace(/start|end/g,e=>qt[e])}function Kt(t,e,n){const i=["left","right"],o=["right","left"],r=["top","bottom"],s=["bottom","top"];switch(t){case"top":case"bottom":return n?e?o:i:e?i:o;case"left":case"right":return e?r:s;default:return[]}}function Gt(t,e,n,i){const o=Z(t);let r=Kt(Y(t),n==="start",i);return o&&(r=r.map(s=>s+"-"+o),e&&(r=r.concat(r.map(pt)))),r}function ct(t){return t.replace(/left|right|bottom|top/g,e=>Yt[e])}function Jt(t){return{top:0,right:0,bottom:0,left:0,...t}}function kt(t){return typeof t!="number"?Jt(t):{top:t,right:t,bottom:t,left:t}}function lt(t){const{x:e,y:n,width:i,height:o}=t;return{width:i,height:o,top:n,left:e,right:e+i,bottom:n+o,x:e,y:n}}function Ct(t,e,n){let{reference:i,floating:o}=t;const r=U(e),s=bt(e),c=yt(s),f=Y(e),l=r==="y",a=i.x+i.width/2-o.width/2,u=i.y+i.height/2-o.height/2,m=i[c]/2-o[c]/2;let d;switch(f){case"top":d={x:a,y:i.y-o.height};break;case"bottom":d={x:a,y:i.y+i.height};break;case"right":d={x:i.x+i.width,y:u};break;case"left":d={x:i.x-o.width,y:u};break;default:d={x:i.x,y:i.y}}switch(Z(e)){case"start":d[s]-=m*(n&&l?-1:1);break;case"end":d[s]+=m*(n&&l?-1:1);break}return d}const Qt=async(t,e,n)=>{const{placement:i="bottom",strategy:o="absolute",middleware:r=[],platform:s}=n,c=r.filter(Boolean),f=await(s.isRTL==null?void 0:s.isRTL(e));let l=await s.getElementRects({reference:t,floating:e,strategy:o}),{x:a,y:u}=Ct(l,i,f),m=i,d={},h=0;for(let g=0;g<c.length;g++){const{name:p,fn:w}=c[g],{x:b,y,data:A,reset:x}=await w({x:a,y:u,initialPlacement:i,placement:m,strategy:o,middlewareData:d,rects:l,platform:s,elements:{reference:t,floating:e}});a=b??a,u=y??u,d={...d,[p]:{...d[p],...A}},x&&h<=50&&(h++,typeof x=="object"&&(x.placement&&(m=x.placement),x.rects&&(l=x.rects===!0?await s.getElementRects({reference:t,floating:e,strategy:o}):x.rects),{x:a,y:u}=Ct(l,m,f)),g=-1)}return{x:a,y:u,placement:m,strategy:o,middlewareData:d}};async function et(t,e){var n;e===void 0&&(e={});const{x:i,y:o,platform:r,rects:s,elements:c,strategy:f}=t,{boundary:l="clippingAncestors",rootBoundary:a="viewport",elementContext:u="floating",altBoundary:m=!1,padding:d=0}=I(e,t),h=kt(d),p=c[m?u==="floating"?"reference":"floating":u],w=lt(await r.getClippingRect({element:(n=await(r.isElement==null?void 0:r.isElement(p)))==null||n?p:p.contextElement||await(r.getDocumentElement==null?void 0:r.getDocumentElement(c.floating)),boundary:l,rootBoundary:a,strategy:f})),b=u==="floating"?{x:i,y:o,width:s.floating.width,height:s.floating.height}:s.reference,y=await(r.getOffsetParent==null?void 0:r.getOffsetParent(c.floating)),A=await(r.isElement==null?void 0:r.isElement(y))?await(r.getScale==null?void 0:r.getScale(y))||{x:1,y:1}:{x:1,y:1},x=lt(r.convertOffsetParentRelativeRectToViewportRelativeRect?await r.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:b,offsetParent:y,strategy:f}):b);return{top:(w.top-x.top+h.top)/A.y,bottom:(x.bottom-w.bottom+h.bottom)/A.y,left:(w.left-x.left+h.left)/A.x,right:(x.right-w.right+h.right)/A.x}}const Zt=t=>({name:"arrow",options:t,async fn(e){const{x:n,y:i,placement:o,rects:r,platform:s,elements:c,middlewareData:f}=e,{element:l,padding:a=0}=I(t,e)||{};if(l==null)return{};const u=kt(a),m={x:n,y:i},d=bt(o),h=yt(d),g=await s.getDimensions(l),p=d==="y",w=p?"top":"left",b=p?"bottom":"right",y=p?"clientHeight":"clientWidth",A=r.reference[h]+r.reference[d]-m[d]-r.floating[h],x=m[d]-r.reference[d],O=await(s.getOffsetParent==null?void 0:s.getOffsetParent(l));let v=O?O[y]:0;(!v||!await(s.isElement==null?void 0:s.isElement(O)))&&(v=c.floating[y]||r.floating[h]);const L=A/2-x/2,W=v/2-g[h]/2-1,D=X(u[w],W),B=X(u[b],W),T=D,P=v-g[h]-B,C=v/2-g[h]/2+L,j=gt(T,C,P),S=!f.arrow&&Z(o)!=null&&C!==j&&r.reference[h]/2-(C<T?D:B)-g[h]/2<0,M=S?C<T?C-T:C-P:0;return{[d]:m[d]+M,data:{[d]:j,centerOffset:C-j-M,...S&&{alignmentOffset:M}},reset:S}}}),te=function(t){return t===void 0&&(t={}),{name:"flip",options:t,async fn(e){var n,i;const{placement:o,middlewareData:r,rects:s,initialPlacement:c,platform:f,elements:l}=e,{mainAxis:a=!0,crossAxis:u=!0,fallbackPlacements:m,fallbackStrategy:d="bestFit",fallbackAxisSideDirection:h="none",flipAlignment:g=!0,...p}=I(t,e);if((n=r.arrow)!=null&&n.alignmentOffset)return{};const w=Y(o),b=U(c),y=Y(c)===c,A=await(f.isRTL==null?void 0:f.isRTL(l.floating)),x=m||(y||!g?[ct(c)]:Ut(c)),O=h!=="none";!m&&O&&x.push(...Gt(c,g,h,A));const v=[c,...x],L=await et(e,p),W=[];let D=((i=r.flip)==null?void 0:i.overflows)||[];if(a&&W.push(L[w]),u){const C=Xt(o,s,A);W.push(L[C[0]],L[C[1]])}if(D=[...D,{placement:o,overflows:W}],!W.every(C=>C<=0)){var B,T;const C=(((B=r.flip)==null?void 0:B.index)||0)+1,j=v[C];if(j)return{data:{index:C,overflows:D},reset:{placement:j}};let S=(T=D.filter(M=>M.overflows[0]<=0).sort((M,R)=>M.overflows[1]-R.overflows[1])[0])==null?void 0:T.placement;if(!S)switch(d){case"bestFit":{var P;const M=(P=D.filter(R=>{if(O){const k=U(R.placement);return k===b||k==="y"}return!0}).map(R=>[R.placement,R.overflows.filter(k=>k>0).reduce((k,q)=>k+q,0)]).sort((R,k)=>R[1]-k[1])[0])==null?void 0:P[0];M&&(S=M);break}case"initialPlacement":S=c;break}if(o!==S)return{reset:{placement:S}}}return{}}}};function Et(t,e){return{top:t.top-e.height,right:t.right-e.width,bottom:t.bottom-e.height,left:t.left-e.width}}function St(t){return It.some(e=>t[e]>=0)}const ee=function(t){return t===void 0&&(t={}),{name:"hide",options:t,async fn(e){const{rects:n}=e,{strategy:i="referenceHidden",...o}=I(t,e);switch(i){case"referenceHidden":{const r=await et(e,{...o,elementContext:"reference"}),s=Et(r,n.reference);return{data:{referenceHiddenOffsets:s,referenceHidden:St(s)}}}case"escaped":{const r=await et(e,{...o,altBoundary:!0}),s=Et(r,n.floating);return{data:{escapedOffsets:s,escaped:St(s)}}}default:return{}}}}};async function ne(t,e){const{placement:n,platform:i,elements:o}=t,r=await(i.isRTL==null?void 0:i.isRTL(o.floating)),s=Y(n),c=Z(n),f=U(n)==="y",l=["left","top"].includes(s)?-1:1,a=r&&f?-1:1,u=I(e,t);let{mainAxis:m,crossAxis:d,alignmentAxis:h}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return c&&typeof h=="number"&&(d=c==="end"?h*-1:h),f?{x:d*a,y:m*l}:{x:m*l,y:d*a}}const ie=function(t){return t===void 0&&(t=0),{name:"offset",options:t,async fn(e){var n,i;const{x:o,y:r,placement:s,middlewareData:c}=e,f=await ne(e,t);return s===((n=c.offset)==null?void 0:n.placement)&&(i=c.arrow)!=null&&i.alignmentOffset?{}:{x:o+f.x,y:r+f.y,data:{...f,placement:s}}}}},oe=function(t){return t===void 0&&(t={}),{name:"shift",options:t,async fn(e){const{x:n,y:i,placement:o}=e,{mainAxis:r=!0,crossAxis:s=!1,limiter:c={fn:p=>{let{x:w,y:b}=p;return{x:w,y:b}}},...f}=I(t,e),l={x:n,y:i},a=await et(e,f),u=U(Y(o)),m=xt(u);let d=l[m],h=l[u];if(r){const p=m==="y"?"top":"left",w=m==="y"?"bottom":"right",b=d+a[p],y=d-a[w];d=gt(b,d,y)}if(s){const p=u==="y"?"top":"left",w=u==="y"?"bottom":"right",b=h+a[p],y=h-a[w];h=gt(b,h,y)}const g=c.fn({...e,[m]:d,[u]:h});return{...g,data:{x:g.x-n,y:g.y-i,enabled:{[m]:r,[u]:s}}}}}},re=function(t){return t===void 0&&(t={}),{options:t,fn(e){const{x:n,y:i,placement:o,rects:r,middlewareData:s}=e,{offset:c=0,mainAxis:f=!0,crossAxis:l=!0}=I(t,e),a={x:n,y:i},u=U(o),m=xt(u);let d=a[m],h=a[u];const g=I(c,e),p=typeof g=="number"?{mainAxis:g,crossAxis:0}:{mainAxis:0,crossAxis:0,...g};if(f){const y=m==="y"?"height":"width",A=r.reference[m]-r.floating[y]+p.mainAxis,x=r.reference[m]+r.reference[y]-p.mainAxis;d<A?d=A:d>x&&(d=x)}if(l){var w,b;const y=m==="y"?"width":"height",A=["top","left"].includes(Y(o)),x=r.reference[u]-r.floating[y]+(A&&((w=s.offset)==null?void 0:w[u])||0)+(A?0:p.crossAxis),O=r.reference[u]+r.reference[y]+(A?0:((b=s.offset)==null?void 0:b[u])||0)-(A?p.crossAxis:0);h<x?h=x:h>O&&(h=O)}return{[m]:d,[u]:h}}}},se=function(t){return t===void 0&&(t={}),{name:"size",options:t,async fn(e){var n,i;const{placement:o,rects:r,platform:s,elements:c}=e,{apply:f=()=>{},...l}=I(t,e),a=await et(e,l),u=Y(o),m=Z(o),d=U(o)==="y",{width:h,height:g}=r.floating;let p,w;u==="top"||u==="bottom"?(p=u,w=m===(await(s.isRTL==null?void 0:s.isRTL(c.floating))?"start":"end")?"left":"right"):(w=u,p=m==="end"?"top":"bottom");const b=g-a.top-a.bottom,y=h-a.left-a.right,A=X(g-a[p],b),x=X(h-a[w],y),O=!e.middlewareData.shift;let v=A,L=x;if((n=e.middlewareData.shift)!=null&&n.enabled.x&&(L=y),(i=e.middlewareData.shift)!=null&&i.enabled.y&&(v=b),O&&!m){const D=F(a.left,0),B=F(a.right,0),T=F(a.top,0),P=F(a.bottom,0);d?L=h-2*(D!==0||B!==0?D+B:F(a.left,a.right)):v=g-2*(T!==0||P!==0?T+P:F(a.top,a.bottom))}await f({...e,availableWidth:L,availableHeight:v});const W=await s.getDimensions(c.floating);return h!==W.width||g!==W.height?{reset:{rects:!0}}:{}}}};function at(){return typeof window<"u"}function tt(t){return Ft(t)?(t.nodeName||"").toLowerCase():"#document"}function $(t){var e;return(t==null||(e=t.ownerDocument)==null?void 0:e.defaultView)||window}function z(t){var e;return(e=(Ft(t)?t.ownerDocument:t.document)||window.document)==null?void 0:e.documentElement}function Ft(t){return at()?t instanceof Node||t instanceof $(t).Node:!1}function H(t){return at()?t instanceof Element||t instanceof $(t).Element:!1}function _(t){return at()?t instanceof HTMLElement||t instanceof $(t).HTMLElement:!1}function Dt(t){return!at()||typeof ShadowRoot>"u"?!1:t instanceof ShadowRoot||t instanceof $(t).ShadowRoot}function it(t){const{overflow:e,overflowX:n,overflowY:i,display:o}=N(t);return/auto|scroll|overlay|hidden|clip/.test(e+i+n)&&!["inline","contents"].includes(o)}function ce(t){return["table","td","th"].includes(tt(t))}function ut(t){return[":popover-open",":modal"].some(e=>{try{return t.matches(e)}catch{return!1}})}function At(t){const e=Rt(),n=H(t)?N(t):t;return["transform","translate","scale","rotate","perspective"].some(i=>n[i]?n[i]!=="none":!1)||(n.containerType?n.containerType!=="normal":!1)||!e&&(n.backdropFilter?n.backdropFilter!=="none":!1)||!e&&(n.filter?n.filter!=="none":!1)||["transform","translate","scale","rotate","perspective","filter"].some(i=>(n.willChange||"").includes(i))||["paint","layout","strict","content"].some(i=>(n.contain||"").includes(i))}function le(t){let e=K(t);for(;_(e)&&!Q(e);){if(At(e))return e;if(ut(e))return null;e=K(e)}return null}function Rt(){return typeof CSS>"u"||!CSS.supports?!1:CSS.supports("-webkit-backdrop-filter","none")}function Q(t){return["html","body","#document"].includes(tt(t))}function N(t){return $(t).getComputedStyle(t)}function dt(t){return H(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.scrollX,scrollTop:t.scrollY}}function K(t){if(tt(t)==="html")return t;const e=t.assignedSlot||t.parentNode||Dt(t)&&t.host||z(t);return Dt(e)?e.host:e}function $t(t){const e=K(t);return Q(e)?t.ownerDocument?t.ownerDocument.body:t.body:_(e)&&it(e)?e:$t(e)}function nt(t,e,n){var i;e===void 0&&(e=[]),n===void 0&&(n=!0);const o=$t(t),r=o===((i=t.ownerDocument)==null?void 0:i.body),s=$(o);if(r){const c=wt(s);return e.concat(s,s.visualViewport||[],it(o)?o:[],c&&n?nt(c):[])}return e.concat(o,nt(o,[],n))}function wt(t){return t.parent&&Object.getPrototypeOf(t.parent)?t.frameElement:null}function Wt(t){const e=N(t);let n=parseFloat(e.width)||0,i=parseFloat(e.height)||0;const o=_(t),r=o?t.offsetWidth:n,s=o?t.offsetHeight:i,c=st(n)!==r||st(i)!==s;return c&&(n=r,i=s),{width:n,height:i,$:c}}function vt(t){return H(t)?t:t.contextElement}function J(t){const e=vt(t);if(!_(e))return V(1);const n=e.getBoundingClientRect(),{width:i,height:o,$:r}=Wt(e);let s=(r?st(n.width):n.width)/i,c=(r?st(n.height):n.height)/o;return(!s||!Number.isFinite(s))&&(s=1),(!c||!Number.isFinite(c))&&(c=1),{x:s,y:c}}const fe=V(0);function Bt(t){const e=$(t);return!Rt()||!e.visualViewport?fe:{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}}function ae(t,e,n){return e===void 0&&(e=!1),!n||e&&n!==$(t)?!1:e}function G(t,e,n,i){e===void 0&&(e=!1),n===void 0&&(n=!1);const o=t.getBoundingClientRect(),r=vt(t);let s=V(1);e&&(i?H(i)&&(s=J(i)):s=J(t));const c=ae(r,n,i)?Bt(r):V(0);let f=(o.left+c.x)/s.x,l=(o.top+c.y)/s.y,a=o.width/s.x,u=o.height/s.y;if(r){const m=$(r),d=i&&H(i)?$(i):i;let h=m,g=wt(h);for(;g&&i&&d!==h;){const p=J(g),w=g.getBoundingClientRect(),b=N(g),y=w.left+(g.clientLeft+parseFloat(b.paddingLeft))*p.x,A=w.top+(g.clientTop+parseFloat(b.paddingTop))*p.y;f*=p.x,l*=p.y,a*=p.x,u*=p.y,f+=y,l+=A,h=$(g),g=wt(h)}}return lt({width:a,height:u,x:f,y:l})}function Ot(t,e){const n=dt(t).scrollLeft;return e?e.left+n:G(z(t)).left+n}function Ht(t,e,n){n===void 0&&(n=!1);const i=t.getBoundingClientRect(),o=i.left+e.scrollLeft-(n?0:Ot(t,i)),r=i.top+e.scrollTop;return{x:o,y:r}}function ue(t){let{elements:e,rect:n,offsetParent:i,strategy:o}=t;const r=o==="fixed",s=z(i),c=e?ut(e.floating):!1;if(i===s||c&&r)return n;let f={scrollLeft:0,scrollTop:0},l=V(1);const a=V(0),u=_(i);if((u||!u&&!r)&&((tt(i)!=="body"||it(s))&&(f=dt(i)),_(i))){const d=G(i);l=J(i),a.x=d.x+i.clientLeft,a.y=d.y+i.clientTop}const m=s&&!u&&!r?Ht(s,f,!0):V(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-f.scrollLeft*l.x+a.x+m.x,y:n.y*l.y-f.scrollTop*l.y+a.y+m.y}}function de(t){return Array.from(t.getClientRects())}function me(t){const e=z(t),n=dt(t),i=t.ownerDocument.body,o=F(e.scrollWidth,e.clientWidth,i.scrollWidth,i.clientWidth),r=F(e.scrollHeight,e.clientHeight,i.scrollHeight,i.clientHeight);let s=-n.scrollLeft+Ot(t);const c=-n.scrollTop;return N(i).direction==="rtl"&&(s+=F(e.clientWidth,i.clientWidth)-o),{width:o,height:r,x:s,y:c}}function he(t,e){const n=$(t),i=z(t),o=n.visualViewport;let r=i.clientWidth,s=i.clientHeight,c=0,f=0;if(o){r=o.width,s=o.height;const l=Rt();(!l||l&&e==="fixed")&&(c=o.offsetLeft,f=o.offsetTop)}return{width:r,height:s,x:c,y:f}}function ge(t,e){const n=G(t,!0,e==="fixed"),i=n.top+t.clientTop,o=n.left+t.clientLeft,r=_(t)?J(t):V(1),s=t.clientWidth*r.x,c=t.clientHeight*r.y,f=o*r.x,l=i*r.y;return{width:s,height:c,x:f,y:l}}function Lt(t,e,n){let i;if(e==="viewport")i=he(t,n);else if(e==="document")i=me(z(t));else if(H(e))i=ge(e,n);else{const o=Bt(t);i={x:e.x-o.x,y:e.y-o.y,width:e.width,height:e.height}}return lt(i)}function Nt(t,e){const n=K(t);return n===e||!H(n)||Q(n)?!1:N(n).position==="fixed"||Nt(n,e)}function pe(t,e){const n=e.get(t);if(n)return n;let i=nt(t,[],!1).filter(c=>H(c)&&tt(c)!=="body"),o=null;const r=N(t).position==="fixed";let s=r?K(t):t;for(;H(s)&&!Q(s);){const c=N(s),f=At(s);!f&&c.position==="fixed"&&(o=null),(r?!f&&!o:!f&&c.position==="static"&&!!o&&["absolute","fixed"].includes(o.position)||it(s)&&!f&&Nt(t,s))?i=i.filter(a=>a!==s):o=c,s=K(s)}return e.set(t,i),i}function we(t){let{element:e,boundary:n,rootBoundary:i,strategy:o}=t;const s=[...n==="clippingAncestors"?ut(e)?[]:pe(e,this._c):[].concat(n),i],c=s[0],f=s.reduce((l,a)=>{const u=Lt(e,a,o);return l.top=F(u.top,l.top),l.right=X(u.right,l.right),l.bottom=X(u.bottom,l.bottom),l.left=F(u.left,l.left),l},Lt(e,c,o));return{width:f.right-f.left,height:f.bottom-f.top,x:f.left,y:f.top}}function xe(t){const{width:e,height:n}=Wt(t);return{width:e,height:n}}function ye(t,e,n){const i=_(e),o=z(e),r=n==="fixed",s=G(t,!0,r,e);let c={scrollLeft:0,scrollTop:0};const f=V(0);if(i||!i&&!r)if((tt(e)!=="body"||it(o))&&(c=dt(e)),i){const m=G(e,!0,r,e);f.x=m.x+e.clientLeft,f.y=m.y+e.clientTop}else o&&(f.x=Ot(o));const l=o&&!i&&!r?Ht(o,c):V(0),a=s.left+c.scrollLeft-f.x-l.x,u=s.top+c.scrollTop-f.y-l.y;return{x:a,y:u,width:s.width,height:s.height}}function mt(t){return N(t).position==="static"}function Pt(t,e){if(!_(t)||N(t).position==="fixed")return null;if(e)return e(t);let n=t.offsetParent;return z(t)===n&&(n=n.ownerDocument.body),n}function Vt(t,e){const n=$(t);if(ut(t))return n;if(!_(t)){let o=K(t);for(;o&&!Q(o);){if(H(o)&&!mt(o))return o;o=K(o)}return n}let i=Pt(t,e);for(;i&&ce(i)&&mt(i);)i=Pt(i,e);return i&&Q(i)&&mt(i)&&!At(i)?n:i||le(t)||n}const be=async function(t){const e=this.getOffsetParent||Vt,n=this.getDimensions,i=await n(t.floating);return{reference:ye(t.reference,await e(t.floating),t.strategy),floating:{x:0,y:0,width:i.width,height:i.height}}};function Ae(t){return N(t).direction==="rtl"}const Re={convertOffsetParentRelativeRectToViewportRelativeRect:ue,getDocumentElement:z,getClippingRect:we,getOffsetParent:Vt,getElementRects:be,getClientRects:de,getDimensions:xe,getScale:J,isElement:H,isRTL:Ae};function _t(t,e){return t.x===e.x&&t.y===e.y&&t.width===e.width&&t.height===e.height}function ve(t,e){let n=null,i;const o=z(t);function r(){var c;clearTimeout(i),(c=n)==null||c.disconnect(),n=null}function s(c,f){c===void 0&&(c=!1),f===void 0&&(f=1),r();const l=t.getBoundingClientRect(),{left:a,top:u,width:m,height:d}=l;if(c||e(),!m||!d)return;const h=ot(u),g=ot(o.clientWidth-(a+m)),p=ot(o.clientHeight-(u+d)),w=ot(a),y={rootMargin:-h+"px "+-g+"px "+-p+"px "+-w+"px",threshold:F(0,X(1,f))||1};let A=!0;function x(O){const v=O[0].intersectionRatio;if(v!==f){if(!A)return s();v?s(!1,v):i=setTimeout(()=>{s(!1,1e-7)},1e3)}v===1&&!_t(l,t.getBoundingClientRect())&&s(),A=!1}try{n=new IntersectionObserver(x,{...y,root:o.ownerDocument})}catch{n=new IntersectionObserver(x,y)}n.observe(t)}return s(!0),r}function Fe(t,e,n,i){i===void 0&&(i={});const{ancestorScroll:o=!0,ancestorResize:r=!0,elementResize:s=typeof ResizeObserver=="function",layoutShift:c=typeof IntersectionObserver=="function",animationFrame:f=!1}=i,l=vt(t),a=o||r?[...l?nt(l):[],...nt(e)]:[];a.forEach(w=>{o&&w.addEventListener("scroll",n,{passive:!0}),r&&w.addEventListener("resize",n)});const u=l&&c?ve(l,n):null;let m=-1,d=null;s&&(d=new ResizeObserver(w=>{let[b]=w;b&&b.target===l&&d&&(d.unobserve(e),cancelAnimationFrame(m),m=requestAnimationFrame(()=>{var y;(y=d)==null||y.observe(e)})),n()}),l&&!f&&d.observe(l),d.observe(e));let h,g=f?G(t):null;f&&p();function p(){const w=G(t);g&&!_t(g,w)&&n(),g=w,h=requestAnimationFrame(p)}return n(),()=>{var w;a.forEach(b=>{o&&b.removeEventListener("scroll",n),r&&b.removeEventListener("resize",n)}),u==null||u(),(w=d)==null||w.disconnect(),d=null,f&&cancelAnimationFrame(h)}}const Oe=ie,Ce=oe,Ee=te,Se=se,De=ee,Tt=Zt,Le=re,Pe=(t,e,n)=>{const i=new Map,o={platform:Re,...n},r={...o.platform,_c:i};return Qt(t,e,{...o,platform:r})};var rt=typeof document<"u"?E.useLayoutEffect:E.useEffect;function ft(t,e){if(t===e)return!0;if(typeof t!=typeof e)return!1;if(typeof t=="function"&&t.toString()===e.toString())return!0;let n,i,o;if(t&&e&&typeof t=="object"){if(Array.isArray(t)){if(n=t.length,n!==e.length)return!1;for(i=n;i--!==0;)if(!ft(t[i],e[i]))return!1;return!0}if(o=Object.keys(t),n=o.length,n!==Object.keys(e).length)return!1;for(i=n;i--!==0;)if(!{}.hasOwnProperty.call(e,o[i]))return!1;for(i=n;i--!==0;){const r=o[i];if(!(r==="_owner"&&t.$$typeof)&&!ft(t[r],e[r]))return!1}return!0}return t!==t&&e!==e}function zt(t){return typeof window>"u"?1:(t.ownerDocument.defaultView||window).devicePixelRatio||1}function Mt(t,e){const n=zt(t);return Math.round(e*n)/n}function ht(t){const e=E.useRef(t);return rt(()=>{e.current=t}),e}function $e(t){t===void 0&&(t={});const{placement:e="bottom",strategy:n="absolute",middleware:i=[],platform:o,elements:{reference:r,floating:s}={},transform:c=!0,whileElementsMounted:f,open:l}=t,[a,u]=E.useState({x:0,y:0,strategy:n,placement:e,middlewareData:{},isPositioned:!1}),[m,d]=E.useState(i);ft(m,i)||d(i);const[h,g]=E.useState(null),[p,w]=E.useState(null),b=E.useCallback(R=>{R!==O.current&&(O.current=R,g(R))},[]),y=E.useCallback(R=>{R!==v.current&&(v.current=R,w(R))},[]),A=r||h,x=s||p,O=E.useRef(null),v=E.useRef(null),L=E.useRef(a),W=f!=null,D=ht(f),B=ht(o),T=ht(l),P=E.useCallback(()=>{if(!O.current||!v.current)return;const R={placement:e,strategy:n,middleware:m};B.current&&(R.platform=B.current),Pe(O.current,v.current,R).then(k=>{const q={...k,isPositioned:T.current!==!1};C.current&&!ft(L.current,q)&&(L.current=q,jt.flushSync(()=>{u(q)}))})},[m,e,n,B,T]);rt(()=>{l===!1&&L.current.isPositioned&&(L.current.isPositioned=!1,u(R=>({...R,isPositioned:!1})))},[l]);const C=E.useRef(!1);rt(()=>(C.current=!0,()=>{C.current=!1}),[]),rt(()=>{if(A&&(O.current=A),x&&(v.current=x),A&&x){if(D.current)return D.current(A,x,P);P()}},[A,x,P,D,W]);const j=E.useMemo(()=>({reference:O,floating:v,setReference:b,setFloating:y}),[b,y]),S=E.useMemo(()=>({reference:A,floating:x}),[A,x]),M=E.useMemo(()=>{const R={position:n,left:0,top:0};if(!S.floating)return R;const k=Mt(S.floating,a.x),q=Mt(S.floating,a.y);return c?{...R,transform:"translate("+k+"px, "+q+"px)",...zt(S.floating)>=1.5&&{willChange:"transform"}}:{position:n,left:k,top:q}},[n,c,S.floating,a.x,a.y]);return E.useMemo(()=>({...a,update:P,refs:j,elements:S,floatingStyles:M}),[a,P,j,S,M])}const Te=t=>{function e(n){return{}.hasOwnProperty.call(n,"current")}return{name:"arrow",options:t,fn(n){const{element:i,padding:o}=typeof t=="function"?t(n):t;return i&&e(i)?i.current!=null?Tt({element:i.current,padding:o}).fn(n):{}:i?Tt({element:i,padding:o}).fn(n):{}}}},We=(t,e)=>({...Oe(t),options:[t,e]}),Be=(t,e)=>({...Ce(t),options:[t,e]}),He=(t,e)=>({...Le(t),options:[t,e]}),Ne=(t,e)=>({...Ee(t),options:[t,e]}),Ve=(t,e)=>({...Se(t),options:[t,e]}),_e=(t,e)=>({...De(t),options:[t,e]}),ze=(t,e)=>({...Te(t),options:[t,e]});export{Fe as a,Ve as b,ze as c,Ne as f,_e as h,He as l,We as o,Be as s,$e as u};
