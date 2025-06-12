import { useState, useEffect } from 'react'

import RecordButton from './pages/RecordButton';

import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => console.error('Backend fetch error:', err))
  }, [])

  return (
    <>
      <div>
        <RecordButton /><div className="card">
  <button onClick={() => setCount((count) => count + 1)}>
    count is {count}
  </button>
  <p>
    Edit <code>src/App.jsx</code> and save to test HMR
  </p>
  <p>
    🔌 Backend Message: <strong>{message || 'Loading...'}</strong>
  </p>

  {/* 🎙️ Record Button Here */}
 
</div>

      </div>
    </>
  )
}

export default App
