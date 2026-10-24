// dsh-sampling-sliders — Host half (ESM), ported to DSH 0.2.x
//
// v0.4.0 hot 模式修复：
//   - persist 模式：写入全局 profile patch，所有会话共享 ✓
//   - hot 模式：写入 per-session 内存 Map（key=sessionId），仅当前会话生效
//     会话销毁时自动清除，不再污染其他会话
//   - 启动时若全局 Config.mode='hot'，复位为 persist（防止残留）
//
// 0.2.x 配置通路：插件导出 Config schema + volatile 字段；mode 改动触发 profile 重载。
import z from '@deepseek-ai/schemastery'

export const name = 'sampling-sliders'
export const inject = ['webServer']

const MODE_PERSIST = 'persist'
const MODE_HOT = 'hot'

const DEFAULT_TEMPERATURE = 1
const DEFAULT_MAX_TOKENS = 4096

export const Config = z.object({
  mode: z.string().default(MODE_PERSIST).volatile(),
  overrideTemperature: z.boolean().default(false).volatile(),
  temperature: z.number().min(0).max(2).default(DEFAULT_TEMPERATURE).volatile(),
  overrideMaxTokens: z.boolean().default(false).volatile(),
  maxTokens: z.number().step(1).min(1).default(DEFAULT_MAX_TOKENS).volatile()
})

/** per-session hot overrides，仅在当前进程存活期间有效。 */
const hotOverrides = new Map()

function unref(value, fallback) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    try {
      const current = value.get()
      return current === undefined || current === null ? fallback : current
    } catch {
      return fallback
    }
  }
  return value === undefined || value === null ? fallback : value
}

/** 启动清理：把上一次运行遗留的 Config.mode='hot' 复位。 */
function clearHotOnBoot(ctx, config) {
  if (unref(config.mode, MODE_PERSIST) !== MODE_HOT) return
  const editor = ctx.get && ctx.get('configEditor')
  const entry = ctx.fiber && ctx.fiber.entry
  if (!editor || !entry) {
    console.warn('[sampling-sliders] mode is "hot" but configEditor is unavailable — hot mode reset skipped')
    return
  }
  setTimeout(() => {
    editor
      .edit(entry, (current) => ({ ...current, mode: MODE_PERSIST }))
      .then(() => console.log('[sampling-sliders] hot-mode flag cleared at boot'))
      .catch((error) => {
        console.warn('[sampling-sliders] hot-mode boot clear failed:', error instanceof Error ? error.message : String(error))
      })
  }, 0)
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  })
  res.end(payload)
}

function readBody(req, maxBytes = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) { reject(new Error('body too large')); req.destroy(); return }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** 解析 /api/plugin/sampling-sliders/hot/<sessionId> 路径并提取 sessionId。 */
function extractSessionId(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (!last || last === 'hot') return null
  if (!/^[a-zA-Z0-9_-]+$/.test(last)) return null
  return last
}

/** 注册 HTTP 路由给 Client 端调用 per-session hot overrides。 */
function registerHotRoutes(ctx) {
  const webServer = ctx.webServer
  if (!webServer) {
    console.warn('[sampling-sliders] webServer unavailable — hot mode HTTP routes not registered')
    return () => {}
  }

  const PREFIX = '/api/plugin/sampling-sliders/hot'

  // 合并 GET / POST(PUT) / DELETE 到同一条 prefix handler，避免重复注册同 PREFIX 被先到者吞掉
  const dispose = webServer.register({
    kind: 'prefix',
    path: PREFIX,
    handler: async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const sessionId = extractSessionId(url.pathname)
        if (!sessionId) return json(res, 400, { ok: false, error: 'sessionId required' })

        if (req.method === 'GET') {
          const hot = hotOverrides.get(sessionId)
          return json(res, 200, { ok: true, value: hot ?? null })
        }
        if (req.method === 'DELETE') {
          hotOverrides.delete(sessionId)
          return json(res, 200, { ok: true, cleared: true })
        }
        if (req.method === 'POST' || req.method === 'PUT') {
          const raw = await readBody(req)
          const body = JSON.parse(raw)
          hotOverrides.set(sessionId, {
            overrideTemperature: !!body.overrideTemperature,
            temperature: typeof body.temperature === 'number' ? body.temperature : DEFAULT_TEMPERATURE,
            overrideMaxTokens: !!body.overrideMaxTokens,
            maxTokens: typeof body.maxTokens === 'number' ? Math.round(body.maxTokens) : DEFAULT_MAX_TOKENS
          })
          return json(res, 200, { ok: true })
        }
        return json(res, 405, { ok: false, error: 'method not allowed' })
      } catch (err) {
        return json(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }
  })

  return () => { try { dispose() } catch {} }
}

export function apply(ctx, config = {}) {
  clearHotOnBoot(ctx, config)

  // 注册 HTTP 路由
  let disposeRoutes = null
  const tryRegister = () => {
    if (disposeRoutes) return
    if (ctx.webServer) disposeRoutes = registerHotRoutes(ctx)
  }
  tryRegister()
  if (!disposeRoutes && typeof ctx.on === 'function') {
    ctx.on('plugin/loaded', () => tryRegister())
  }

  // `agent/request` waterfall — hot 优先，fallback 到全局 persist config
  ctx.on('agent/request', async (payload, next) => {
    const proposed = await next()
    if (!proposed || typeof proposed !== 'object') return proposed

    const sessionId = payload && payload.agent && payload.agent.session && payload.agent.session.id
    const out = { ...proposed }

    const hot = sessionId ? hotOverrides.get(sessionId) : undefined
    if (hot) {
      if (hot.overrideTemperature) out.temperature = hot.temperature
      if (hot.overrideMaxTokens) out.maxTokens = hot.maxTokens
      return out
    }

    const overrides = {
      overrideTemperature: unref(config.overrideTemperature, false),
      temperature: unref(config.temperature, DEFAULT_TEMPERATURE),
      overrideMaxTokens: unref(config.overrideMaxTokens, false),
      maxTokens: unref(config.maxTokens, DEFAULT_MAX_TOKENS)
    }
    if (overrides.overrideTemperature) out.temperature = overrides.temperature
    if (overrides.overrideMaxTokens) out.maxTokens = overrides.maxTokens
    return out
  })

  // agent 销毁时清理 per-session hot overrides，防止内存泄漏
  ctx.on('agent/disposed', ({ agent }) => {
    const sid = agent && agent.session && agent.session.id
    if (sid && hotOverrides.has(sid)) {
      hotOverrides.delete(sid)
      console.log(`[sampling-sliders] hot overrides cleared for session ${sid}`)
    }
  })

  console.log('[sampling-sliders] agent/request interceptor active (0.2.x + per-session hot)')
}
