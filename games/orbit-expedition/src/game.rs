use serde::{Serialize,Deserialize};
use serde_json::Value;
pub const ID:&str="myelin-orbit-expedition-v2";
pub const PORT:u16=8789;
pub const MAX_ACTIONS:u64=3600;
#[derive(Clone,Copy,Debug,PartialEq,Eq,Serialize,Deserialize)]
#[serde(rename_all="kebab-case")]
pub enum Kind{OrbitCourier}
impl Kind{pub fn parse(s:&str)->Result<Self,String>{serde_json::from_value(Value::String(s.into())).map_err(|_|"Unknown game".into())}pub fn id(self)->&'static str{"orbit-courier"}}
#[derive(Clone,Debug,Serialize,Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Entity{pub x:i32,pub y:i32,pub kind:i32,pub speed:i32,pub mark:i32}
#[derive(Clone,Debug,Serialize,Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Game{pub kind:Kind,pub version:i32,pub tick:i32,pub score:i32,pub lives:i32,pub level:i32,pub over:bool,pub won:bool,pub rng:i64,pub x:i32,pub y:i32,pub held:u8,pub cooldown:i32,pub energy:i32,pub cargo:i32,pub progress:i32,pub goal:i32,pub age:i32,pub invulnerable:i32,pub combo:i32,pub module:usize,pub shield:i32,pub checkpoints:i32,pub awaiting:bool,pub deliveries:i32,pub damage:i32,pub entities:Vec<Entity>}
fn dist(a:i32)->i32{let n=a.rem_euclid(3600);n.min(3600-n)}
impl Game{
pub fn new(kind:Kind)->Self{Self{kind,version:2,tick:0,score:0,lives:4,level:1,over:false,won:false,rng:73129,x:1800,y:1,held:0,cooldown:0,energy:4,cargo:0,progress:0,goal:4,age:0,invulnerable:90,combo:0,module:0,shield:0,checkpoints:0,awaiting:true,deliveries:0,damage:0,entities:vec![]}}
fn rand(&mut self)->i32{self.rng=self.rng*16807%2147483647;self.rng as i32}
fn mission(&self)->i32{(self.level-1)%3}
fn capacity(&self)->i32{if self.module==0{4}else{3}}
fn packets(&mut self){while self.entities.iter().filter(|e|e.kind==2).count()<3{let x=(self.x+650+self.rand()%2300)%3600;let y=1+self.rand()%2;self.entities.push(Entity{x,y,kind:2,speed:0,mark:0});}}
fn begin(&mut self){self.awaiting=false;self.x=1800;self.y=1;self.age=0;self.progress=0;self.goal=if self.mission()==1{2}else{4+(self.level-1)/4};self.cargo=0;self.checkpoints=0;self.energy=(self.energy+2).min(6);self.invulnerable=90;self.cooldown=0;self.shield=if self.module==1{1}else{0};self.held=0;self.entities.clear();for n in 0..2+self.level/3{self.entities.push(Entity{x:(n*713+500)%3600,y:n%3,kind:1,speed:if n%2==1{-1}else{1}*(5+self.level/2),mark:0});}if self.mission()==1{self.entities.push(Entity{x:1000,y:1,kind:3,speed:0,mark:1});self.entities.push(Entity{x:2450,y:2,kind:3,speed:0,mark:2});}self.packets();}
fn impact(&mut self){if self.invulnerable>0{return}self.invulnerable=75;if self.shield>0{self.shield=0;return}self.lives-=1;self.damage+=1;self.cargo=(self.cargo-1).max(0);self.combo=0;if self.lives==0{self.over=true}}
pub fn step(&mut self,input:u8){if self.over{return}self.tick+=1;if self.tick>=54000{self.over=true;return}if self.awaiting{let chosen=if input&32!=0{Some(0)}else if input&64!=0{Some(1)}else if input&128!=0{Some(2)}else{None};if let Some(m)=chosen{self.module=m;self.begin();}return}
self.age+=1;if self.invulnerable>0{self.invulnerable-=1}if self.cooldown>0{self.cooldown-=1}let edge=input&!self.held;self.held=input;
if edge&3!=0&&self.cooldown==0{self.y=(self.y+if edge&1!=0{-1}else{1}).clamp(0,2);self.cooldown=7;}
let cost=if self.module==2{1}else{2};if edge&16!=0&&self.energy>=cost{self.energy-=cost;self.x=(self.x+1800)%3600;self.invulnerable=self.invulnerable.max(24);}
if self.age%180==0{self.energy=(self.energy+1).min(6)}let speed=12+(self.level-1)/3+if input&8!=0{10}else{0}-if input&4!=0{8}else{0};self.x=(self.x+speed)%3600;
for n in 0..self.entities.len(){let e=&mut self.entities[n];if e.kind==1{e.x=(e.x+e.speed+3600)%3600;if self.level>=5&&self.age%300==0{e.y=(e.y+1)%3}let d=dist(e.x-self.x);if e.y==self.y&&d>80&&d<140&&e.mark==0{self.score+=5;e.mark=1}if d>220{e.mark=0}}
if e.y!=self.y||dist(e.x-self.x)>80{continue}let kind=e.kind;let mark=e.mark;if kind==1{self.impact()}if kind==2&&self.cargo<self.capacity(){self.cargo+=1;self.score+=20;self.energy=(self.energy+1).min(6);self.entities[n].kind=0;}if kind==3{self.checkpoints|=mark;}}
if self.level>=4&&self.age%480>=420&&self.y==2&&dist(self.x-self.level*493%3600)<300{self.impact()}
self.entities.retain(|e|e.kind!=0);self.packets();
if !self.over&&self.y==0&&dist(self.x)<100&&self.cargo>0&&(self.mission()!=1||self.checkpoints==3)&&(self.mission()!=2||input&4!=0){let full=self.cargo==self.capacity();self.progress+=if self.mission()==1{1}else{self.cargo};self.combo=(self.combo+1).min(5);self.score+=self.cargo*100+self.combo*25+if full{100}else{0};self.deliveries+=1;self.cargo=0;self.checkpoints=0;if self.progress>=self.goal{self.score+=250+(120-self.age/30).max(0)*2;self.lives=(self.lives+1).min(4);if self.level==12{self.won=true;self.over=true}else{self.level+=1;self.awaiting=true;self.held=0;}}}
}
pub fn valid_input(_:Kind,_:u8)->bool{true}
pub fn apply(&mut self,action:&Value)->Result<(),String>{#[derive(Deserialize)]#[serde(deny_unknown_fields)]struct Action{#[serde(rename="type")]kind:String,inputs:Vec<u8>}let a:Action=serde_json::from_value(action.clone()).map_err(|e|e.to_string())?;if a.kind!="ticks"||a.inputs.is_empty()||a.inputs.len()>60{return Err("Expected 1 to 60 inputs".into())}let mut next=self.clone();for input in a.inputs{next.step(input)}next.validate()?;*self=next;Ok(())}
pub fn validate(&self)->Result<(),String>{if self.score<0||self.score>10000000||self.age<0||self.age>54000||self.progress<0||self.progress>20||self.goal<2||self.goal>8||self.combo<0||self.combo>5||self.shield<0||self.shield>1||self.checkpoints<0||self.checkpoints>3||self.invulnerable<0||self.invulnerable>90||self.cooldown<0||self.cooldown>7||self.deliveries<0||self.deliveries>54000||self.damage<0||self.damage>54000||self.won&&!self.over||self.version!=2||self.tick<0||self.tick>54000||self.level<1||self.level>12||self.module>2||self.lives<0||self.lives>4||self.energy<0||self.energy>6||self.cargo<0||self.cargo>self.capacity()||self.x<0||self.x>=3600||self.y<0||self.y>2||self.entities.len()>16||self.rng<=0||self.rng>=2147483647||self.entities.iter().any(|e|e.x<0||e.x>=3600||e.y<0||e.y>2||e.kind<1||e.kind>3){return Err("Invalid expedition state".into())}Ok(())}
pub fn view(&self)->Value{serde_json::to_value(self).expect("state")}
}
