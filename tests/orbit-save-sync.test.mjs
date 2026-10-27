import test from 'node:test';import assert from 'node:assert/strict';import {commitBatch,commitPending,SaveConflict,saveHttpError} from '../games/atelier/web/save-sync.mjs';
const before=()=>({game:{tick:0},session:{id:'run',block_hash:'a',actions:0}}),step=g=>g.tick++;
test('a lost commit response is acknowledged without applying inputs twice',async()=>{let state=before(),posts=0;const next=await commitBatch({before:state,inputs:[0,0],step,api:async(endpoint)=>{if(endpoint==='action'){posts++;state={game:{tick:2},session:{id:'run',block_hash:'b',actions:1}};throw Error('Lost response')}return state},wait:async()=>{}});assert.equal(posts,1);assert.equal(next.game.tick,2)});
test('a request lost before commit retries the identical base, then succeeds',async()=>{let posts=0;const state=before(),next=await commitBatch({before:state,inputs:[0],step,api:async(endpoint,body)=>{if(endpoint==='state')return state;posts++;assert.equal(body.expected_block,'a');if(posts===1)throw Error('Offline');return{game:{tick:1},session:{id:'run',block_hash:'b',actions:1}}},wait:async()=>{}});assert.equal(posts,2);assert.equal(next.game.tick,1)});
test('concurrent-tab state is not misinterpreted as a retry acknowledgement',async()=>{await assert.rejects(commitBatch({before:before(),inputs:[0],step,api:async()=>({game:{tick:9},session:{id:'run',block_hash:'z',actions:9}}),wait:async()=>{}}),SaveConflict)});
test('offline retries are bounded and never mutate the supplied confirmed state',async()=>{const state=before();let posts=0;await assert.rejects(commitBatch({before:state,inputs:[0],step,api:async e=>{if(e==='action')posts++;throw Error('Offline')},wait:async()=>{}}),/Offline/);assert.equal(posts,4);assert.deepEqual(state,before())});
test('a live save leaves newly arriving input for the next scheduled batch',async()=>{
 const pending=Array(45).fill(0);let posts=0;
 const next=await commitPending({before:before(),pending,step,api:async()=>{posts++;pending.push(...Array(6).fill(0));return{game:{tick:45},session:{id:'run',block_hash:'b',actions:1}}}});
 assert.equal(posts,1);assert.equal(next.game.tick,45);assert.equal(pending.length,6);
});
test('rate-limited saves wait for the cooldown and keep pending input until acknowledged',async()=>{
 const pending=[0,0],delays=[];let posts=0;
 const next=await commitPending({before:before(),pending,step,wait:async ms=>{delays.push(ms);assert.deepEqual(pending,[0,0]);},api:async endpoint=>{
  if(endpoint==='state')return before();if(++posts===1)throw saveHttpError(new Response('{}',{status:429,headers:{'Retry-After':'17'}}),{error:'Please wait before trying again.'});
  return{game:{tick:2},session:{id:'run',block_hash:'b',actions:1}};
 }});
 assert.equal(posts,2);assert.deepEqual(delays,[17000]);assert.equal(next.game.tick,2);assert.deepEqual(pending,[]);
});
test('a gateway without Retry-After receives a full one-minute rate-limit cooldown',async()=>{
 let posts=0;const delays=[];
 await commitBatch({before:before(),inputs:[0],step,wait:async ms=>delays.push(ms),api:async endpoint=>{
  if(endpoint==='state')return before();if(++posts===1)throw saveHttpError(new Response('{}',{status:429}),{error:'Please wait'});
  return{game:{tick:1},session:{id:'run',block_hash:'b',actions:1}};
 }});assert.deepEqual(delays,[60000]);
});
