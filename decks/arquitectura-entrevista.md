---
deck: Arquitectura DDD — Entrevista
tags: [ddd, hexagonal, arquitectura]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es DDD?
Domain-Driven Design. Organiza el código alrededor del dominio (reglas de negocio), separándolo del framework.

## ¿Cuáles son las capas en DDD?
Domain (reglas, PHP puro), Application (casos de uso), Infrastructure (DB, adaptadores), Presentation (controllers).

## ¿Qué es un aggregate root?
La entrada única a un cluster de objetos. Protege invariantes. En el proyecto Supermercado, `Venta` es el aggregate root de `LineaDeVenta`.

## ¿Qué es un value object?
Objeto inmutable identificado por sus valores. `Dinero(150, "ARS")`. No tiene ID. Auto-validante.

## ¿Por qué Dinero usa centavos (int)?
Float tiene error de precisión (0.1 + 0.2 != 0.3). Con enteros en centavos, los cálculos siempre son exactos.

## ¿Qué son ports y adapters?
Ports = interfaces del dominio. Adapters = implementaciones concretas. Permite cambiar la infraestructura sin tocar el dominio.

## ¿Cuál es la regla de dependencias?
Siempre hacia adentro. Domain no depende de nadie. Infrastructure depende de Domain (implementa interfaces).

## ¿Por qué el dominio no usa Eloquent?
Para mantenerlo puro y portable. Si el dominio depende de Eloquent, no se puede testear sin DB ni cambiar de ORM.

## ¿Qué es un evento de dominio?
Algo que pasó en el dominio (ej: CompraRealizada). El aggregate lo graba; los listeners reaccionan. Desacopla.

## ¿Cómo testeo el dominio sin DB?
Las clases de dominio son PHP puro. En los tests Unit, instancias los objetos directamente (`new Venta(...)`) sin necesidad de base de datos.
