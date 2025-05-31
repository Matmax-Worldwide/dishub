# Especificación Técnica - CMS Propio con Next.js, GraphQL y Prisma

## 1. Objetivo

Crear un CMS modular y extensible utilizando únicamente Next.js, GraphQL y Prisma, sin depender de soluciones externas como Payload o WordPress.

---

## 2. Stack Tecnológico

* **Frontend**: Next.js 15+ con App Router (`app/`)
* **Backend/API**: GraphQL (Yoga o Apollo Server)
* **ORM**: Prisma + PostgreSQL (u otra DB compatible)
* **Autenticación**: NextAuth o Supabase Auth
* **Almacenamiento de Archivos**: Firebase Storage / Local
* **UI Admin**: React, TailwindCSS, shadcn/ui

---

## 3. Funcionalidades Clave

### 3.1 Modelador de Contenido

* Crear colecciones (Blogs, Páginas, Productos, etc.)
* Definir campos por colección:

  * Texto simple
  * Texto largo (richtext)
  * Número
  * Booleano
  * Imagen/archivo
  * Fecha
  * Relación (referencia a otra colección)
  * Localización (por idioma)

### 3.2 CRUD de Documentos

* Crear/leer/editar/eliminar documentos por colección
* Validación dinámica según definición del modelo
* Localización por campo o por documento

### 3.3 Editor Visual Modular

* Cada página es un arreglo de secciones con tipo + props
* Componentes reutilizables: Hero, Grid, CTA, Form, Testimonial

### 3.4 Control de Acceso

* Roles: Admin, Editor, Viewer
* Autenticación vía JWT o NextAuth
* Restricciones de edición por colección o campo

### 3.5 Almacenamiento de Archivos

* Subida de imágenes y documentos
* Vista previa
* Borrado y reemplazo

### 3.6 Páginas

* Colección especial "Pages" con campos como:

  * `slug` (ruta URL)
  * `template` (tipo de layout)
  * `sections` (array de secciones modulares)
  * `seo` (título, descripción, imagen)
* Se renderizan dinámicamente en `/[...slug]`

### 3.7 Menús de Navegación

* Definición de menús personalizados (header, footer, etc.)
* Campos por ítem:

  * `label`
  * `href`
  * `order`
  * `parentId` (para menús anidados)
* Asignación a zonas del sitio

---

## 4. Modelo de Base de Datos (Prisma)

```prisma
model Collection {
  id         String      @id @default(cuid())
  name       String      @unique
  fields     Field[]
  documents  Document[]
}

model Field {
  id            String   @id @default(cuid())
  collectionId  String
  name          String
  type          String  // text, number, image, richtext, relation, etc.
  required      Boolean
  localized     Boolean
  Collection    Collection @relation(fields: [collectionId], references: [id])
}

model Document {
  id           String      @id @default(cuid())
  collectionId String
  data         Json
  Collection   Collection  @relation(fields: [collectionId], references: [id])
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Page {
  id        String   @id @default(cuid())
  slug      String   @unique
  template  String
  sections  Json     // arreglo de bloques
  seo       Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model NavigationMenu {
  id     String @id @default(cuid())
  name   String
  items  MenuItem[]
}

model MenuItem {
  id         String  @id @default(cuid())
  menuId     String
  label      String
  href       String
  order      Int
  parentId   String?
  menu       NavigationMenu @relation(fields: [menuId], references: [id])
}
```

---

## 5. API GraphQL

### Queries

* `getCollections`: Lista de colecciones
* `getDocuments(collectionName, locale)`: Lista documentos
* `getDocument(id)`
* `getPages`: Lista de páginas
* `getPage(slug)`
* `getNavigationMenu(name)`

### Mutations

* `createDocument(collectionName, data)`
* `updateDocument(id, data)`
* `deleteDocument(id)`
* `createPage(data)`
* `updatePage(id, data)`
* `createNavigationMenu(name)`
* `updateNavigationMenu(id, data)`

---

## 6. UI Admin

* `/admin/collections`: Crear y editar estructuras
* `/admin/[collectionName]`: Ver, crear, editar documentos
* `/admin/pages`: CRUD de páginas con editor modular
* `/admin/navigation`: CRUD de menús con drag & drop
* Formularios dinámicos según los campos definidos
* Vista previa del documento o página final

---

## 7. Extensiones Futuras

* Soporte multitenant (varios proyectos en una misma base)
* Webhooks
* Versionado de documentos
* Publicación programada

---

## 8. Deploy

* **Frontend/API**: Vercel o similar
* **DB**: Supabase, Railway, Neon o local
* **Archivos**: Firebase Storage o bucket propio

---

## 9. Licencia

Software libre o comercial según el proyecto final.

---

¿Preguntas o sugerencias para adaptar esta estructura a tus necesidades específicas?
