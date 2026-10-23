// dsh-sampling-sliders — Host half (out-of-tree plugin), ported to DSH 0.2.x
//
// 0.2.x 的配置通路与 0.1.x 完全不同：
//   - 0.1.x：调用 `ctx.settings.register(ns, schema, { applies: 'live' })` 注册命名空间。
//   - 0.2.x：`settings.register()` 已删除。插件改为导出 `Config` schema、把可热改的字段标
//     `.volatile()`；命名空间由 profile entry id 自动推导，表单由 dsh-settings 的
//     `volatileForm()` 从 schema 投影出来。
//
// 语义映射：
//   - volatile 字段 ⇒ 设置页可编辑 + 编辑后不重启插件（loader 提交到运行中的引用）。
//   - `mode: 'hot'` ⇒ 0.2.x 无原生对应（所有 volatile 编辑都写回 profile patch，必然持久化）。
//     此处保留原语义：启动自检时若 mode 为 hot，把 override 开关复位为 false，
//     使上一次运行留下的"热调值"不再生效（数值保留在文件里，但不注入请求）。
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'sampling-sliders'

// 0.2.x 不再需要把 settings 声明为硬依赖：配置就是插件自己的 Config，
// 没有 register 可调用。configEditor 是可选服务（用于 hot 模式启动清理），走 ctx.get。
export const inject: string[] = []

/** 持久化模式：写入配置，长期生效。 */
const MODE_PERSIST = 'persist'
/** 热调模式：本次运行生效，下次启动由 clearHotOnBoot 复位。 */
const MODE_HOT = 'hot'

const DEFAULT_TEMPERATURE = 1
const DEFAULT_MAX_TOKENS = 4096

// schemastery 3.18.4 的数值类型没有 `.optional()`，"可缺省"必须用 `.default()`。
// 因此"是否覆盖"不能靠字段是否存在表达，必须配一个显式的 override 布尔位。
export const Config = z.object({
  mode: z.string().default(MODE_PERSIST).volatile(),
  overrideTemperature: z.boolean().default(false).volatile(),
  temperature: z.number().min(0).max(2).default(DEFAULT_TEMPERATURE).volatile(),
  overrideMaxTokens: z.boolean().default(false).volatile(),
  maxTokens: z.number().step(1).min(1).default(DEFAULT_MAX_TOKENS).volatile()
})

/** 插件生效中的采样覆盖值。 */
interface SamplingOverrides {
  mode: string
  overrideTemperature: boolean
  temperature: number
  overrideMaxTokens: boolean
  maxTokens: number
}

/**
 * 读取一个 volatile 配置引用。
 * volatile 字段在 cordis 里以引用形式传入 apply，取值必须经 `.get()`；
 * 普通值（或引用失效时）直接返回。
 * @param value - 配置中的字段值，可能是引用也可能是裸值。
 * @param fallback - 取不到值时使用的兜底值。
 * @returns 字段的当前值。
 */
function unref<T>(value: unknown, fallback: T): T {
  if (value !== null && typeof value === 'object' && typeof (value as { get?: unknown }).get === 'function') {
    try {
      const current = (value as { get: () => unknown }).get()
      return current === undefined || current === null ? fallback : (current as T)
    } catch {
      return fallback
    }
  }
  return value === undefined || value === null ? fallback : (value as T)
}

/**
 * 启动清理：把上一次运行遗留的 hot 模式复位，使其不再生效。
 * 写回走 configEditor（可选服务）；任何失败都只记 warn，不影响插件本身工作。
 * @param ctx - 插件的运行上下文。
 * @param config - 经 cordis 校验后的插件配置（volatile 字段为引用）。
 */
function clearHotOnBoot(ctx: Context, config: Record<string, unknown>): void {
  if (unref(config.mode, MODE_PERSIST) !== MODE_HOT) return
  const editor = (ctx as { get?: (name: string) => unknown }).get?.('configEditor') as
    | { edit: (entry: unknown, change: (current: Record<string, unknown>) => Record<string, unknown>) => Promise<unknown> }
    | undefined
  const entry = (ctx as unknown as { fiber?: { entry?: unknown } }).fiber?.entry
  if (!editor || !entry) {
    console.warn('[sampling-sliders] mode is "hot" but configEditor is unavailable — stale hot values will keep applying')
    return
  }
  // 延后到本轮 apply 之外执行：edit() 会触发 profile 重载，避免与自身启动过程重入。
  setTimeout(() => {
    editor
      .edit(entry, (current: Record<string, unknown>) => ({
        ...current,
        mode: MODE_PERSIST,
        overrideTemperature: false,
        overrideMaxTokens: false
      }))
      .then(() => console.log('[sampling-sliders] hot-mode overrides cleared at boot'))
      .catch((error: unknown) => {
        console.warn('[sampling-sliders] hot-mode boot clear failed:', error instanceof Error ? error.message : String(error))
      })
  }, 0)
}

export function apply(ctx: Context, config: Record<string, unknown> = {}) {
  /**
   * 每次读取都重新解引用，保证 volatile 编辑（不重启插件）能被下一次请求看到。
   * @returns 当前的采样覆盖设置。
   */
  const read = (): SamplingOverrides => ({
    mode: unref(config.mode, MODE_PERSIST),
    overrideTemperature: unref(config.overrideTemperature, false),
    temperature: unref(config.temperature, DEFAULT_TEMPERATURE),
    overrideMaxTokens: unref(config.overrideMaxTokens, false),
    maxTokens: unref(config.maxTokens, DEFAULT_MAX_TOKENS)
  })

  clearHotOnBoot(ctx, config)

  // `agent/request` 是围绕冻结调用配置的 waterfall（dsh-agent-loop/lib/index.js:1704）。
  ;(ctx as any).on('agent/request', async (_payload: unknown, next: () => Promise<unknown>) => {
    const proposed = await next()
    if (!proposed || typeof proposed !== 'object') return proposed
    const overrides = read()
    const out: Record<string, unknown> = { ...(proposed as Record<string, unknown>) }
    if (overrides.overrideTemperature) out.temperature = overrides.temperature
    if (overrides.overrideMaxTokens) out.maxTokens = overrides.maxTokens
    return out
  })

  console.log('[sampling-sliders] agent/request interceptor active (0.2.x volatile config)')
}
