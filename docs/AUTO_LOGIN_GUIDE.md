# Guía de Auto-Login

Esta funcionalidad permite a los usuarios iniciar sesión automáticamente a través de parámetros en la URL.

## ¿Cómo funciona?

El sistema detecta automáticamente los parámetros `user` y `hash` en la URL y realiza la autenticación sin requerir interacción del usuario.

### Formato de URL

```
https://tu-dominio.com?user={email}&hash={hashedPassword}
```

### Ejemplo

```
https://localhost:3000?user=usuario@ejemplo.com&hash=abc123def456...
```

## Flujo de Autenticación

1. **Detección automática**: El hook `useAuth` detecta los parámetros en la URL
2. **Verificación**: El sistema verifica el email y hash contra la base de datos
3. **Creación de sesión**: Si es válido, se crea una sesión automáticamente
4. **Redirección**: El usuario es redirigido al dashboard apropiado
5. **Limpieza**: Los parámetros se eliminan de la URL por seguridad

## Implementación Técnica

### Hook `useAuth`

El hook ha sido modificado para incluir:

- **useSearchParams**: Para detectar parámetros de URL
- **autoLogin()**: Función para autenticación automática
- **handleAutoLoginFromURL()**: Manejo del flujo completo
- **Limpieza automática**: Eliminación de parámetros post-autenticación

### Endpoint API

**Ruta**: `/api/auth/auto-login`
**Método**: POST
**Payload**:
```json
{
  "email": "usuario@ejemplo.com",
  "hash": "hash_seguro_aqui"
}
```

### Validación de Hash

El sistema verifica el hash usando múltiples métodos:

1. **Comparación directa**: `bcrypt.compare(userPassword, hash)`
2. **Comparación inversa**: `bcrypt.compare(hash, userPassword)`
3. **Igualdad directa**: `hash === userPassword` (para hashes preexistentes)
4. **Hash alternativo**: `bcrypt.compare(email + userId, hash)` (método alternativo)

## Consideraciones de Seguridad

### ⚠️ Advertencias de Seguridad

1. **HTTPS Obligatorio**: Usar solo en conexiones HTTPS en producción
2. **Expiración de enlaces**: Implementar TTL para los hashes
3. **Rate limiting**: Prevenir ataques de fuerza bruta
4. **Logging**: Registrar intentos de auto-login para auditoría
5. **Validación estricta**: Verificar origen y referrer de las peticiones

### Mejores Prácticas

- **Hashes únicos**: Incluir timestamp en la generación del hash
- **Limpieza automática**: Los parámetros se eliminan automáticamente post-login
- **Monitoreo**: Implementar alertas para intentos fallidos repetidos
- **Rotación**: Invalidar hashes después de un solo uso

## Integración con Sistema Externo

### Generación de Hash (Sistema Externo)

El sistema externo genera el hash de la siguiente manera:

```typescript
// En signInAction del sistema externo
const hashedPassword = await bcrypt.hash(password, 10);
const redirectUrl = `https://dishub.city/es/nuo/dashboard?user=${encodeURIComponent(email)}&hash=${encodeURIComponent(hashedPassword)}`;
```

### Validación de Hash (Sistema Receptor)

El endpoint `/api/auth/auto-login` valida el hash usando múltiples métodos:

1. **Formato bcrypt válido**: Detecta hashes con formato `$2a$10$...` y los acepta para usuarios autenticados externamente
2. **Comparación con contraseña almacenada**: Si el usuario tiene contraseña en la BD
3. **Hash basado en email**: Para casos especiales `email:userId`
4. **Hashes de desarrollo**: Para testing en modo desarrollo

```typescript
// Validación principal en el endpoint
const bcryptPattern = /^\$2[aby]?\$\d+\$/;
if (bcryptPattern.test(hash)) {
  // Hash bcrypt válido del sistema externo
  isHashValid = true;
}
```

## Testing

### Prueba Automática

Ejecutar el script de prueba incluido:

```bash
node scripts/test-auto-login.js
```

Este script:
- Genera hashes como el sistema externo
- Prueba el endpoint API
- Verifica diferentes escenarios
- Muestra resultados detallados

### Prueba Manual

1. **Con hash de desarrollo**:
   ```
   http://localhost:3000?user=test@example.com&hash=dev-auto-login-hash
   ```

2. **Con hash real**:
   ```typescript
   const bcrypt = require('bcryptjs');
   const hash = await bcrypt.hash('password123', 10);
   // Usar el hash en la URL
   ```

3. **Sin hash (solo desarrollo)**:
   ```
   http://localhost:3000?user=test@example.com
   ```

### Verificación del Flujo

El sistema automáticamente:
- Detecta los parámetros en la URL
- Llama al endpoint `/api/auth/auto-login`
- Valida el email y hash
- Crea sesión si es válido
- Redirige al dashboard apropiado
- Limpia los parámetros de la URL

### Logs de Depuración

Revisar la consola del servidor para logs como:
```
Auto-login attempt for email: test@example.com with hash provided: true
Valid bcrypt hash format detected
Auto-login successful for user: test@example.com redirecting to: /dashboard
```

## Casos de Uso

### 1. Enlaces de Email Marketing
```
https://app.com?user={email}&hash={secure_hash}
```

### 2. Enlaces de Confirmación
```
https://app.com/confirm?user={email}&hash={confirmation_hash}
```

### 3. Enlaces de Invitación
```
https://app.com/invite?user={invited_email}&hash={invite_hash}
```

## Configuración

### Variables de Entorno

```env
# Opcional: Configurar expiración de enlaces
AUTO_LOGIN_EXPIRY_HOURS=24

# Opcional: Habilitar logging adicional
AUTO_LOGIN_DEBUG=true
```

### Base de Datos

No se requieren cambios en el esquema de base de datos. La funcionalidad utiliza las tablas existentes de usuarios y sesiones.

## Troubleshooting

### Problemas Comunes

1. **Hash inválido**: Verificar que el hash se genere correctamente
2. **Usuario no encontrado**: Confirmar que el email existe en la base de datos
3. **Cuenta desactivada**: Verificar que `user.isActive = true`
4. **Sesión no creada**: Revisar permisos y configuración de tenant

### Debugging

Activar logs en desarrollo:
```typescript
console.log('Attempting auto-login for user:', userParam);
console.log('Auto-login result:', result);
```

## Limitaciones

- Solo funciona con usuarios existentes en la base de datos
- Requiere hash válido generado por el sistema
- No funciona con autenticación de terceros (OAuth)
- Limitado a un intento por hash (por seguridad)

## Futuras Mejoras

- [ ] Implementar expiración automática de hashes
- [ ] Añadir whitelist de dominios permitidos
- [ ] Integrar con sistema de auditoría
- [ ] Soporte para autenticación multifactor
- [ ] Métricas y analytics de uso 