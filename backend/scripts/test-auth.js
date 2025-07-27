#!/usr/bin/env node

// Simple script to test authentication endpoints
const API_BASE = 'http://localhost:3001'

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n')

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    if (healthResponse.ok) {
      console.log('✅ Health check passed')
    } else {
      console.log('❌ Health check failed:', healthResponse.status)
      return
    }

    // Test 2: Register new user
    console.log('\n2. Testing user registration...')
    const registerData = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123'
    }

    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    })

    if (registerResponse.ok) {
      const registerResult = await registerResponse.json()
      console.log('✅ Registration successful')
      console.log('   User ID:', registerResult.data.user.id)
      console.log('   Token type:', registerResult.data.token.includes('.') ? 'JWT' : 'Session')
      
      const token = registerResult.data.token

      // Test 3: Get current user
      console.log('\n3. Testing /api/auth/me endpoint...')
      const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (meResponse.ok) {
        const meResult = await meResponse.json()
        console.log('✅ /api/auth/me successful')
        console.log('   User:', meResult.data.user.email)
      } else {
        const errorResult = await meResponse.json()
        console.log('❌ /api/auth/me failed:', errorResult)
      }

      // Test 4: Login with the same user
      console.log('\n4. Testing user login...')
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      })

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json()
        console.log('✅ Login successful')
        console.log('   Token type:', loginResult.data.token.includes('.') ? 'JWT' : 'Session')
      } else {
        const errorResult = await loginResponse.json()
        console.log('❌ Login failed:', errorResult)
      }

    } else {
      const errorResult = await registerResponse.json()
      console.log('❌ Registration failed:', errorResult)
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run the test
testAuth()