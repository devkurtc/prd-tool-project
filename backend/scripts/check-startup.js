#!/usr/bin/env node

// Check if the server can start properly
const { spawn } = require('child_process')

console.log('🚀 Testing backend startup...\n')

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  cwd: process.cwd()
})

let output = ''
let hasStarted = false

// Capture output
server.stdout.on('data', (data) => {
  const text = data.toString()
  output += text
  console.log('STDOUT:', text.trim())
  
  // Check if server has started successfully
  if (text.includes('Server running on') || text.includes('WebSocket server initialized')) {
    hasStarted = true
  }
})

server.stderr.on('data', (data) => {
  const text = data.toString()
  output += text
  console.log('STDERR:', text.trim())
})

// Give it 10 seconds to start
setTimeout(() => {
  if (hasStarted) {
    console.log('\n✅ Server started successfully!')
  } else {
    console.log('\n❌ Server failed to start within 10 seconds')
    console.log('Output:', output)
  }
  
  // Kill the server
  server.kill('SIGTERM')
  process.exit(hasStarted ? 0 : 1)
}, 10000)

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message)
  process.exit(1)
})