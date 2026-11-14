/* Mission HEART-1 crew, portrayed by the H.E.A.R.T team members.
   Roles and storylines are a scenario; ALL health data is simulated and says nothing about the real people.
   Bios describe the scenario role only (no invented biography).
   `photo`: optional portrait in /public/crew/ (falls back to initials). Set `photoAI: true` for AI-generated
   portraits: a visible "AI-generated" mark is then drawn on the image, as Space Apps requires.
   `gen` holds each member's baseline offsets and storyline parameters for sim.js. */
const TEAM = { es: 'Equipo H.E.A.R.T · Space Apps 2026', en: 'H.E.A.R.T team · Space Apps 2026' };
export const CREW = [
  { id:'cdr', role:'CDR', name:'Mauro Acuña Olivarria', callsign:'Beacon', initials:'MA', seed:142,
    photo:'crew/mauro-suit.jpg', photoAI:true,
    agency:TEAM,
    bio:{es:'Comandante de la misión en este escenario. Dirige las decisiones de seguridad de la tripulación y la votación GO / NO GO de las tareas críticas.',
         en:'Mission commander in this scenario. Leads crew safety decisions and the go / no-go call for critical tasks.'},
    story:{es:'Infección temprana → fiebre (días 139–146).',en:'Early infection → fever (days 139–146).'},
    gen:{ off:{}, inf:{c:142,w:3.2,from:134,to:150,amp:1}, q3:0, exDrop:null, dry:null, marsVest:false } },
  { id:'plt', role:'PLT', name:'Alan Alberto López García', callsign:'Rook', initials:'AL', seed:2207,
    photo:'crew/alan-suit.jpg', photoAI:true,
    agency:TEAM,
    bio:{es:'Piloto en este escenario. Responsable de navegación, acoplamiento y la secuencia de aterrizaje.',
         en:'Pilot in this scenario. Responsible for navigation, docking and the landing sequence.'},
    story:{es:'Pérdida de sueño y ánimo bajo, "tercer cuarto" (días 95–120).',en:'Sleep loss and low mood, "third-quarter" dip (days 95–120).'},
    gen:{ off:{hr:3,hrv:-4,sleep:-0.2,mood:-0.1,glucose:2,ex:2}, inf:null, q3:{c:107,w:9,sleep:2.1,mood:1.8}, exDrop:[95,120], dry:null, marsVest:false } },
  { id:'ms1', role:'MS1', name:'Jorge René Moreno Mata', callsign:'Sage', initials:'JM', seed:5813,
    photo:'crew/jorge-suit.jpg', photoAI:true,
    agency:{es:TEAM.es+' · Oficial Médico',en:TEAM.en+' · Crew Medical Officer'},
    bio:{es:'Especialista de misión 1 y Oficial Médico de la tripulación en este escenario. Corre la votación de la tripulación y es el primer enlace con los médicos de vuelo.',
         en:'Mission specialist 1 and Crew Medical Officer in this scenario. Runs the crew poll and is the first link to the flight surgeons.'},
    story:{es:'Baja hidratación → riesgo de cálculo renal (días 126–131).',en:'Low hydration → kidney-stone risk (days 126–131).'},
    gen:{ off:{hr:-4,hrv:5,sbp:-3,dbp:-2,temp:-0.05,sleep:0.2,water:0.1,ex:1}, inf:null, q3:0, exDrop:null, dry:[126,131], marsVest:false } },
  { id:'ms2', role:'MS2', name:'David Sevilla', callsign:'Boreal', initials:'DS', seed:9031,
    photo:'crew/david-suit.jpg', photoAI:true,
    agency:TEAM,
    bio:{es:'Especialista de misión 2 en este escenario. Dirige la ciencia de superficie después del aterrizaje en Marte.',
         en:'Mission specialist 2 in this scenario. Leads surface science after the Mars landing.'},
    story:{es:'Problemas vestibulares / ortostáticos al llegar a la superficie de Marte.',en:'Vestibular / orthostatic issues on Mars-surface arrival.'},
    gen:{ off:{hr:1,hrv:2,sbp:2,sleep:-0.1,glucose:-1,ex:-2}, inf:null, q3:0, exDrop:null, dry:null, marsVest:true } },
];
export const CREW_BY_ID = Object.fromEntries(CREW.map(m=>[m.id,m]));
