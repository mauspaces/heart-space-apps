/* UI strings. English is the default; Spanish via toggle. */
export const STR = {
 es:{
  tagline:"Health Evaluation & Astronaut Readiness Tool", crew:"Tripulante 01 · Misión HEART-1", skip:"Saltar",
  boot1:"Iniciando núcleo biomédico… <span>OK</span>", boot2:"Cargando línea base personal (días 1–14)… <span>OK</span>",
  boot3:"Sincronizando actígrafo y dosímetro… <span>OK</span>", boot4:"Modo autónomo: procesamiento local sin enlace a Tierra… <span>OK</span>",
  boot5:"Holograma listo. Bienvenido a bordo.",
  env_iss:"Estación (ISS)", env_transit:"Tránsito a Marte", env_mars:"Superficie de Marte", env_moon:"Base lunar",
  delay:"Retraso", streak:"Racha", checkin:"Check-in diario", vitals:"Signos vitales", holo_title:"HOLOGRAMA BIOMÉDICO",
  st0:"Normal", st1:"Revisar", st2:"Alerta", hint:"Arrastra para girar · toca un órgano para examinarlo",
  mission_day:"Día de misión", launch:"Lanzamiento", arrival:"Llegada a Marte",
  disclaimer:"Prototipo · datos simulados · umbrales ilustrativos, no para uso clínico",
  day:"Día", of:"de", gravity:"Gravedad", radrate:"Tasa de radiación",
  readiness:"Preparación para tarea crítica", readiness_for:"Caminata espacial (EVA)",
  ready:"Listo", review:"Revisar", notfit:"No apto", alerts:"Alertas inteligentes", no_alerts:"Sin alertas activas. Todo dentro de tu línea base.",
  radiation:"Radiación acumulada", career:"de tu límite de carrera (600 mSv)", rate_now:"Tasa en este entorno", projection:"Límite alcanzado en",
  days:"días", comms:"Enlace con Tierra", oneway:"Retraso en un sentido", send:"Enviar paquete médico a Tierra",
  arriving:"Paquete en tránsito · llega en", delivered:"Entregado a los médicos de vuelo. Respuesta estimada en", queued:"Paquete enviado",
  back:"Volver al resumen", what_now:"Qué hacer ahora", escalate:"Cuándo escalar a Tierra", hazards_lbl:"Peligros que lo afectan",
  how:"Cómo medir", metric:"Indicador", value:"Hoy", base:"Base", trend:"30 días",
  storm_title:"Evento de partículas solares", storm_sub:"Protones de alta energía llegan en minutos. Ve al refugio de tormenta.",
  s1:"Detén actividades fuera del blindaje", s2:"Dirígete al refugio de tormenta", s3:"Verifica tu dosímetro personal", s4:"Notifica a la tripulación",
  storm_ok:"En refugio. Dosis del evento reducida de ~42 a ~12 mSv.", storm_earth:"Aviso a Tierra en cola: llegará en",
  ci_title:"Check-in diario", ci_sub:"1 minuto. Tus respuestas se comparan con tu propia línea base.", ci_mood:"¿Cómo te sientes hoy?",
  ci_sleep:"Horas de sueño", ci_water:"Agua hoy (bolsas de 0.5 L)", ci_symp:"Síntomas", ci_crew:"Convivencia con la tripulación",
  ci_journal:"Diario (1–3 frases)", ci_journal_ph:"¿Qué fue lo mejor y lo más difícil de hoy?", cancel:"Cancelar", save:"Guardar check-in",
  ci_done:"Check-in guardado · racha", gravity_protocol:"Transición de gravedad: protocolo de aterrizaje activado (equilibrio y presión de pie/acostado).",
  hz_all:"Todos",
  sym_fatigue:"Fatiga", sym_throat:"Dolor de garganta", sym_chills:"Escalofríos", sym_headache:"Dolor de cabeza", sym_nausea:"Náusea", sym_skin:"Lesiones en la piel", sym_vision:"Visión borrosa",
  none:"Ninguno",
  pat_inf:"Posible infección incipiente", pat_inf_d:"Tu HRV bajó, duermes menos y tu temperatura sube respecto a tu línea base. Este patrón suele aparecer antes de la fiebre.",
  pat_inf_a:"Descansa, hidrátate, usa mascarilla en áreas comunes y mide tu temperatura cada 8 h.",
  pat_fever:"Fiebre con patrón infeccioso", pat_fever_a:"Aíslate en tu módulo, sigue el protocolo antipirético del botiquín y envía el paquete médico a Tierra.",
  pat_ops:"Riesgo operativo por fatiga", pat_ops_d:"Tres noches con poco sueño y ánimo bajo aumentan el riesgo de errores.", pat_ops_a:"Replanifica las tareas críticas y protege tu ventana de sueño hoy.",
  pat_met:"Desacondicionamiento metabólico", pat_met_d:"Bajó tu adherencia al ejercicio y tu glucosa en ayunas subió.", pat_met_a:"Recupera tus sesiones de resistencia y revisa tus porciones.",
  pat_hyd:"Hidratación baja", pat_hyd_d:"Dos días por debajo de 2 L: con el calcio que libera el hueso aumenta el riesgo de cálculos renales.", pat_hyd_a:"Toma al menos 2.5 L hoy.",
  pat_spe:"Tormenta solar en curso", pat_spe_d:"Dosis elevada por partículas solares.", pat_spe_a:"Permanece en el refugio hasta que el dosímetro vuelva a la tasa normal.",
  pat_grav:"Transición de gravedad", pat_grav_d:"Llegaste a 0.38 g tras meses en ingravidez: riesgo de mareo y desmayo al ponerte de pie.", pat_grav_a:"Muévete despacio y completa el test de equilibrio antes de cualquier tarea crítica.",
  f_sleep:"Sueño", f_hrv:"HRV", f_temp:"Temperatura", f_mood:"Ánimo", f_bal:"Equilibrio", f_sym:"Síntomas", f_spo2:"SpO₂", f_hr:"Frecuencia",
  hz_note_default:"Arrastra para girar · toca un órgano para examinarlo",
 },
 en:{
  tagline:"Health Evaluation & Astronaut Readiness Tool", crew:"Crew member 01 · Mission HEART-1", skip:"Skip",
  boot1:"Starting biomedical core… <span>OK</span>", boot2:"Loading personal baseline (days 1–14)… <span>OK</span>",
  boot3:"Syncing actigraph and dosimeter… <span>OK</span>", boot4:"Autonomous mode: on-board processing, no Earth link needed… <span>OK</span>",
  boot5:"Hologram ready. Welcome aboard.",
  env_iss:"Station (ISS)", env_transit:"Mars transit", env_mars:"Mars surface", env_moon:"Lunar base",
  delay:"Delay", streak:"Streak", checkin:"Daily check-in", vitals:"Vital signs", holo_title:"BIOMEDICAL HOLOGRAM",
  st0:"Normal", st1:"Review", st2:"Alert", hint:"Drag to rotate · tap an organ to inspect it",
  mission_day:"Mission day", launch:"Launch", arrival:"Mars arrival",
  disclaimer:"Prototype · simulated data · illustrative thresholds, not for clinical use",
  day:"Day", of:"of", gravity:"Gravity", radrate:"Radiation rate",
  readiness:"Readiness for critical task", readiness_for:"Spacewalk (EVA)",
  ready:"Ready", review:"Review", notfit:"Not fit", alerts:"Smart alerts", no_alerts:"No active alerts. Everything is within your baseline.",
  radiation:"Cumulative radiation", career:"of your career limit (600 mSv)", rate_now:"Rate in this environment", projection:"Limit reached in",
  days:"days", comms:"Earth link", oneway:"One-way delay", send:"Send medical packet to Earth",
  arriving:"Packet in transit · arrives in", delivered:"Delivered to flight surgeons. Estimated reply in", queued:"Packet sent",
  back:"Back to overview", what_now:"What to do now", escalate:"When to escalate to Earth", hazards_lbl:"Hazards that affect it",
  how:"How to measure", metric:"Indicator", value:"Today", base:"Baseline", trend:"30 days",
  storm_title:"Solar particle event", storm_sub:"High-energy protons arrive in minutes. Go to the storm shelter.",
  s1:"Stop activities outside shielding", s2:"Go to the storm shelter", s3:"Check your personal dosimeter", s4:"Notify the crew",
  storm_ok:"Sheltered. Event dose reduced from ~42 to ~12 mSv.", storm_earth:"Notice to Earth queued: arrives in",
  ci_title:"Daily check-in", ci_sub:"1 minute. Your answers are compared with your own baseline.", ci_mood:"How do you feel today?",
  ci_sleep:"Hours of sleep", ci_water:"Water today (0.5 L pouches)", ci_symp:"Symptoms", ci_crew:"Getting along with the crew",
  ci_journal:"Journal (1–3 sentences)", ci_journal_ph:"What was the best and the hardest part of today?", cancel:"Cancel", save:"Save check-in",
  ci_done:"Check-in saved · streak", gravity_protocol:"Gravity transition: landing protocol activated (balance and lying/standing blood pressure).",
  hz_all:"All",
  sym_fatigue:"Fatigue", sym_throat:"Sore throat", sym_chills:"Chills", sym_headache:"Headache", sym_nausea:"Nausea", sym_skin:"Skin lesions", sym_vision:"Blurred vision",
  none:"None",
  pat_inf:"Possible early infection", pat_inf_d:"Your HRV dropped, you sleep less and your temperature is rising versus your baseline. This pattern often appears before a fever.",
  pat_inf_a:"Rest, hydrate, wear a mask in common areas and check your temperature every 8 h.",
  pat_fever:"Fever with infectious pattern", pat_fever_a:"Isolate in your module, follow the onboard antipyretic protocol and send the medical packet to Earth.",
  pat_ops:"Operational risk from fatigue", pat_ops_d:"Three short nights plus low mood increase the risk of errors.", pat_ops_a:"Reschedule critical tasks and protect your sleep window tonight.",
  pat_met:"Metabolic deconditioning", pat_met_d:"Exercise adherence dropped and fasting glucose went up.", pat_met_a:"Resume your resistance sessions and review your portions.",
  pat_hyd:"Low hydration", pat_hyd_d:"Two days under 2 L: together with calcium released from bone, kidney-stone risk rises.", pat_hyd_a:"Drink at least 2.5 L today.",
  pat_spe:"Solar storm in progress", pat_spe_d:"Elevated dose from solar particles.", pat_spe_a:"Stay in the shelter until the dosimeter returns to the normal rate.",
  pat_grav:"Gravity transition", pat_grav_d:"You arrived at 0.38 g after months in weightlessness: risk of dizziness and fainting when standing.", pat_grav_a:"Move slowly and complete the balance test before any critical task.",
  f_sleep:"Sleep", f_hrv:"HRV", f_temp:"Temperature", f_mood:"Mood", f_bal:"Balance", f_sym:"Symptoms", f_spo2:"SpO₂", f_hr:"Heart rate",
  hz_note_default:"Drag to rotate · tap an organ to inspect it",
 }
};
export let LANG = 'en';
export const setLang = l => { LANG = STR[l] ? l : 'en'; };
export const t = k => (STR[LANG][k] ?? STR.en[k] ?? k);

/* Crew view, contagion and privacy strings. */
Object.assign(STR.en,{
  crew_view:"Crew", crew_title:"Crew status", crew_sub:"Crew Medical Officer dashboard · tap a crew member for their full view",
  crew_open:"Open individual view", readiness_short:"Readiness", top_alert:"Top alert", no_top_alert:"No active alerts",
  contagion_title:"Contagion alert", contagion_body:"{n} has a fever with an infectious pattern. Suggest monitoring the rest of the crew: temperature every 8 h, masks in common areas, shared spaces cleaned.",
  pat_cont:"Contagion risk in the crew", pat_cont_d:"{n}: fever with an infectious pattern in the crew.", pat_cont_a:"Wear a mask in common areas and measure your temperature every 8 h.",
  priv_title:"Privacy", priv_crew:"Share with crew", priv_earth:"Share with Earth", priv_on:"Shared", priv_off:"Private",
  priv_private:"Private. This astronaut chose not to share details with the crew.", priv_blocked:"Sharing with Earth is off for this astronaut. Turn it on to send the packet.",
  priv_note:"The astronaut controls their own data.", ms_status:"Status", role_CDR:"Commander", role_PLT:"Pilot", role_MS1:"Mission Specialist 1 · Crew Medical Officer", role_MS2:"Mission Specialist 2",
  demo_start:"Demo mode"
});
Object.assign(STR.es,{
  crew_view:"Tripulación", crew_title:"Estado de la tripulación", crew_sub:"Panel del Oficial Médico · toca a un tripulante para ver su vista completa",
  crew_open:"Abrir vista individual", readiness_short:"Preparación", top_alert:"Alerta principal", no_top_alert:"Sin alertas activas",
  contagion_title:"Alerta de contagio", contagion_body:"{n} tiene fiebre con patrón infeccioso. Sugerimos vigilar al resto de la tripulación: temperatura cada 8 h, mascarilla en áreas comunes y espacios compartidos limpios.",
  pat_cont:"Riesgo de contagio en la tripulación", pat_cont_d:"{n}: fiebre con patrón infeccioso en la tripulación.", pat_cont_a:"Usa mascarilla en áreas comunes y mide tu temperatura cada 8 h.",
  priv_title:"Privacidad", priv_crew:"Compartir con la tripulación", priv_earth:"Compartir con la Tierra", priv_on:"Compartido", priv_off:"Privado",
  priv_private:"Privado. Este astronauta decidió no compartir detalles con la tripulación.", priv_blocked:"Compartir con la Tierra está desactivado para este astronauta. Actívalo para enviar el paquete.",
  priv_note:"El astronauta controla sus propios datos.", ms_status:"Estado", role_CDR:"Comandante", role_PLT:"Piloto", role_MS1:"Especialista de misión 1 · Oficial Médica", role_MS2:"Especialista de misión 2",
  demo_start:"Modo demo"
});

Object.assign(STR.en,{ boot_line:"On Mars, the doctor is up to 20 minutes away. Every astronaut becomes their own first responder." });
Object.assign(STR.es,{ boot_line:"En Marte, el médico está hasta a 20 minutos. Cada astronauta se vuelve su propio primer respondiente." });

/* GO / NO-GO poll, evidence, escalation, light-time, data provenance. */
Object.assign(STR.en,{
  ready:"GO", review:"HOLD", notfit:"NO-GO",
  poll_title:"EVA go / no-go poll", poll_of:"{n} of {m} criteria not GO", poll_all:"All {m} criteria GO",
  poll_rule:"Any NO-GO stops the EVA. HOLD needs the Crew Medical Officer.", f_rad:"Radiation",
  vs_base:"vs baseline", ev_3n:"3-night avg", ev_5d:"5-day avg", ev_2d:"last 2 days",
  ev_spe:"Proton flux rising · event dose ~42 mSv unsheltered, ~12 mSv in shelter", ev_grav:"0.38 g after ~6 months at 0 g · balance unsteady",
  escalate_to:"Escalate to", esc_crew:"Crew Medical Officer", esc_earth:"Flight surgeon on Earth",
  lt_title:"Light-time to Earth", lt_ship:"Crew · now", lt_earth:"Earth", lt_recv:"Earth receives", lt_reply:"Earliest reply",
  lt_note:"Until the reply arrives, the crew acts on board.", lt_in:"in", lt_done:"done",
  src_hr:"Wrist wearable · continuous", src_hrv:"Wrist wearable · on waking", src_bp:"Cuff · seated, 07:10", src_spo2:"Pulse oximeter · 07:12",
  src_temp:"Thermometer · on waking", src_sleep:"Actigraphy · last night", src_glucose:"Glucometer · fasting", src_mood:"Daily check-in",
  src_water:"Pouch log · today", src_exercise:"Exercise log · 7 days",
  crew_poll:"Crew poll"
});
Object.assign(STR.es,{
  ready:"GO", review:"EN ESPERA", notfit:"NO GO",
  poll_title:"Votación GO / NO GO para EVA", poll_of:"{n} de {m} criterios no están en GO", poll_all:"Los {m} criterios en GO",
  poll_rule:"Cualquier NO GO detiene la EVA. EN ESPERA requiere al Oficial Médico.", f_rad:"Radiación",
  vs_base:"vs línea base", ev_3n:"promedio 3 noches", ev_5d:"promedio 5 días", ev_2d:"últimos 2 días",
  ev_spe:"Flujo de protones en aumento · dosis del evento ~42 mSv sin refugio, ~12 mSv en refugio", ev_grav:"0.38 g tras ~6 meses en 0 g · equilibrio inestable",
  escalate_to:"Escalar a", esc_crew:"Oficial Médico", esc_earth:"Médico de vuelo en Tierra",
  lt_title:"Tiempo-luz a la Tierra", lt_ship:"Tripulación · ahora", lt_earth:"Tierra", lt_recv:"La Tierra recibe", lt_reply:"Respuesta más temprana",
  lt_note:"Hasta que llegue la respuesta, la tripulación actúa a bordo.", lt_in:"en", lt_done:"listo",
  src_hr:"Wearable de muñeca · continuo", src_hrv:"Wearable de muñeca · al despertar", src_bp:"Brazalete · sentado, 07:10", src_spo2:"Oxímetro · 07:12",
  src_temp:"Termómetro · al despertar", src_sleep:"Actigrafía · anoche", src_glucose:"Glucómetro · en ayunas", src_mood:"Check-in diario",
  src_water:"Registro de bolsas · hoy", src_exercise:"Registro de ejercicio · 7 días",
  crew_poll:"Votación de la tripulación"
});
