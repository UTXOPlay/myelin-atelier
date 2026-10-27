export function layout(w,h){const compact=w<800||h<500;const top=h<500?48:80,bottom=h<500?66:w<800?138:110;const diameter=Math.min(w-(compact?24:Math.min(480,w*.25)),h-top-bottom);const scale=Math.max(.12,diameter/940);return{scale,x:w/2-500*scale,y:top+(h-top-bottom)/2-500*scale,compact};}
export function inverse(x,y,rect){const t=layout(rect.width,rect.height);return{x:(x-rect.left-t.x)/t.scale,y:(y-rect.top-t.y)/t.scale};}
export const orbitPoint=(angle,lane)=>{const r=[205,310,415][lane],a=angle*Math.PI/1800-Math.PI/2;return{x:500+Math.cos(a)*r,y:500+Math.sin(a)*r}};
