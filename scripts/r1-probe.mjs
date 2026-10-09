import {createCell,advanceCell,interveneCell,compareWithoutModules} from '../src/r1-core.mjs';
const sample={protocol:'R1 incident-cell: authored clocks, bounded seed sweep, NOT LLM/life/Owner proof',cases:40,horizon:800,results:[]};
for(const scenario of ['ordinary','heat-front']){
 const x={scenario,coalitionWins:0,localWins:0,ties:0,deliveriesDeltaSum:0,coalitionHazardHits:0,localHazardHits:0};
 for(let seed=1;seed<=40;seed++){
  const w=createCell({seed});
  if(scenario==='heat-front')interveneCell(w,{kind:'ignite',x:9,y:4});
  advanceCell(w,180);interveneCell(w,{kind:'ignite',x:8,y:6});
  advanceCell(w,160);interveneCell(w,{kind:'alarm',x:16,y:9});
  advanceCell(w,460);
  const {live,control}=compareWithoutModules(w);
  const d=live.resolved-control.resolved;
  x.deliveriesDeltaSum+=d;x.coalitionHazardHits+=live.hits;x.localHazardHits+=control.hits;
  if(d>0)x.coalitionWins++;else if(d<0)x.localWins++;else x.ties++;
 }
 x.meanDelta=+(x.deliveriesDeltaSum/40).toFixed(3);
 sample.results.push(x);
}
console.log(JSON.stringify(sample,null,2));
