import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const path=process.argv[2];assert.ok(path,'R1 HTML dump required');
const html=await readFile(path,'utf8');
assert.match(html,/<html\b[^>]*data-r1-ready="true"/i,'R1 browser module never mounted');
const tick=html.match(/<html\b[^>]*data-r1-tick="(\d+)"/i);
assert.ok(tick&&Number(tick[1])>100,'R1 simulation failed to progress in Chromium');
assert.match(html,/<html\b[^>]*data-r1-compare-ready="true"/i,'R1 causal replay not executed');
for(const id of ['arena','planner-on','guardian-on','dispatch-on','planner-accepted','guardian-veto','compare-output']){
 assert.ok(html.includes('id="'+id+'"'),'R1 missing interactive control '+id);
}
assert.ok(html.includes('Opanowane alarmy'),'R1 replay output table missing');
console.log('R1 browser smoke PASS — tick='+tick[1]+'; live modules, canvas, legal perturbation and local counterfactual');

if(process.argv.includes('--tour')){
  assert.match(html, /<html\b[^>]*data-r1-guide-ready="shield"/i,'guided R1 scenario did not initialize');
  assert.match(html, /<html\b[^>]*data-r1-private-ready="true"/i,'actor-perception mode failed');
  assert.match(html, /<html\b[^>]*data-r1-ghost-ready="true"/i,'Pilot-only spatial ghost not computed');
  for(const id of ['playbook','guide-title','guide-explain','decision-why','tile-info','ghost-on','view-private','next-event']){
    assert.ok(html.includes('id="'+id+'"'),'guided R1 interactive surface missing '+id);
  }
  assert.ok(html.includes('Strażnik kontra ogień'),'guided challenge title is not rendered');
  console.log('R1 guided tour PASS — guardian case, private view and matched Pilot ghost');
}
