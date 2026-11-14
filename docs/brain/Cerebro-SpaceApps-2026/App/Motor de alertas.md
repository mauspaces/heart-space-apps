---
tags: [app]
---
# Motor de alertas

## Tres capas
1. **Desviación de la línea base:** z-score en ventana móvil de 7 días (o EWMA).
2. **Patrones combinados** (NASA: los peligros se alimentan entre sí → [[Cinco peligros]]; [[ARCHeR]] estudia el efecto combinado):
   - HRV ↓ + sueño ↓ + temperatura ↑ → posible infección incipiente
   - Tiempo de reacción ↑ + sueño ↓ varios días → riesgo operativo, replanificar tareas críticas
   - Hidratación ↓ + esfuerzo alto + ritmo irregular → cadena tipo [[Apolo 15 - Jim Irwin]]
   - Fiebre en un tripulante → alerta de contagio al resto
3. **Reglas absolutas:** SpO₂ < 90 %, evento solar, dolor torácico, desmayo, falta de aire.

## Niveles
- 🟢 Normal
- 🟡 **Tripulación:** el astronauta y el oficial médico actúan con el protocolo
- 🔴 **Médico en Tierra:** protocolo inmediato + paquete de datos para el siguiente enlace

## Cada alerta explica
"Tu HRV bajó 18 % en 5 días y dormiste 5.2 h de promedio" → **qué hacer**, **por qué**, **cuándo escalar**, y el tiempo de respuesta esperado según el [[Selector de entorno]].

Umbrales: [[Matriz clínica]] (ilustrativos).
