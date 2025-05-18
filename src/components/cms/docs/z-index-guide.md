# Guía de z-index para el CMS

Este documento proporciona orientación sobre el uso de valores z-index en los diferentes componentes del CMS.

## Jerarquía de z-index

La jerarquía de z-index ayuda a garantizar que los elementos se superpongan correctamente.

| Componente | z-index | Descripción |
| ---------- | ------- | ----------- |
| MediaSelector | 2147483647 | Selectores de medios y modales críticos. Valor máximo posible. |
| Modales y diálogos | 9999 | Modales generales, diálogos y popups. |
| Dropdowns | 50-100 | Menús desplegables y tooltips. |
| Header/navegación fija | 50 | Elementos de navegación que deben permanecer visibles. |
| Elementos flotantes | 10-30 | Elementos que flotan sobre el contenido pero no son cruciales. |
| Contenido normal | 0-5 | Elementos de contenido estándar. |
| Elementos de fondo | -1 | Elementos que deben aparecer detrás del contenido normal. |

## Consideraciones importantes

1. **Portales React**: Los componentes que usan `createPortal` para renderizarse directamente en el body deben tener un z-index muy alto para garantizar que aparezcan por encima de todo.

2. **Encapsulamiento**: Los componentes anidados pueden tener problemas con z-index si no se establece `position: relative` o `position: absolute` correctamente.

3. **Aislamiento**: La propiedad CSS `isolation: isolate` puede ayudar a crear nuevos contextos de apilamiento para manejar z-index localmente.

## Reglas generales

- MediaSelector y otros selectores de archivos SIEMPRE deben usar z-index máximo (2147483647)
- Los modales deben usar z-index alto (9999)
- El contenido regular debe usar valores bajos (0-5)
- Evita usar z-index demasiado altos innecesariamente para prevenir problemas

## Problemas conocidos

- El HeaderSection.tsx MediaSelector debe ser un portal y tener z-index máximo para aparecer sobre todos los componentes
- Los componentes en SectionManager.tsx deben tener valores z-index más bajos para no interferir con modales

## Solución a problemas comunes

Si tienes problemas con elementos que no aparecen correctamente:

1. Verifica que el elemento tenga `position` establecida (relative, absolute, fixed)
2. Asegúrate de que el elemento no esté dentro de un contenedor con `overflow: hidden`
3. Comprueba si hay conflictos de contexto de apilamiento
4. Usa `isolation: isolate` para crear nuevos contextos cuando sea necesario 