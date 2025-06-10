# Integración MetaMask con Solana para Operaciones Críticas

Esta integración permite usar MetaMask con Solana para aprobar operaciones críticas en tu aplicación, añadiendo una capa extra de seguridad mediante firmas digitales.

## 🚀 Características

- ✅ Conexión con MetaMask para Solana
- ✅ Firma de mensajes para operaciones críticas
- ✅ Integración con sistema de autorización GraphQL Shield
- ✅ Componentes React listos para usar
- ✅ Validación de firmas en el backend
- ✅ Interfaz de usuario intuitiva

## 📦 Dependencias Instaladas

```bash
npm install @solana/web3.js @metamask/detect-provider
```

## 🏗️ Arquitectura

### 1. Hook de MetaMask (`useMetaMaskSolana`)
- Maneja la conexión con MetaMask
- Firma mensajes y transacciones
- Gestiona el estado de la wallet

### 2. Sistema de Autorización
- Reglas GraphQL Shield actualizadas
- Validación de firmas MetaMask
- Operaciones críticas protegidas

### 3. Componentes UI
- `MetaMaskApproval`: Modal de aprobación
- `useMetaMaskApproval`: Hook para gestionar aprobaciones
- `UserManagement`: Ejemplo de implementación

## 🔧 Configuración

### 1. Variables de Entorno

Añade a tu `.env.local`:

```env
# Solana RPC Endpoint
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Para desarrollo, usa devnet:
# NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 2. Operaciones Críticas

Las siguientes operaciones requieren aprobación MetaMask:

**🔒 Eliminar usuarios y tenants:**
- `deleteUser` - Eliminar usuarios
- `deleteTenant` - Eliminar tenants

**💳 Modificar proveedores de pago:**
- `createPaymentProvider` - Crear proveedores de pago
- `updatePaymentProvider` - Actualizar proveedores de pago
- `deletePaymentProvider` - Eliminar proveedores de pago

**⚙️ Actualizar configuraciones críticas:**
- `updateSiteSettings` - Actualizar configuración del sitio

**👥 Gestionar permisos y roles:**
- `createRole` - Crear roles
- `updateRole` - Actualizar roles
- `deleteRole` - Eliminar roles
- `assignPermissionToRole` - Asignar permisos a roles
- `removePermissionFromRole` - Remover permisos de roles

## 💻 Uso Básico

### 1. Usar el Hook de MetaMask

```tsx
import { useMetaMaskSolana } from '@/hooks/useMetaMask';

function MyComponent() {
  const {
    isConnected,
    publicKey,
    connect,
    signTransaction,
    error
  } = useMetaMaskSolana();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const handleSign = async () => {
    try {
      const signature = await signTransaction(
        'deleteUser',
        { userId: '123', reason: 'Violation of terms' }
      );
      console.log('Signature:', signature);
    } catch (error) {
      console.error('Error signing:', error);
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>
          Conectar MetaMask
        </button>
      ) : (
        <div>
          <p>Conectado: {publicKey}</p>
          <button onClick={handleSign}>
            Firmar Operación
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2. Usar el Sistema de Aprobación

```tsx
import { useMetaMaskApproval } from '@/components/auth/MetaMaskApproval';

function AdminPanel() {
  const { requestApproval, ApprovalModal } = useMetaMaskApproval();

  const handleCriticalOperation = async () => {
    try {
      const signature = await requestApproval(
        'deleteUser',
        { userId: '123' },
        'Eliminar usuario John Doe'
      );
      
      // Usar la firma en tu mutación GraphQL
      await executeGraphQLMutation({
        variables: {
          metaMaskSignature: signature,
          operationType: 'deleteUser',
          // ... otros parámetros
        }
      });
    } catch (error) {
      console.error('Operación cancelada:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCriticalOperation}>
        Eliminar Usuario
      </button>
      <ApprovalModal />
    </div>
  );
}
```

### 3. Mutación GraphQL con Firma

```tsx
const DELETE_USER_MUTATION = gql`
  mutation DeleteUser(
    $id: ID!
    $metaMaskSignature: String!
    $operationType: String!
    $operationData: String!
  ) {
    deleteUser(
      id: $id
      metaMaskSignature: $metaMaskSignature
      operationType: $operationType
      operationData: $operationData
    ) {
      success
      message
    }
  }
`;
```

## 🔒 Seguridad

### Validación de Firmas

El sistema valida:
1. ✅ Presencia de la firma
2. ✅ Formato correcto de la firma
3. ✅ Permisos del usuario
4. ✅ Autenticación previa

### Auditoría

Todas las operaciones con MetaMask se registran:
- Usuario que ejecuta la operación
- Tipo de operación
- Timestamp
- Firma (parcial para logs)

## 🎨 Personalización

### Añadir Nuevas Operaciones Críticas

1. Actualiza el array `criticalOperations` en `authorization/index.ts`:

```typescript
const criticalOperations = [
  // ... operaciones existentes
  'newCriticalOperation'
];
```

2. Añade la regla a la mutación correspondiente:

```typescript
newCriticalOperation: or(
  isAdmin, 
  and(
    isAuthenticated, 
    hasPermission('execute:new_operation'), 
    requiresMetaMaskSignature
  )
),
```

### Personalizar UI

Los componentes usan Tailwind CSS y son completamente personalizables:

```tsx
// Personalizar colores
<Button className="bg-purple-500 hover:bg-purple-600">
  Aprobar con MetaMask
</Button>
```

## 🧪 Testing

### Configuración para Desarrollo

1. Usa Solana Devnet para pruebas
2. Configura MetaMask para Solana Devnet
3. Obtén SOL de prueba del faucet

### Ejemplo de Test

```typescript
// __tests__/metamask-integration.test.tsx
import { render, screen } from '@testing-library/react';
import { MetaMaskApproval } from '@/components/auth/MetaMaskApproval';

test('renders MetaMask approval component', () => {
  render(
    <MetaMaskApproval
      operationType="deleteUser"
      operationData={{ userId: '123' }}
      operationDescription="Delete test user"
      onApproval={() => {}}
      onCancel={() => {}}
    />
  );
  
  expect(screen.getByText('Aprobación Requerida')).toBeInTheDocument();
});
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **MetaMask no detecta Solana**
   - Asegúrate de tener la versión más reciente de MetaMask
   - Verifica que Solana esté habilitado en MetaMask

2. **Error de conexión RPC**
   - Verifica la URL del RPC de Solana
   - Cambia a un endpoint diferente si es necesario

3. **Firma inválida**
   - Verifica que el mensaje se esté formateando correctamente
   - Asegúrate de que la wallet esté conectada

### Logs de Debug

Habilita logs detallados:

```typescript
// En desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('MetaMask operation:', {
    operationType,
    operationData,
    signature: signature.substring(0, 10) + '...'
  });
}
```

## 📚 Recursos Adicionales

- [Documentación de Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [MetaMask Solana Documentation](https://docs.metamask.io/wallet/concepts/solana/)
- [GraphQL Shield Documentation](https://the-guild.dev/graphql/shield)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. 