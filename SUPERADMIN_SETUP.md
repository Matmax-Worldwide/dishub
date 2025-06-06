# 🚀 SuperAdmin System Setup Guide

## Prerequisites
- Database configured and running
- Environment variables set up
- Next.js application running

## Step-by-Step Setup

### 1. **Database Migration & Seeding**

```bash
# Apply database migrations
npx prisma migrate dev

# Seed roles into database
node prisma/seedRoles.js

# Create initial SuperAdmin user
node prisma/seedSuperAdmin.js
```

### 2. **Environment Variables**

Add to your `.env` file:

```env
# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Database URL (already configured)
DATABASE_URL=your-database-url

# Optional: SuperAdmin email override
SUPERADMIN_EMAIL=admin@yourdomain.com
```

### 3. **Initial Login Credentials**

After running the seed script:
- **Email**: `superadmin@dishub.com`
- **Password**: `SuperAdmin123!`

⚠️ **IMPORTANT**: Change this password immediately after first login!

### 4. **Available SuperAdmin Features**

#### **Platform Management**
- ✅ Create and manage tenants
- ✅ Activate/deactivate modules per tenant
- ✅ View platform analytics
- ✅ Manage user roles and permissions

#### **Tenant Operations**
- ✅ List all tenants with pagination and search
- ✅ View tenant details and statistics
- ✅ Suspend/activate tenant accounts
- ✅ Configure tenant-specific features

#### **User Management**
- ✅ View all users across tenants
- ✅ Assign roles and permissions
- ✅ Manage platform-level users

### 5. **API Endpoints**

#### **Authentication**
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

#### **Tenant Management** (SuperAdmin only)
```
GET    /api/admin/tenants          # List all tenants
POST   /api/admin/tenants          # Create new tenant
GET    /api/admin/tenants/[id]     # Get tenant details
PUT    /api/admin/tenants/[id]     # Update tenant
DELETE /api/admin/tenants/[id]     # Delete tenant
```

#### **User Management** (SuperAdmin only)
```
GET    /api/admin/users            # List all users
POST   /api/admin/users            # Create user
PUT    /api/admin/users/[id]       # Update user
DELETE /api/admin/users/[id]       # Delete user
```

### 6. **Role-Based Access Control**

#### **Middleware Usage Examples**

```typescript
// Require SuperAdmin access
export const GET = requireSuperAdmin()(async (request) => {
  // Your SuperAdmin-only logic here
});

// Require specific permission
export const POST = requirePermission('manage:tenants')(async (request) => {
  // Your permission-specific logic here
});

// Require any platform role
export const GET = requirePlatformAccess()(async (request) => {
  // SuperAdmin, PlatformAdmin, or SupportAgent can access
});
```

### 7. **Frontend Integration**

#### **Check User Permissions**
```typescript
import { useAuth } from '@/hooks/useAuth';

function AdminPanel() {
  const { user, hasPermission } = useAuth();
  
  if (!hasPermission('manage:tenants')) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Panel Content</div>;
}
```

### 8. **Security Considerations**

- ✅ JWT tokens with expiration
- ✅ Role-based access control
- ✅ Permission-based authorization
- ✅ Secure password hashing (bcrypt)
- ✅ Input validation and sanitization

### 9. **Next Development Steps**

1. **Create SuperAdmin Dashboard UI**
   - Tenant management interface
   - User management interface
   - Analytics dashboard

2. **Implement Tenant Onboarding**
   - Automated tenant setup
   - Module activation workflow
   - Initial admin user creation

3. **Add Platform Analytics**
   - Usage metrics
   - Performance monitoring
   - Revenue tracking

4. **Enhance Security**
   - Two-factor authentication
   - Audit logging
   - Rate limiting

### 10. **Testing**

```bash
# Test role seeding
npm run test:roles

# Test SuperAdmin creation
npm run test:superadmin

# Test API endpoints
npm run test:api
```

## 🎯 **Quick Start Commands**

```bash
# Complete setup in one go
npm run setup:superadmin

# Or step by step:
npx prisma migrate dev
node prisma/seedRoles.js
node prisma/seedSuperAdmin.js
npm run dev
```

## 📞 **Support**

If you encounter any issues:
1. Check the console logs
2. Verify environment variables
3. Ensure database connectivity
4. Review role permissions configuration

---

**Your SuperAdmin system is now ready! 🎉** 