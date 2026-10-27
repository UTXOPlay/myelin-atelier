export const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
export class SaveConflict extends Error{constructor(state){super('This run changed in another tab. Your confirmed progress has been restored.');this.state=state;}}
// Never blindly replay a POST: its response can be lost after the native commit.
export async function commitBatch({before,inputs,step,api,onRetry=()=>{},wait=ms=>new Promise(r=>setTimeout(r,ms)),attempts=4}){
 const expected=structuredClone(before.game);for(const input of inputs)step(expected,input);
 const payload={session_id:before.session.id,expected_block:before.session.block_hash,action:{type:'ticks',inputs}};
 function inspect(state){if(state.session.id!==before.session.id)throw new SaveConflict(state);if(state.session.block_hash===before.session.block_hash)return false;if(state.session.actions===before.session.actions+1&&canonical(state.game)===canonical(expected))return true;throw new SaveConflict(state);}
 let failure;
 for(let n=0;n<attempts;n++){
  try{const next=await api('action',payload);if(!inspect(next))throw Error('The save did not advance.');return next;}
  catch(error){if(error instanceof SaveConflict)throw error;failure=error;onRetry(n+1);try{const current=await api('state');if(inspect(current))return current;}catch(recovery){if(recovery instanceof SaveConflict)throw recovery;failure=recovery;}
   if(n<attempts-1)await wait(400*2**n);
  }
 }
 throw failure;
}
