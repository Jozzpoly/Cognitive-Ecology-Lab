import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDES, buildGuide, guideOutcome } from '../src/r1-guides.mjs';
import { createCell, advanceCell, compareWithoutModules } from '../src/r1-core.mjs';

test('R1 guide scenarios are real, reproducible runtime states, not mock animation',()=>{
  for(const guide of GUIDES){
    const a=buildGuide(guide.id),b=buildGuide(guide.id);
    assert.deepEqual(a,b,guide.id);
    assert.equal(a.mode,'coalition');
    assert.ok(a.interventions.length>0,guide.id+' must inject actual World interventions');
    assert.ok(a.t <= guide.endTick);
    assert.deepEqual(guideOutcome(guide.id).world,guideOutcome(guide.id).world);
  }
  assert.throws(()=>buildGuide('not-a-guide'));
});
test('guardian case has scoped protective value without inflated throughput claims',()=>{
  const {world,comparison}=guideOutcome('shield');
  assert.equal(world.t,420);
  assert.ok(comparison.control.hits>0);
  assert.equal(comparison.live.hits,0);
  assert.ok(comparison.live.guardianVeto>0);
});
test('coordination-overhead guide keeps a capable local baseline',()=>{
  const {world,comparison}=guideOutcome('overload');
  assert.equal(world.t,800);
  assert.ok(comparison.control.resolved>comparison.live.resolved);
  assert.ok(comparison.live.plans>0&&comparison.live.disagreements>0);
});
test('jammed planner still permits reactive Pilot to continue',()=>{
  const {world}=guideOutcome('jam');
  assert.ok(world.actor.steps>0);
  assert.ok(world.logs.some(e=>e.text.includes('Utracono odpowiedź kartografa')));
});
test('spatial counterfactual returns source-world-independent, bounded ghost',()=>{
  const w=createCell({seed:19});advanceCell(w,200);
  const before=JSON.stringify(w),result=compareWithoutModules(w);
  assert.equal(JSON.stringify(w),before);
  assert.deepEqual(result.ghost.actor,{x:result.ghost.actor.x,y:result.ghost.actor.y});
  assert.ok(result.ghost.trail.length>0&&result.ghost.trail.length<=90);
});
