import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, RefreshCw, Users, Link, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../api'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      className="glow-border rounded-xl p-5"
      style={{ background: 'var(--card)' }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{value}</div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const logRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const s = await api.status()
      setStatus(s)
    } catch {
      setStatus({ running: false, stats: { leads: 0, connected: 0, pending: 0, completed: 0, failed: 0 } })
    }
  }

  const fetchLogs = async () => {
    try {
      const data = await api.logs(150)
      setLogs(data.lines || [])
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    fetchLogs()
    const t1 = setInterval(fetchStatus, 5000)
    const t2 = setInterval(fetchLogs, 3000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const handleStart = async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await api.daemonStart()
      setMsg(res.status === 'already_running' ? '⚡ Already running' : '✅ Daemon started!')
      setTimeout(fetchStatus, 1500)
    } catch {
      setMsg('❌ Failed to start — check Django server')
    }
    setLoading(false)
  }

  const handleStop = async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await api.daemonStop()
      setMsg(res.status === 'not_running' ? 'ℹ️ Was not running' : '🛑 Daemon stopped')
      setTimeout(fetchStatus, 1500)
    } catch {
      setMsg('❌ Failed to stop')
    }
    setLoading(false)
  }

  const running = status?.running ?? false
  const stats = status?.stats ?? {}

  const logColor = (line) => {
    if (!line) return 'var(--text-muted)'
    const l = line.toLowerCase()
    if (l.includes('error') || l.includes('failed') || l.includes('exception')) return '#ef4444'
    if (l.includes('warn')) return '#f59e0b'
    if (l.includes('connected') || l.includes('qualified') || l.includes('started') || l.includes('✅')) return '#10b981'
    if (l.includes('follow') || l.includes('message') || l.includes('send')) return '#06b6d4'
    if (l.includes('alive')) return '#7c3aed'
    return '#94a3b8'
  }

  return (
    <section id="dashboard" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Live</span> Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor and control your automation in real time.</p>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          className="glow-border rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
          style={{ background: 'var(--card)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Status indicator */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div
                className="w-4 h-4 rounded-full"
                style={{ background: running ? 'var(--success)' : '#4b5563' }}
              />
              {running && (
                <div
                  className="ping-slow absolute inset-0 rounded-full"
                  style={{ background: 'var(--success)' }}
                />
              )}
            </div>
            <div>
              <div className="font-semibold text-lg">
                Daemon: <span style={{ color: running ? 'var(--success)' : '#6b7280' }}>
                  {running ? 'Running' : 'Stopped'}
                </span>
                {status?.pid && running && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                    PID {status.pid}
                  </span>
                )}
              </div>
              {msg && (
                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{msg}</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={loading || running}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              <Play size={15} />
              Start
            </button>
            <button
              onClick={handleStop}
              disabled={loading || !running}
              className="btn-primary btn-danger flex items-center gap-2 disabled:opacity-40"
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              <Square size={15} />
              Stop
            </button>
            <button
              onClick={() => { fetchStatus(); fetchLogs() }}
              className="p-2.5 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Leads" value={stats.leads ?? '—'} color="#7c3aed" />
          <StatCard icon={Link} label="Connected" value={stats.connected ?? '—'} color="#06b6d4" />
          <StatCard icon={Clock} label="Pending" value={stats.pending ?? '—'} color="#f59e0b" />
          <StatCard icon={CheckCircle} label="Completed" value={stats.completed ?? '—'} color="#10b981" />
        </div>

        {/* Log Terminal */}
        <motion.div
          className="glow-border rounded-2xl overflow-hidden"
          style={{ background: '#08080f' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
            <span className="ml-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              daemon.log — live tail
            </span>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
              {logs.length} lines
            </span>
          </div>

          {/* Log content */}
          <div
            ref={logRef}
            className="terminal p-4 overflow-y-auto"
            style={{ height: 360, color: '#94a3b8' }}
          >
            <AnimatePresence initial={false}>
              {logs.length === 0 ? (
                <div style={{ color: '#4b5563' }}>Start the daemon to see live logs here...</div>
              ) : (
                logs.map((line, i) => (
                  <div
                    key={i}
                    style={{ color: logColor(line), marginBottom: 2 }}
                  >
                    {line || ' '}
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
