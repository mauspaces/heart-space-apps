---
tags: [reto]
---
# Enunciado del reto

**Create Health Monitoring Software for Astronauts on Space Missions** — NASA Space Apps Challenge 2026

## Contexto
- Artemis ya logró un sobrevuelo lunar tripulado ([[Programa Artemis]]); se planea enviar humanos a Marte.
- Misiones más largas = más exposición a los [[Cinco peligros]] del HRP.
- Problemas posibles: cambios inmunes, pérdida de densidad ósea, eventos cardiovasculares, nutrición inadecuada, salud conductual.
- **El astronauta debe poder evaluarse a sí mismo** para prevenir y tratar problemas.
- Indicadores sugeridos: presión arterial, frecuencia cardíaca, glucosa, temperatura, horas de sueño, ánimo.

## Objetivo
Crear una **herramienta visual** que ayude a los astronautas a evaluar su salud durante la misión y que dé **guía de tratamiento y mejora**.
- Entradas libres: teclado, clics, imágenes de cámara.
- Cualquier dato válido si representa un indicador de salud (p. ej. glucosa en mg/dL, imágenes de ultrasonido).

## Preguntas guía (los jueces evalúan contra esto)
1. ¿Qué mediciones se pueden hacer en el espacio? → [[Matriz clínica]]
2. ¿Por qué se necesita cada examen?
3. ¿Cómo afectan los peligros a los indicadores? → [[Cinco peligros]]
4. ¿Cuándo un resultado requiere atención de la tripulación o de los médicos en Tierra? → [[Motor de alertas]]
5. ¿Qué acciones previenen una condición crítica?

## Diseño de interfaz (sugerido por el reto)
- Animaciones e interactividad.
- **Figura humana con partes clicables** → [[Figura humana interactiva]]

## Consideraciones opcionales
- Distintos entornos: nave, estación, rover, base lunar/planetaria → [[Selector de entorno]]
- Recordatorios de mediciones como parte de la rutina
- [[Gamificación]]
- Gráficas dinámicas de tendencias
- Código de colores (semáforo)
- No asumir que el astronauta sabe todo: instrucciones y explicaciones simples
