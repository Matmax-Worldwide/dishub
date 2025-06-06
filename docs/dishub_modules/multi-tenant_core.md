# Multi-Tenant Core

## Propósito
Define estructura para múltiples empresas/clientes con módulos activables.

## Modelos Clave
- Tenant
- TenantModule
- TenantDomain
- Block
- Module

## Relaciones
- Un Tenant pertenece a un Block y tiene múltiples Modules activados.

## Uso
Usado para dar servicio a varios clientes en un solo sistema escalable.