// Reproducible guided interventions in a disposable R1 specimen.
// This file is a teaching/test harness, NOT an agent brain.
import {createCell,advanceCell,interveneCell,compareWithoutModules} from './r1-core.mjs';

export const GUIDES=Object.freeze([
  {id:'shield',title:'Strażnik kontra ogień',hint:'Dlaczego Strażnik zawetował krok, który Pilot był gotów wykonać?',expect:'Po ~420 tickach uruchom kontrprzebieg: w tym układzie Strażnik zapobiega wejściom w ogień.',focus:'veto',endTick:420},
  {id:'overload',title:'Koalicja przeszkadza',hint:'Czy spóźniony plan i przeskakujące priorytety odbierają Pilotowi skuteczność?',expect:'Przeskocz do ~800 ticków i porównaj z samym Pilotem. Tu koalicja potrafi opanować mniej alarmów.',focus:'refused',endTick:800},
  {id:'jam',title:'Kartograf bez łączności',hint:'Plan zostanie obliczony, ale jego odpowiedź może nie dotrzeć. Czy wykonawca działa nadal?',expect:'Wykonaj kolejne zdarzenia i znajdź „Utracono odpowiedź kartografa”.',focus:'refused',endTick:130},
]);
export function buildGuide(id,{seed=19}={}){
  if (!GUIDES.some(g=>g.id===id)) throw new Error('unknown guide');
  const world=createCell({seed,mode:'coalition'});
  if(id==='shield') interveneCell(world,{kind:'ignite',x:9,y:4});
  if(id==='overload'){
    advanceCell(world,180);interveneCell(world,{kind:'ignite',x:8,y:6});
    advanceCell(world,160);interveneCell(world,{kind:'alarm',x:16,y:9});
  }
  if(id==='jam') interveneCell(world,{kind:'jam'});
  return world;
}
export function guideOutcome(id,{seed=19}={}){
  const world=buildGuide(id,{seed});
  const horizon=GUIDES.find(g=>g.id===id).endTick;
  advanceCell(world,Math.max(0,horizon-world.t));
  return {world,comparison:compareWithoutModules(world)};
}
