import { motion } from 'framer-motion'

export default function Hero({ onGetStarted }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#000000' }}>

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', letterSpacing: '0.15em' }}>
            LinkedIn Automation · AI-Powered
          </span>
        </motion.div>

        <motion.h1
          className="font-black leading-none tracking-tight mb-6"
          style={{ fontSize: 'clamp(52px, 9vw, 96px)' }}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <span className="gradient-text">Outreach</span>
          <span style={{ color: '#ffffff' }}>AI</span>
        </motion.h1>

        <motion.p
          className="text-xl mb-3 font-light"
          style={{ color: '#94a3b8', maxWidth: 520, margin: '0 auto 12px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Target the right people at top MNCs.
          Ask for referrals. Automatically.
        </motion.p>

        <motion.p
          className="text-sm mb-12"
          style={{ color: '#475569', maxWidth: 420, margin: '0 auto 48px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          AI finds senior engineers & recruiters at Tier-1 companies,
          qualifies them, and sends personalised referral requests — on autopilot.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
        >
          <button
            onClick={onGetStarted}
            className="btn-primary px-8 py-4 text-sm font-semibold rounded-xl"
          >
            Configure & Launch →
          </button>
          <a
            href="#dashboard"
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            View Dashboard
          </a>
        </motion.div>

        {/* Minimal stat row */}
        <motion.div
          className="flex justify-center gap-12 mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {[
            { val: 'Tier-1', sub: 'MNCs targeted' },
            { val: 'Auto', sub: 'Referral ask' },
            { val: 'Local', sub: 'Your data only' },
          ].map(({ val, sub }) => (
            <div key={sub} className="text-center">
              <div className="text-2xl font-black gradient-text">{val}</div>
              <div className="text-xs mt-1" style={{ color: '#475569' }}>{sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
