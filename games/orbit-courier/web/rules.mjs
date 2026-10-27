export const ROUTES=[
 ['First Light','freight','Learn the lanes. Bank four capsules at the inner dock.'],
 ['The Long Way','relay','Visit both navigation beacons before each delivery.'],
 ['Silent Signal','rescue','Rescue the stranded capsules. A steady approach pays.'],
 ['Solar Crossing','freight','Outer-lane radiation is forecast before it strikes.'],
 ['Switchyard','relay','Interceptors change lanes. Watch their approach markers.'],
 ['Blue Meridian','rescue','Carry more, or bank early to protect your streak.'],
 ['Copper Run','freight','Longer patrols make speed control essential.'],
 ['Far Relay','relay','Two beacons. One dock. Plan the return leg.'],
 ['Afterglow','rescue','Solar weather and patrols compete for safe space.'],
 ['Night Freight','freight','A complete load earns a larger contract bonus.'],
 ['Last Transmission','relay','Use phase hops to cross blocked sectors.'],
 ['Homeward','rescue','Bring the final capsules home. Every hull point matters.']
];
export const MODULES=[{name:'Courier',detail:'4 cargo · full-load bonus',capacity:4},{name:'Warden',detail:'3 cargo · shield absorbs one impact per route',capacity:3},{name:'Strider',detail:'3 cargo · phase costs 1 energy',capacity:3}];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=a=>{const n=(a%3600+3600)%3600;return Math.min(n,3600-n)},rnd=g=>(g.rng=g.rng*16807%2147483647);
export function createGame(){return {kind:'orbit-courier',version:2,tick:0,score:0,lives:4,level:1,over:false,won:false,rng:73129,x:1800,y:1,held:0,cooldown:0,energy:4,cargo:0,progress:0,goal:4,age:0,invulnerable:90,combo:0,module:0,shield:0,checkpoints:0,awaiting:true,deliveries:0,damage:0,entities:[]}}
export const mission=g=>(g.level-1)%3;
export const capacity=g=>MODULES[g.module].capacity;
export const flare=g=>({angle:(g.level*493)%3600,warning:g.level>=4&&g.age%480>=330&&g.age%480<420,active:g.level>=4&&g.age%480>=420});
function begin(g){g.awaiting=false;g.x=1800;g.y=1;g.age=0;g.progress=0;g.goal=mission(g)===1?2:4+Math.floor((g.level-1)/4);g.cargo=0;g.checkpoints=0;g.energy=Math.min(6,g.energy+2);g.invulnerable=90;g.cooldown=0;g.shield=g.module===1?1:0;g.held=0;g.entities=[];
 for(let n=0;n<2+Math.floor(g.level/3);n++)g.entities.push({x:(n*713+500)%3600,y:n%3,kind:1,speed:(n%2?-1:1)*(5+Math.floor(g.level/2)),mark:0});
 if(mission(g)===1){g.entities.push({x:1000,y:1,kind:3,speed:0,mark:1},{x:2450,y:2,kind:3,speed:0,mark:2})}packets(g);
}
function packets(g){while(g.entities.filter(e=>e.kind===2).length<3)g.entities.push({x:(g.x+650+rnd(g)%2300)%3600,y:1+rnd(g)%2,kind:2,speed:0,mark:0})}
function impact(g){if(g.invulnerable)return;g.invulnerable=75;if(g.shield){g.shield=0;return}g.lives--;g.damage++;g.cargo=Math.max(0,g.cargo-1);g.combo=0;if(!g.lives)g.over=true}
export function step(g,input){if(g.over)return;g.tick++;if(g.tick>=54000){g.over=true;return}if(g.awaiting){const chosen=input&32?0:input&64?1:input&128?2:-1;if(chosen>=0){g.module=chosen;begin(g)}return}
 g.age++;if(g.invulnerable)g.invulnerable--;if(g.cooldown)g.cooldown--;const edge=input&~g.held;g.held=input;
 if(edge&3&&!g.cooldown){g.y=clamp(g.y+(edge&1?-1:1),0,2);g.cooldown=7}
 const cost=g.module===2?1:2;if(edge&16&&g.energy>=cost){g.energy-=cost;g.x=(g.x+1800)%3600;g.invulnerable=Math.max(g.invulnerable,24)}
 if(g.age%180===0)g.energy=Math.min(6,g.energy+1);
 const speed=12+Math.floor((g.level-1)/3)+(input&8?10:0)-(input&4?8:0);g.x=(g.x+speed)%3600;
 for(const e of g.entities){if(e.kind===1){e.x=(e.x+e.speed+3600)%3600;if(g.level>=5&&g.age%300===0)e.y=(e.y+1)%3;const d=dist(e.x-g.x);if(e.y===g.y&&d>80&&d<140&&!e.mark){g.score+=5;e.mark=1}if(d>220)e.mark=0}
  if(e.y!==g.y||dist(e.x-g.x)>80)continue;if(e.kind===1)impact(g);if(e.kind===2&&g.cargo<capacity(g)){g.cargo++;g.score+=20;g.energy=Math.min(6,g.energy+1);e.kind=0}if(e.kind===3)g.checkpoints|=e.mark;
 }
 const weather=flare(g);if(weather.active&&g.y===2&&dist(g.x-weather.angle)<300)impact(g);
 g.entities=g.entities.filter(e=>e.kind);packets(g);
 if(!g.over&&g.y===0&&dist(g.x)<100&&g.cargo&&(mission(g)!==1||g.checkpoints===3)&&(mission(g)!==2||input&4)){
  const full=g.cargo===capacity(g);g.progress+=mission(g)===1?1:g.cargo;g.combo=Math.min(5,g.combo+1);g.score+=g.cargo*100+g.combo*25+(full?100:0);g.deliveries++;g.cargo=0;g.checkpoints=0;
  if(g.progress>=g.goal){g.score+=250+Math.max(0,120-Math.floor(g.age/30))*2;g.lives=Math.min(4,g.lives+1);if(g.level===12){g.won=true;g.over=true}else{g.level++;g.awaiting=true;g.held=0;}}
 }
}
