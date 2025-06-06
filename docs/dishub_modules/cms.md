# Content Management System (CMS)

## Propósito
Permite crear páginas dinámicas, secciones modulares, y manejar traducciones.

## Modelos Clave
- Page
- PageSection
- PageTemplate
- TranslationFile
- Translation

## Relaciones
- Page tiene múltiples PageSections.
- Traducciones están enlazadas a archivos por locale.

## Uso
Sistema multilingüe para generar páginas de forma dinámica por tenant.