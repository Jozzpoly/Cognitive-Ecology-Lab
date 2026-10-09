import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('public landing and canonical r1 page are one exact specimen, never split',async()=>{
  const [index,r1]=await Promise.all([readFile(new URL('../index.html',import.meta.url),'utf8'),readFile(new URL('../r1.html',import.meta.url),'utf8')]);
  assert.equal(index,r1,'index.html must match r1.html exactly; R0 is separate in r0.html');
  for(const id of ['playbook','next-event','decision-why','view-private','ghost-on','save-session','export-session','download-session','import-session','session-data']){
    assert.ok(index.includes('id="'+id+'"'),'missing Owner R1 control '+id);
  }
});
