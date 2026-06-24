import { useRef } from 'react'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import ConfigPanel from './components/ConfigPanel'

const FEATURES = [
  {
    icon: '🏢',
    title: 'Targets Tier-1 MNCs Only',
    desc: 'ML qualifier filters out small startups and irrelevant profiles. Only senior engineers, leads, and recruiters at companies like Google, Amazon, Flipkart, Razorpay pass through.',
  },
  {
    icon: '✉️',
    title: 'Personalised Referral Ask',
    desc: 'AI crafts a tight, human-sounding intro message with your resume link. References the lead\'s company specifically. No generic templates.',
  },
  {
    icon: '🔄',
    title: 'Follows Up Automatically',
    desc: 'If no reply, sends a gentle nudge after 48–72 hours. Tracks each conversation and marks converted when they agree to refer.',
  },
]

export default function App() {
  const configRef = useRef(null)

  const scrollToConfig = () => {
    configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Sticky nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(5, 5, 16, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="text-lg font-black gradient-text">OutreachAI</div>
        <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <a href="#dashboard" className="hover:text-white transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard</a>
          <a href="#config" className="hover:text-white transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Setup</a>
          <a href="/admin/" target="_blank" className="hover:text-white transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Django Admin</a>
          <button onClick={scrollToConfig} className="btn-primary px-4 py-2 text-xs">
            Configure →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <Hero onGetStarted={scrollToConfig} />

      {/* Features strip */}
      <section className="py-20 px-6" style={{ background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How It <span className="gradient-text">Works</span></h2>
            <p style={{ color: 'var(--text-muted)' }}>Three layers of intelligence working together.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="glow-border rounded-xl p-6 hover:scale-105 transition-transform duration-300"
                style={{ background: 'var(--card)' }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <Dashboard />

      {/* Config */}
      <div ref={configRef}>
        <ConfigPanel />
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-sm border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        <div className="mb-2 gradient-text font-bold text-lg">OutreachAI</div>
        <div>Self-hosted · Open source · Your data, your rules</div>
        <div className="mt-2">
          <a href="/admin/" className="hover:text-white transition-colors mx-3" style={{ textDecoration: 'none', color: 'inherit' }}>Django Admin</a>
          <a href="https://github.com/Riya-chandra/AutomationLLM_OutReach" target="_blank" className="hover:text-white transition-colors mx-3" style={{ textDecoration: 'none', color: 'inherit' }}>GitHub</a>
        </div>
      </footer>
    </div>
  )
}
