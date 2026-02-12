import 'piccolore';
import { q as decodeKey } from './chunks/astro/server_BBC2-64G.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BTPVjsca.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/rodri/web/chapmagic/","cacheDir":"file:///C:/Users/rodri/web/chapmagic/node_modules/.astro/","outDir":"file:///C:/Users/rodri/web/chapmagic/dist/","srcDir":"file:///C:/Users/rodri/web/chapmagic/src/","publicDir":"file:///C:/Users/rodri/web/chapmagic/public/","buildClientDir":"file:///C:/Users/rodri/web/chapmagic/dist/client/","buildServerDir":"file:///C:/Users/rodri/web/chapmagic/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"fallback","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/send-email","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/send-email\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"send-email","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/send-email.ts","pathname":"/api/send-email","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"site":"https://chapmagic.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/rodri/web/chapmagic/src/pages/[lang]/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/rodri/web/chapmagic/src/pages/[lang]/privacy.astro",{"propagation":"none","containsHead":true}],["C:/Users/rodri/web/chapmagic/src/pages/[lang]/terms.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/api/send-email@_@ts":"pages/api/send-email.astro.mjs","\u0000@astro-page:src/pages/[lang]/privacy@_@astro":"pages/_lang_/privacy.astro.mjs","\u0000@astro-page:src/pages/[lang]/terms@_@astro":"pages/_lang_/terms.astro.mjs","\u0000@astro-page:src/pages/[lang]/index@_@astro":"pages/_lang_.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_Cs1PBP-B.mjs","C:/Users/rodri/web/chapmagic/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_DS_3Reqj.mjs","C:/Users/rodri/web/chapmagic/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_0_lang.Cq2AaGD0.js","C:/Users/rodri/web/chapmagic/src/layouts/BaseLayout.astro?astro&type=script&index=1&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_1_lang.DefsRYNo.js","C:/Users/rodri/web/chapmagic/src/components/Navbar.astro?astro&type=script&index=0&lang.ts":"_astro/Navbar.astro_astro_type_script_index_0_lang.DW1y2Zfg.js","C:/Users/rodri/web/chapmagic/src/components/sections/Hero.astro?astro&type=script&index=0&lang.ts":"_astro/Hero.astro_astro_type_script_index_0_lang.cB5QSNXE.js","C:/Users/rodri/web/chapmagic/src/components/sections/Shows.astro?astro&type=script&index=0&lang.ts":"_astro/Shows.astro_astro_type_script_index_0_lang.D4qGBHo-.js","C:/Users/rodri/web/chapmagic/src/components/sections/JuryVIP.astro?astro&type=script&index=0&lang.ts":"_astro/JuryVIP.astro_astro_type_script_index_0_lang.BUGtqH38.js","C:/Users/rodri/web/chapmagic/src/components/sections/Contact.astro?astro&type=script&index=0&lang.ts":"_astro/Contact.astro_astro_type_script_index_0_lang.CBXCt4er.js","C:/Users/rodri/web/chapmagic/src/components/SmoothScroll.astro?astro&type=script&index=0&lang.ts":"_astro/SmoothScroll.astro_astro_type_script_index_0_lang.DE82B6RV.js","C:/Users/rodri/web/chapmagic/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts":"_astro/ClientRouter.astro_astro_type_script_index_0_lang.CDGfc0hd.js","C:/Users/rodri/web/chapmagic/src/components/ui/GoldenBorder.astro?astro&type=script&index=0&lang.ts":"_astro/GoldenBorder.astro_astro_type_script_index_0_lang.CBRUCIty.js","C:/Users/rodri/web/chapmagic/src/components/ui/CounterVanilla.astro?astro&type=script&index=0&lang.ts":"_astro/CounterVanilla.astro_astro_type_script_index_0_lang.CwX8_aFj.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["C:/Users/rodri/web/chapmagic/src/components/sections/Contact.astro?astro&type=script&index=0&lang.ts","function u(){const n=document.getElementById(\"contact-form\"),t=document.getElementById(\"form-feedback\"),e=document.getElementById(\"submit-btn\");if(!n||!t||!e)return;const a=Date.now(),s=e.textContent,i=e.getAttribute(\"data-submitting-text\");n.addEventListener(\"submit\",async d=>{d.preventDefault(),t.classList.remove(\"text-green-500\",\"text-red-500\",\"hidden\"),t.textContent=\"\",e.setAttribute(\"disabled\",\"true\"),e.textContent=i;const c=new FormData(n),r=Object.fromEntries(c);r._timestamp=a.toString();try{const o=await fetch(\"/api/send-email\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify(r)}),m=await o.json();if(o.ok)t.textContent=\"¡Mensaje enviado con éxito!\",t.classList.add(\"text-green-500\"),n.reset();else throw new Error(m.error||\"Error\")}catch{t.textContent=\"Ocurrió un error. Por favor, inténtalo de nuevo.\",t.classList.add(\"text-red-500\")}finally{e.removeAttribute(\"disabled\"),e.textContent=s}})}document.addEventListener(\"astro:page-load\",u);"],["C:/Users/rodri/web/chapmagic/src/components/ui/GoldenBorder.astro?astro&type=script&index=0&lang.ts","function A(){if(window.innerWidth<768)return;document.querySelectorAll(\".golden-border-canvas\").forEach(s=>{const L=s.dataset.selector,y=parseInt(s.dataset.radius||\"16\"),d=s.closest(L||\"\");if(!d)return;const o=s.getContext(\"2d\");let h=0,c=0,u=null;function f(){const n=d.getBoundingClientRect(),r=window.devicePixelRatio||1;s.width=n.width*r,s.height=n.height*r,o.setTransform(r,0,0,r,0,0),s.style.width=n.width+\"px\",s.style.height=n.height+\"px\"}f();let w=null;window.addEventListener(\"resize\",()=>{w&&clearTimeout(w),w=setTimeout(f,150)});function b(n,r,e){return[{len:Math.PI*e/2,draw(i,t){i.arc(e,e,e,Math.PI,Math.PI+Math.PI/2*t,!1)}},{len:n-2*e,draw(i,t){i.lineTo(e+(n-2*e)*t,0)}},{len:Math.PI*e/2,draw(i,t){i.arc(n-e,e,e,-Math.PI/2,-Math.PI/2+Math.PI/2*t,!1)}},{len:r-2*e,draw(i,t){i.lineTo(n,e+(r-2*e)*t)}},{len:Math.PI*e/2,draw(i,t){i.arc(n-e,r-e,e,0,Math.PI/2*t,!1)}},{len:n-2*e,draw(i,t){i.lineTo(n-e-(n-2*e)*t,r)}},{len:Math.PI*e/2,draw(i,t){i.arc(e,r-e,e,Math.PI/2,Math.PI/2+Math.PI/2*t,!1)}},{len:r-2*e,draw(i,t){i.lineTo(0,r-e-(r-2*e)*t)}}]}function T(n){const r=s.width/(window.devicePixelRatio||1),e=s.height/(window.devicePixelRatio||1),i=y,t=.5;if(o.clearRect(0,0,s.width,s.height),n<=0)return;const m=b(r-2*t,e-2*t,i),x=m.reduce((a,l)=>a+l.len,0)/2,E=n*x;o.strokeStyle=\"#D4AF37\",o.lineWidth=1.5,o.lineCap=\"round\",o.lineJoin=\"round\",o.globalAlpha=.35+n*.25,o.shadowColor=\"rgba(212, 175, 55, 0.5)\",o.shadowBlur=6*n,o.save(),o.translate(t,t),o.beginPath(),o.moveTo(0,i);let P=E;for(let a=0;a<m.length&&P>0;a++){const l=m[a],I=Math.min(P/l.len,1);l.draw(o,I),P-=l.len}o.stroke(),o.beginPath(),o.moveTo(r-2*t,e-2*t-i);let M=E;for(let a=0;a<m.length&&M>0;a++){const l=m[(4+a)%m.length],I=Math.min(M/l.len,1);l.draw(o,I),M-=l.len}o.stroke(),o.restore()}function g(){const n=c-h;if(Math.abs(n)<.005){h=c,T(h),u=null;return}h+=n*(c>h?.12:.16),T(h),u=requestAnimationFrame(g)}function p(){s.style.opacity=\"1\",c=1,u||(u=requestAnimationFrame(g))}function v(){c=0,u||(u=requestAnimationFrame(g)),setTimeout(()=>{c===0&&(s.style.opacity=\"0\")},300)}d.addEventListener(\"mouseenter\",p),d.addEventListener(\"mouseleave\",v),document.addEventListener(\"astro:before-preparation\",()=>{window.removeEventListener(\"resize\",f),d.removeEventListener(\"mouseenter\",p),d.removeEventListener(\"mouseleave\",v)},{once:!0})})}document.addEventListener(\"astro:page-load\",A);"]],"assets":["/_astro/index.f5XOVLPe.css","/favicon.ico","/favicon.svg","/videos/golden-button.mp4","/_astro/BaseLayout.astro_astro_type_script_index_0_lang.Cq2AaGD0.js","/_astro/BaseLayout.astro_astro_type_script_index_1_lang.DefsRYNo.js","/_astro/ClientRouter.astro_astro_type_script_index_0_lang.CDGfc0hd.js","/_astro/CounterVanilla.astro_astro_type_script_index_0_lang.CwX8_aFj.js","/_astro/Hero.astro_astro_type_script_index_0_lang.cB5QSNXE.js","/_astro/index.CB87Sc6I.js","/_astro/JuryVIP.astro_astro_type_script_index_0_lang.BUGtqH38.js","/_astro/Navbar.astro_astro_type_script_index_0_lang.DW1y2Zfg.js","/_astro/ScrollTrigger.Cv03IO65.js","/_astro/Shows.astro_astro_type_script_index_0_lang.D4qGBHo-.js","/_astro/SmoothScroll.astro_astro_type_script_index_0_lang.DE82B6RV.js","/images/shows/show1.jpg","/images/shows/show2.jpg","/images/shows/show3.jpg","/images/shows/show4.jpg","/index.html","/index.html"],"i18n":{"fallbackType":"redirect","strategy":"pathname-prefix-always","locales":["es","en"],"defaultLocale":"es","domainLookupTable":{}},"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"HCI9MeWDk9YM+ixsd19P127KVKmTu6aHFsluUcFvIOE="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
