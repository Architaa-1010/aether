import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import ParticleField from './ParticleField'

export default function App() {
  const [scene, setScene] = useState({ color: '#88ccff', speed: 0.2, count: 2000, motion: 'float' })
  const [narration, setNarration] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Load history once on first mount
useEffect(() => {
    const saved = localStorage.getItem('aether_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved history', e)
      }
    }
  }, [])

  // Save history every time it changes
  useEffect(() => {
    localStorage.setItem('aether_history', JSON.stringify(history))
  }, [history])

  const isMobile= /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  


  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)


  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser. Try Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript
      setText(spokenText)
      handleSubmitWithText(spokenText)
    }

    recognition.start()
  }

  const handleSubmitWithText = async (spokenText) => {
    if (!spokenText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText })
      })
      const data = await res.json()
      const cappedScene = { ...data.scene, count: isMobile ? Math.min(data.scene.count, 1500) :data.scene.count}
      setScene(cappedScene)
      setScene(data.scene)
      setNarration(data.narration)
      setHistory(prev => [
        { text: spokenText, narration: data.narration, scene:data.scene, timestamp:Date.now() },
        ...prev
      ].slice(0,10))
      speak(data.narration)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      const cappedScene = { ...data.scene, count: isMobile ? Math.min(data.scene.count, 1500) :data.scene.count}
      setScene(cappedScene)
      setScene(data.scene)
      setNarration(data.narration)
      setHistory(prev => [
        { text: text, narration: data.narration, scene: data.scene,timestamp: Date.now()},
        ...prev
      ].slice(0,10))
      speak(data.narration)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
      {/* Background gradient layer */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          background: `radial-gradient(circle at 50% 50%, ${scene.color}22, #0a0a12 70%)`,
          transition: 'background 2s ease',
          zIndex: 0
        }}
      />

      {/* Canvas on top */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <ParticleField color={scene.color} speed={scene.speed} count={scene.count} motion={scene.motion} />
          <OrbitControls />
          <EffectComposer>
            <Bloom intensity={1.3} luminanceThreshold={0} luminanceSmoothing={0.9} mipmapBlur />
          </EffectComposer>
        </Canvas>
      </div>

      {/* UI overlay */}
      <div
        style={{
          position: 'absolute', bottom: 30, left: 0, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          zIndex: 2, padding: '0 16px', boxSizing: 'border-box'
        }}
      >
        {narration && (
          <p style={{
            color: 'white',
            fontStyle: 'italic',
            opacity: 0.85,
            textAlign: 'center',
            maxWidth: 600,
            padding: '0 20px',
            lineHeight: 1.6,
            margin: 0,
            fontSize: 'clamp(14px, 2.5vw, 18px)'
          }}>
            {narration}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420, justifyContent: 'center' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling?"
            style={{
              padding: '14px 16px',
              borderRadius: 8,
              border: 'none',
              flex: 1,
              minWidth: 0,
              fontSize: 16
            }}
          />
          {speechSupported && (
            <button
              onClick={handleVoiceInput}
              style={{
                padding: '14px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: isListening ? '#ff6b6b' : '#444',
                fontSize: 18,
                flexShrink: 0
              }}
            >
              🎤
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '14px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              flexShrink: 0
            }}
          >
            {loading ? '...' : 'Submit'}
          </button>
        </div>
      </div>
      <button
        onClick={() => setShowHistory(s => !s)}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 3,
          padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#444', color: 'white'
        }}
      >
        History ({history.length})
      </button>

      {showHistory && (
        <div style={{
          position: 'absolute', top: 60, right: 20, zIndex: 3,
          width: 'min(280px, 80vw)', maxHeight: '70vh', overflowY: 'auto',
          background: 'rgba(20,20,30,0.9)', borderRadius: 10, padding: 12,
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          {history.length === 0 && <p style={{ color: '#888', fontSize: 14 }}>No worlds yet.</p>}
          {history.map((item, i) => (
            <div
              key={item.timestamp}
              onClick={() => { setScene(item.scene); setNarration(item.narration) }}
              style={{
                cursor: 'pointer', padding: 8, borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${item.scene.color}55`
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 4, background: item.scene.color, marginBottom: 6 }} />
              <p style={{ color: 'white', fontSize: 13, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}