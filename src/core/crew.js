/* Fictional crew of four (Artemis-style). Invented people; all health data is simulated.
   `gen` holds each member's baseline offsets and storyline parameters for sim.js. */
export const CREW = [
  { id:'cdr', role:'CDR', name:'Amara Okonkwo-Reyes', callsign:'Beacon', initials:'AO', seed:142,
    agency:{es:'Agencia principal',en:'Lead agency'},
    bio:{es:'Comandante de la misión. Piloto de pruebas con tres misiones previas; lidera las decisiones de seguridad de la tripulación.',
         en:'Mission commander. Test pilot with three previous flights; leads crew safety decisions.'},
    story:{es:'Infección temprana → fiebre (días 139–146).',en:'Early infection → fever (days 139–146).'},
    gen:{ off:{}, inf:{c:142,w:3.2,from:134,to:150,amp:1}, q3:0, exDrop:null, dry:null, marsVest:false } },
  { id:'plt', role:'PLT', name:'Mateo Silvestre', callsign:'Rook', initials:'MS', seed:2207,
    agency:{es:'Agencia principal',en:'Lead agency'},
    bio:{es:'Piloto. Ingeniero aeroespacial especializado en navegación y acoplamiento; el más joven de la tripulación.',
         en:'Pilot. Aerospace engineer specialised in navigation and docking; the youngest of the crew.'},
    story:{es:'Pérdida de sueño y ánimo bajo, "tercer cuarto" (días 95–120).',en:'Sleep loss and low mood, "third-quarter" dip (days 95–120).'},
    gen:{ off:{hr:3,hrv:-4,sleep:-0.2,mood:-0.1,glucose:2,ex:2}, inf:null, q3:{c:107,w:9,sleep:2.1,mood:1.8}, exDrop:[95,120], dry:null, marsVest:false } },
  { id:'ms1', role:'MS1', name:'Dr. Priya Nandakumar', callsign:'Sage', initials:'PN', seed:5813,
    agency:{es:'Agencia principal · Oficial Médica de la tripulación',en:'Lead agency · Crew Medical Officer'},
    bio:{es:'Especialista de misión 1 y Oficial Médica de la tripulación. Médica de urgencias y medicina aeroespacial; atiende a sus compañeros y a sí misma.',
         en:'Mission specialist 1 and Crew Medical Officer. Emergency and aerospace physician; cares for her crewmates and herself.'},
    story:{es:'Baja hidratación → riesgo de cálculo renal (días 126–131).',en:'Low hydration → kidney-stone risk (days 126–131).'},
    gen:{ off:{hr:-4,hrv:5,sbp:-3,dbp:-2,temp:-0.05,sleep:0.2,water:0.1,ex:1}, inf:null, q3:0, exDrop:null, dry:[126,131], marsVest:false } },
  { id:'ms2', role:'MS2', name:'Étienne Beaulieu', callsign:'Boreal', initials:'EB', seed:9031,
    agency:{es:'Agencia socia (CSA)',en:'Partner agency (CSA)'},
    bio:{es:'Especialista de misión 2 de una agencia socia internacional. Geólogo planetario; primera misión espacial.',
         en:'Mission specialist 2 from an international partner agency. Planetary geologist; first spaceflight.'},
    story:{es:'Problemas vestibulares / ortostáticos al llegar a la superficie de Marte.',en:'Vestibular / orthostatic issues on Mars-surface arrival.'},
    gen:{ off:{hr:1,hrv:2,sbp:2,sleep:-0.1,glucose:-1,ex:-2}, inf:null, q3:0, exDrop:null, dry:null, marsVest:true } },
];
export const CREW_BY_ID = Object.fromEntries(CREW.map(m=>[m.id,m]));
