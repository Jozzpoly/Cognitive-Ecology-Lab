import test from 'node:test';
import assert from 'node:assert/strict';
import {createCell,advanceCell,interveneCell,compareWithoutModules,privateSignals,privateMap,plannerProposal} from '../src/r1-core.mjs';

test('R1 deterministic replay across timed Owner interventions',()=>{
 const play=()=>{const w=createCell({seed:23});advanceCell(w,24);interveneCell(w,{kind:'ignite',x:7,y:5});
 advanceCell(w,92);interveneCell(w,{kind:'alarm',x:3,y:9});interveneCell(w,{kind:'jam'});
 advanceCell(w,204);interveneCell(w,{kind:'wall',x:5,y:5});advanceCell(w,520);return w;};
 assert.deepEqual(play(),play());
});
test('R1 processes are different clocked modules and can disagree',()=>{
 const w=createCell({seed:19});advanceCell(w,560);
 assert.ok(w.cognition.pilot.calls>w.cognition.dispatch.calls);
 assert.ok(w.cognition.dispatch.calls>w.cognition.planner.calls);
 assert.ok(w.cognition.planner.last);
 assert.ok(w.cognition.broker.disagreement>0);
 assert.ok(w.logs.some(x=>x.type==='reply'));
 assert.ok(w.logs.some(x=>['veto','refused'].includes(x.type)));
});
test('R1 planner gets only sensed map; remote hidden changes cannot leak',()=>{
 const a=createCell({seed:7}),b=createCell({seed:7});
 interveneCell(b,{kind:'ignite',x:18,y:12});interveneCell(b,{kind:'wall',x:17,y:12});
 assert.deepEqual(privateSignals(a),privateSignals(b)); assert.deepEqual(privateMap(a),privateMap(b));
 advanceCell(a,2);advanceCell(b,2);assert.deepEqual(privateMap(a),privateMap(b));
 assert.deepEqual(plannerProposal(privateMap(a),privateSignals(a)[0]),plannerProposal(privateMap(b),privateSignals(b)[0]));
 const cp=privateMap(a);cp.walls.push('9,6');assert.notDeepEqual(cp,privateMap(a));
});
test('R1 local baseline remains functional, not an intentionally helpless straw man',()=>{
 const w=createCell({seed:15,mode:'local'});advanceCell(w,620);
 assert.equal(w.cognition.planner.calls,0);assert.equal(w.cognition.dispatch.calls,0);
 assert.ok(w.actor.steps>0);assert.ok(w.resolved+w.expired>0);
});
test('R1 counterfactual matches true local run without mutating live World',()=>{
 const w=createCell({seed:31,mode:'local'});advanceCell(w,30);
 interveneCell(w,{kind:'ignite',x:8,y:6});advanceCell(w,40);
 interveneCell(w,{kind:'alarm',x:10,y:5});advanceCell(w,250);
 const before=JSON.stringify(w),cmp=compareWithoutModules(w);
 assert.deepEqual(cmp.live,cmp.control);assert.equal(cmp.eventCount,2);assert.equal(cmp.matchedTicks,w.t);
 assert.equal(JSON.stringify(w),before);
});
test('R1 invalid commands rejected',()=>{
 const w=createCell();assert.throws(()=>createCell({mode:'bad'}));
 assert.throws(()=>advanceCell(w,-1));assert.throws(()=>interveneCell(w,{kind:'teleport',x:10,y:1}));
 assert.throws(()=>interveneCell(w,{kind:'ignite',x:100,y:1}));
});
test('R1 honest negative synergy: cheap Pilot beats coordinated cell in bounded scenario',()=>{
 const w=createCell({seed:19});advanceCell(w,180);interveneCell(w,{kind:'ignite',x:8,y:6});
 advanceCell(w,160);interveneCell(w,{kind:'alarm',x:16,y:9});advanceCell(w,460);
 const {live,control}=compareWithoutModules(w);
 assert.ok(control.resolved>0);assert.ok(live.resolved<control.resolved);
 assert.ok(live.plans>0 && live.disagreements>0);
});
test('R1 guardian causally shields rover in targeted hazard',()=>{
 const w=createCell({seed:19});interveneCell(w,{kind:'ignite',x:9,y:4});advanceCell(w,420);
 const {live,control}=compareWithoutModules(w);
 assert.ok(control.hits>0);assert.equal(live.hits,0);assert.ok(w.cognition.guardian.veto>0);
});
