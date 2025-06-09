#!/usr/bin/env node

/**
 * Script de prueba para el auto-login desde sistema externo
 * Simula la llamada que hace el sistema externo con user={email}&hash={hashedPassword}
 */

const bcrypt = require('bcryptjs');

async function testAutoLogin() {
  console.log('🧪 Testing Auto-Login Integration...\n');

  // Datos de prueba - ajustar según tu base de datos
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  
  try {
    // 1. Simular la generación del hash como lo hace el sistema externo
    console.log('1. Generating hash for password...');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('   Generated hash:', hashedPassword.substring(0, 20) + '...');

    // 2. Simular la URL que generaría el sistema externo
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const autoLoginUrl = `${baseUrl}?user=${encodeURIComponent(testEmail)}&hash=${encodeURIComponent(hashedPassword)}`;
    
    console.log('\n2. Generated auto-login URL:');
    console.log('   ', autoLoginUrl);

    // 3. Probar la llamada al endpoint API
    console.log('\n3. Testing API endpoint...');
    
    const apiUrl = `${baseUrl}/api/auth/auto-login`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        hash: hashedPassword
      })
    });

    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));

    // 4. Verificar resultado
    if (result.success) {
      console.log('\n✅ Auto-login test PASSED');
      console.log('   User:', result.user?.email);
      console.log('   Redirect URL:', result.redirectUrl);
    } else {
      console.log('\n❌ Auto-login test FAILED');
      console.log('   Error:', result.message);
    }

  } catch (error) {
    console.error('\n💥 Test error:', error.message);
  }
}

// Función para probar diferentes escenarios
async function testDifferentScenarios() {
  console.log('\n🔍 Testing different scenarios...\n');

  const scenarios = [
    {
      name: 'Valid user with hash',
      email: 'test@example.com',
      generateHash: true
    },
    {
      name: 'Valid user without hash',
      email: 'test@example.com',
      generateHash: false
    },
    {
      name: 'Non-existent user',
      email: 'nonexistent@example.com',
      generateHash: true
    },
    {
      name: 'Development hash',
      email: 'test@example.com',
      customHash: 'dev-auto-login-hash'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`);
    
    let hash = null;
    if (scenario.generateHash) {
      hash = await bcrypt.hash('password123', 10);
    } else if (scenario.customHash) {
      hash = scenario.customHash;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/auto-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: scenario.email,
          hash: hash
        })
      });

      const result = await response.json();
      console.log(`   Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'} - ${result.message}`);
      
    } catch (error) {
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }
    
    console.log('');
  }
}

// Función principal
async function main() {
  console.log('🚀 Auto-Login Integration Test Suite');
  console.log('=====================================\n');

  // Verificar que estamos en el directorio correcto
  const fs = require('fs');
  if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
  }

  await testAutoLogin();
  await testDifferentScenarios();

  console.log('\n📋 Test Complete!');
  console.log('\nTo test manually:');
  console.log('1. Make sure your Next.js server is running');
  console.log('2. Visit a URL like: http://localhost:3000?user=test@example.com&hash=dev-auto-login-hash');
  console.log('3. Check browser console and server logs for details');
}

// Ejecutar si el script se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAutoLogin, testDifferentScenarios }; 