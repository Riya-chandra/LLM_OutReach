import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Linkedin, Target, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { api } from '../api'

const PROVIDERS = ['openai', 'anthropic', 'google', 'groq', 'mistral', 'cohere', 'openai_compatible']

const DEFAULT_MODELS = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  google: 'gemini-2.0-flash',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
  cohere: 'command-r-plus',
  openai_compatible: 'gpt-4o',
}

const STEPS = [
  { id: 'llm', label: 'LLM Setup', icon: Settings },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'campaign', label: 'Campaign', icon: Target },
  { id: 'done', label: 'Done', icon: Check },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div
              className="flex flex-col items-center gap-1"
              style={{ minWidth: 70 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300"
                style={{
                  background: done ? 'var(--success)' : active ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                  color: done || active ? 'white' : 'var(--text-muted)',
                }}
              >
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className="text-xs" style={{ color: active ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 mx-1 mb-5" style={{ background: i < current ? 'var(--success)' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, rows }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {rows ? (
        <textarea
          className="input-field resize-none"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          className="input-field"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === 'password' ? 'new-password' : undefined}
        />
      )}
    </div>
  )
}

export default function ConfigPanel({ onConfigured }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [existing, setExisting] = useState(null)

  const [llm, setLlm] = useState({ provider: 'openai', api_key: '', model: 'gpt-4o', api_base: '' })
  const [linkedin, setLinkedin] = useState({ email: '', password: '', connect_limit: '20', follow_limit: '20' })
  const [campaign, setCampaign] = useState({ name: '', objective: '', product_docs: '', booking_link: '' })

  useEffect(() => {
    api.getConfig().then(cfg => {
      if (!cfg.error) {
        setExisting(cfg)
        if (cfg.llm_provider) setLlm(l => ({ ...l, provider: cfg.llm_provider, model: cfg.ai_model || DEFAULT_MODELS[cfg.llm_provider] || '' }))
        if (cfg.profiles?.length) {
          const p = cfg.profiles[0]
          setLinkedin(l => ({ ...l, email: p.linkedin_username || '', connect_limit: String(p.connect_daily_limit || 20), follow_limit: String(p.follow_up_daily_limit || 20) }))
        }
        if (cfg.campaigns?.length) {
          const c = cfg.campaigns[0]
          setCampaign({ name: c.name, objective: c.campaign_objective || '', product_docs: c.product_docs || '', booking_link: c.booking_link || '' })
        }
      }
    }).catch(() => {})
  }, [])

  const setLlmField = (k, v) => setLlm(l => ({ ...l, [k]: v }))

  const handleSaveLlm = async () => {
    setSaving(true); setMsg('')
    const res = await api.saveLlm({ llm_provider: llm.provider, llm_api_key: llm.api_key, ai_model: llm.model, llm_api_base: llm.api_base })
    setSaving(false)
    if (res.error) { setMsg('❌ ' + res.error); return }
    setMsg('✅ Saved!'); setTimeout(() => { setMsg(''); setStep(1) }, 800)
  }

  const handleSaveLinkedin = async () => {
    if (!linkedin.email || !linkedin.password) { setMsg('❌ Email and password required'); return }
    setSaving(true); setMsg('')
    const res = await api.saveLinkedin({ linkedin_email: linkedin.email, linkedin_password: linkedin.password, connect_daily_limit: parseInt(linkedin.connect_limit), follow_up_daily_limit: parseInt(linkedin.follow_limit) })
    setSaving(false)
    if (res.error) { setMsg('❌ ' + res.error); return }
    setMsg('✅ Saved!'); setTimeout(() => { setMsg(''); setStep(2) }, 800)
  }

  const handleSaveCampaign = async () => {
    if (!campaign.name) { setMsg('❌ Campaign name required'); return }
    setSaving(true); setMsg('')
    const res = await api.saveCampaign({ name: campaign.name, campaign_objective: campaign.objective, product_docs: campaign.product_docs, booking_link: campaign.booking_link })
    setSaving(false)
    if (res.error) { setMsg('❌ ' + res.error); return }
    setMsg('✅ Campaign saved!'); setTimeout(() => { setMsg(''); setStep(3) }, 800)
  }

  return (
    <section id="config" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Setup</span> Wizard
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Configure your automation in 3 quick steps.</p>
        </motion.div>

        <motion.div
          className="glow-border rounded-2xl p-8"
          style={{ background: 'var(--card)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <StepIndicator current={step} />

          <AnimatePresence mode="wait">

            {/* Step 0 — LLM */}
            {step === 0 && (
              <motion.div key="llm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-semibold mb-6">LLM Configuration</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Provider</label>
                  <select
                    className="input-field"
                    value={llm.provider}
                    onChange={e => setLlmField('provider', e.target.value)}
                  >
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <Field label="API Key" type="password" value={llm.api_key} onChange={v => setLlmField('api_key', v)}
                  placeholder={existing?.has_api_key ? '(already set — leave blank to keep)' : 'sk-...'} />
                <Field label="Model" value={llm.model} onChange={v => setLlmField('model', v)}
                  placeholder={DEFAULT_MODELS[llm.provider] || 'model-name'} />
                {llm.provider === 'openai_compatible' && (
                  <Field label="API Base URL" value={llm.api_base} onChange={v => setLlmField('api_base', v)}
                    placeholder="https://your-endpoint/v1" />
                )}
                {msg && <p className="text-sm mb-4" style={{ color: msg.startsWith('✅') ? 'var(--success)' : '#ef4444' }}>{msg}</p>}
                <button onClick={handleSaveLlm} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                  {saving ? 'Saving...' : <><span>Save & Continue</span><ChevronRight size={16} /></>}
                </button>
              </motion.div>
            )}

            {/* Step 1 — LinkedIn */}
            {step === 1 && (
              <motion.div key="li" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-semibold mb-6">LinkedIn Credentials</h3>
                <div className="p-3 rounded-lg mb-5 text-sm" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                  ⚠️ Stored locally in your own SQLite DB. Never shared externally.
                </div>
                <Field label="LinkedIn Email" value={linkedin.email} onChange={v => setLinkedin(l => ({...l, email: v}))} placeholder="you@email.com" />
                <Field label="LinkedIn Password" type="password" value={linkedin.password} onChange={v => setLinkedin(l => ({...l, password: v}))}
                  placeholder={existing?.profiles?.length ? '(already set — leave blank to keep)' : 'your password'} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Daily Connect Limit" value={linkedin.connect_limit} onChange={v => setLinkedin(l => ({...l, connect_limit: v}))} placeholder="20" />
                  <Field label="Daily Follow-up Limit" value={linkedin.follow_limit} onChange={v => setLinkedin(l => ({...l, follow_limit: v}))} placeholder="20" />
                </div>
                {msg && <p className="text-sm mb-4" style={{ color: msg.startsWith('✅') ? 'var(--success)' : '#ef4444' }}>{msg}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-lg flex items-center gap-1 text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button onClick={handleSaveLinkedin} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? 'Saving...' : <><span>Save & Continue</span><ChevronRight size={16} /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Campaign */}
            {step === 2 && (
              <motion.div key="camp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-semibold mb-6">Campaign Setup</h3>
                <Field label="Campaign Name" value={campaign.name} onChange={v => setCampaign(c => ({...c, name: v}))} placeholder="My B2B Campaign" />
                <Field label="Campaign Objective" value={campaign.objective} onChange={v => setCampaign(c => ({...c, objective: v}))}
                  rows={3} placeholder="Target senior engineers, tech leads, and recruiters at Tier-1 MNCs (Google, Amazon, Flipkart, Razorpay, etc.) who can refer me for software engineering roles." />
                <Field label="Your Background / Resume Summary" value={campaign.product_docs} onChange={v => setCampaign(c => ({...c, product_docs: v}))}
                  rows={4} placeholder="Full Stack Engineer (React, Node.js, AI/LLM). 1 yr internship at DEHIX — built MERN production modules, integrated OpenAI APIs. Looking for SDE roles at Tier-1 companies." />
                <Field label="Booking Link (optional)" value={campaign.booking_link} onChange={v => setCampaign(c => ({...c, booking_link: v}))} placeholder="https://cal.com/you/30min" />
                {msg && <p className="text-sm mb-4" style={{ color: msg.startsWith('✅') ? 'var(--success)' : '#ef4444' }}>{msg}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg flex items-center gap-1 text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button onClick={handleSaveCampaign} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? 'Saving...' : <><span>Launch Campaign</span><ChevronRight size={16} /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Done */}
            {step === 3 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--success)' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                >
                  <Check size={36} style={{ color: 'var(--success)' }} />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3">All Set! 🎉</h3>
                <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
                  Configuration saved. Head to the Dashboard to start your automation.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setStep(0)} className="px-5 py-2.5 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    Edit Config
                  </button>
                  <a href="#dashboard" className="btn-primary px-6 py-2.5 rounded-lg text-sm no-underline flex items-center gap-2" style={{ textDecoration: 'none' }}>
                    Go to Dashboard →
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
