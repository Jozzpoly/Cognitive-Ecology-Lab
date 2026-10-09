import test from 'node:test';
import assert from 'node:assert/strict';
import {createCell,advanceCell,interveneCell} from '../src/r1-core.mjs';
import {buildGuide} from '../src/r1-guides.mjs';
import {makeSession,replaySession} from '../src/r1-replay.mjs';

test('same actions and timed mode/module changes reproduce the same material counters',()=>{
  const init={mode:'coalition',modules:{dispatch:true,planner:true,guardian:true}};
  const w=createCell({seed:19,mode:init.mode,modules:init.modules});
  const actions=[];
  function world(kind,x,y){
    const event={tick:w.t,type:'world',kind,x,y};actions.push(event);
    interveneCell(w,{kind,x,y});
  }
  world('ignite',9,4);
  advanceCell(w,72);
  w.modules.planner=false;actions.push({tick:w.t,type:'module',module:'planner',enabled:false});
  advanceCell(w,45);
  w.mode='local';actions.push({tick:w.t,type:'mode',mode:'local'});
  world('alarm',13,9);
  advanceCell(w,283);
  const serialized=JSON.parse(JSON.stringify(makeSession(w,init,actions)));
  const reproduced=replaySession(serialized);
  assert.equal(reproduced.verified,true);
  assert.equal(reproduced.world.t,w.t);
  assert.deepEqual(reproduced.summary,serialized.expected);
  assert.deepEqual(reproduced.world.actor,w.actor);
});
test('guided preset can be exported as an action recipe and replayed',()=>{
  const original=buildGuide('overload');
  advanceCell(original,120);
  const actions=original.interventions.map(e=>({tick:e.tick,type:'world',kind:e.kind,x:e.x,y:e.y}));
  const serialized=makeSession(original,{mode:'coalition',modules:{dispatch:true,planner:true,guardian:true}},actions);
  assert.equal(replaySession(serialized).verified,true);
});
test('untrusted replay input is bounded and illegal commands rejected',()=>{
  const empty=makeSession(createCell(),{mode:'coalition',modules:{dispatch:true,planner:true,guardian:true}},[]);
  assert.throws(()=>replaySession({...empty,until:20000}));
  assert.throws(()=>replaySession({...empty,chronicle:Array.from({length:201},()=>({tick:0,type:'world',kind:'jam'}))}));
  assert.throws(()=>replaySession({...empty,chronicle:[{tick:0,type:'world',kind:'teleport'}]}));
  assert.throws(()=>replaySession({...empty,chronicle:[{tick:0,type:'module',module:'admin',enabled:true}]}));
  assert.throws(()=>replaySession({...empty,chronicle:[{tick:1,type:'mode',mode:'local'},{tick:0,type:'mode',mode:'coalition'}]}));
});
