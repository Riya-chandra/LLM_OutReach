const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

export const api = {
  status: () => req('/status/'),
  logs: (lines = 150) => req(`/logs/?lines=${lines}`),
  daemonStart: () => req('/daemon/start/', { method: 'POST' }),
  daemonStop: () => req('/daemon/stop/', { method: 'POST' }),
  getConfig: () => req('/config/'),
  saveLlm: (data) => req('/config/llm/', { method: 'POST', body: JSON.stringify(data) }),
  saveCampaign: (data) => req('/config/campaign/', { method: 'POST', body: JSON.stringify(data) }),
  saveLinkedin: (data) => req('/config/linkedin/', { method: 'POST', body: JSON.stringify(data) }),
}
