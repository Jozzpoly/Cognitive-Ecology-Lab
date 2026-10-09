// Typed, bounded replay of **actions**, not a serialized omniscient World snapshot.
// The experiment is reproducible only with the matching pinned source SHA.
import {createCell,advanceCell,interveneCell,summaryCell,MODULES,MODE} from './r1-core.mjs';
const validInt=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const allowedWorld=['ignite','cool','wall','alarm','jam'];

export function makeSession(world,initial,chronicle){
  return {
    format:'cel.r1.actions.v1',
    seed:world.seed,initial:{mode:initial.mode,modules:{...initial.modules}},
    until:world.t,
    chronicle:chronicle.map(e=>({...e})),
    expected:summaryCell(world),
    caveat:'Replaying requires compatible R1 source; outcomes are model-free and not Owner-qualified.',
  };
}
export function replaySession(payload){
  assert(payload&&payload.format==='cel.r1.actions.v1','Nieobsługiwany format zapisu');
  assert(validInt(payload.seed,0,4294967295),'Niepoprawne ziarno');
  assert(validInt(payload.until,0,10000),'Limit odtwarzania wynosi 10000 ticków');
  assert(payload.initial&&MODE.includes(payload.initial.mode),'Niepoprawny tryb początkowy');
  const modules=payload.initial.modules;
  assert(modules&&MODULES.every(k=>typeof modules[k]==='boolean'),'Niepoprawne moduły startowe');
  assert(Array.isArray(payload.chronicle)&&payload.chronicle.length<=200,'Maksymalnie 200 działań');
  const w=createCell({seed:payload.seed,mode:payload.initial.mode,modules});
  let current=0;
  for(const a of payload.chronicle){
    assert(validInt(a.tick,current,payload.until),'Niechronologiczne lub nielegalne zdarzenie');
    advanceCell(w,a.tick-current);current=a.tick;
    if(a.type==='world'){
      assert(allowedWorld.includes(a.kind),'Nielegalna interwencja');
      const old=w.interventions.length;
      interveneCell(w,{kind:a.kind,x:a.x,y:a.y});
      assert(w.interventions.length===old+1,'Nielegalna lub odrzucona interwencja');
    }else if(a.type==='mode'){
      assert(MODE.includes(a.mode),'Nielegalny tryb');
      w.mode=a.mode;
    }else if(a.type==='module'){
      assert(MODULES.includes(a.module)&&typeof a.enabled==='boolean','Nielegalny moduł');
      w.modules[a.module]=a.enabled;
    }else throw new Error('Nieznany typ zdarzenia');
  }
  advanceCell(w,payload.until-current);
  const actual=summaryCell(w);
  const verified=payload.expected ? JSON.stringify(actual)===JSON.stringify(payload.expected) : null;
  return {world:w,summary:actual,verified};
}
