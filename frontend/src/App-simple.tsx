import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('Testing...')

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(data => {
        setStatus('✅ Backend Connected: ' + data.status)
      })
      .catch(err => {
        setStatus('❌ Backend Error: ' + err.message)
      })
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>PRD Tool - Simple Test</h1>
      <p>Status: {status}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Test Page Working!</h2>
        <p>If you can see this, React is working.</p>
      </div>
    </div>
  )
}

export default App