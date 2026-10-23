// dsh-sampling-sliders — Client half (Web SDK), ported to DSH 0.2.x
//
// 0.2.x 客户端 settings 通路：
//   - 0.1.x：connection.api.settings.describe/update/replace，响应 {result:{ok,value}}。
//   - 0.2.x：ctx.remote.settings.describe() / update(ns, patch, rev) / replace(ns, section, rev)，
//     响应扁平 {ok, value, error}。
//   - namespace id 仍为 'sampling-sliders'，与 host 侧导出 Config 的 profile entry id 对齐。
//   - slots 注入契约（list kind 需 options.id）在 0.2.x 与 0.1.x 相同。
//
// 本文件必须被 window.__ModuleLoader__.load({ id, factory }) 包裹：打包器把各插件
// client.js 原样拼进成品 combo bundle，顶层 return/module.exports 会导致整包解析失败
// （SyntaxError: Illegal return statement）→ Web UI 全挂。React 不能依赖全局，必须
// 在 factory 内 require('react')。
window.__ModuleLoader__.load({
  id: 'dsh-sampling-sliders',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    function apply(ctx) {
      var settings = ctx.remote && ctx.remote.settings
      if (!settings) {
        console.warn('[sampling-sliders] remote.settings unavailable — UI registration skipped')
        return
      }

      const Panel = ({ api }) => {
        const [loaded, setLoaded] = React.useState(false)
        const [status, setStatus] = React.useState('loading')
        const [mode, setMode] = React.useState('persist')
        const [temperature, setTemperature] = React.useState(1)
        const [maxTokens, setMaxTokens] = React.useState(4096)
        const [overrideTemp, setOverrideTemp] = React.useState(false)
        const [overrideMax, setOverrideMax] = React.useState(false)
        const [revision, setRevision] = React.useState(0)

        const apiHelpers = api || {}
        const load = () => {
          apiHelpers.describe()
            .then((res) => {
              if (res && res.ok) {
                const ns = (res.value && res.value.namespaces || []).find(n => n.ns === 'sampling-sliders')
                if (ns && ns.value) {
                  const v = ns.value
                  setMode(v.mode || 'persist')
                  setTemperature(v.temperature ?? 1)
                  setMaxTokens(v.maxTokens ?? 4096)
                  setOverrideTemp(!!v.overrideTemperature)
                  setOverrideMax(!!v.overrideMaxTokens)
                  setRevision(ns.revision || 0)
                  setStatus('ok')
                } else {
                  setStatus('ns_not_found')
                }
              } else {
                setStatus((res && res.error && res.error.message) || 'describe_failed')
              }
            })
            .catch((err) => {
              setStatus(err && err.message || 'describe_exception')
            })
            .finally(() => setLoaded(true))
        }

        const apply = (opts) => {
          const patch = {}
          if ('overrideTemperature' in opts) patch.overrideTemperature = opts.overrideTemperature
          if ('temperature' in opts) patch.temperature = opts.temperature
          if ('overrideMaxTokens' in opts) patch.overrideMaxTokens = opts.overrideMaxTokens
          if ('maxTokens' in opts) patch.maxTokens = opts.maxTokens
          apiHelpers.update(patch, revision)
            .then((res) => {
              if (res && res.ok) {
                setRevision((res.value && res.value.revision) || revision)
                setStatus('saved')
                setTimeout(() => setStatus('ok'), 1200)
              } else {
                setStatus((res && res.error && res.error.message) || 'update_failed')
              }
            })
            .catch((err) => setStatus(err && err.message || 'update_exception'))
        }

        const reset = () => {
          apiHelpers.replace({
            mode: 'persist',
            overrideTemperature: false,
            overrideMaxTokens: false
          }, revision)
            .then((res) => {
              if (res && res.ok) {
                setRevision((res.value && res.value.revision) || revision)
                setOverrideTemp(false)
                setOverrideMax(false)
                setMode('persist')
                setStatus('reset')
                setTimeout(() => setStatus('ok'), 1200)
              } else {
                setStatus((res && res.error && res.error.message) || 'replace_failed')
              }
            })
            .catch((err) => setStatus(err && err.message || 'replace_exception'))
        }

        React.useEffect(() => { load() }, [])

        const isTempActive = overrideTemp && temperature !== null && !isNaN(temperature)
        const isMaxActive = overrideMax && maxTokens !== null && !isNaN(maxTokens)
        const anyActive = isTempActive || isMaxActive

        const css = `
          #dsh-sampling-sliders-panel {
            display: flex; flex-direction: column; gap: 6px; padding: 8px 10px;
            border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
            background: rgba(18, 20, 24, 0.55); backdrop-filter: blur(6px);
            box-shadow: 0 2px 10px rgba(0,0,0,0.25); margin-top: 10px;
            font-size: 13px; color: #e8e8ef; font-family: var(--dsh-font-family, sans-serif);
            max-width: 260px;
          }
          #dsh-sampling-sliders-panel .ss-title { font-size: 13px; font-weight: 600; color: #f0f0f8; }
          #dsh-sampling-sliders-panel .ss-row { display: flex; flex-direction: column; gap: 4px; }
          #dsh-sampling-sliders-panel .ss-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; color: #bdbdd0; }
          #dsh-sampling-sliders-panel .ss-row input[type="range"] { width: 100%; accent-color: #8d7cff; }
          #dsh-sampling-sliders-panel .ss-value { font-family: monospace; font-size: 12px; color: #c0c0d8; min-width: 40px; text-align: right; }
          #dsh-sampling-sliders-panel .ss-status { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
          #dsh-sampling-sliders-panel .ss-status.ok { color: #66c266; background: rgba(102,194,102,0.12); }
          #dsh-sampling-sliders-panel .ss-status.saved { color: #4a90e2; background: rgba(74,144,226,0.12); }
          #dsh-sampling-sliders-panel .ss-status.reset { color: #e29b4a; background: rgba(226,155,74,0.12); }
          #dsh-sampling-sliders-panel .ss-status.error,
          #dsh-sampling-sliders-panel .ss-status.ns_not_found,
          #dsh-sampling-sliders-panel .ss-status.loading { color: #e24a4a; background: rgba(226,74,74,0.12); }
          #dsh-sampling-sliders-panel .ss-footer { display: flex; gap: 6px; }
          #dsh-sampling-sliders-panel .ss-btn { flex: 1; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;
            border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #e8e8ef; }
          #dsh-sampling-sliders-panel .ss-btn:hover { background: rgba(255,255,255,0.14); }
          #dsh-sampling-sliders-panel .ss-btn.reset-all { background: rgba(226,74,74,0.15); border-color: rgba(226,74,74,0.35); color: #f0b0b0; }
          #dsh-sampling-sliders-panel .ss-btn.reset-all:hover { background: rgba(226,74,74,0.25); }
          #dsh-sampling-sliders-panel .ss-pill { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; font-weight: 500; }
          #dsh-sampling-sliders-panel .ss-pill.on { background: rgba(102,194,102,0.18); color: #66c266; }
          #dsh-sampling-sliders-panel .ss-pill.off { background: rgba(128,128,148,0.18); color: #88889c; }
          #dsh-sampling-sliders-panel .ss-help { font-size: 11px; color: #8d8da8; line-height: 1.4; }
          #dsh-sampling-sliders-panel .ss-radio-row { display: flex; gap: 8px; }
          #dsh-sampling-sliders-panel .ss-radio-row label { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #bdbdd0; cursor: pointer; }
        `
        const styleEl = document.getElementById('dsh-sampling-sliders-styles')
        if (!styleEl) {
          const s = document.createElement('style'); s.id = 'dsh-sampling-sliders-styles'; s.textContent = css;
          document.head.appendChild(s)
        }

        return React.createElement('div', { id: 'dsh-sampling-sliders-panel' }, [
          React.createElement('div', { key: 'title', className: 'ss-title' }, 'Sampling sliders'),
          React.createElement('div', { key: 'temp', className: 'ss-row' },
            React.createElement('label', { key: 'label' },
              React.createElement('input', {
                type: 'checkbox',
                checked: overrideTemp,
                onChange: (e) => {
                  const v = e.target.checked
                  setOverrideTemp(v)
                  apply({ overrideTemperature: v })
                }
              }),
              'Temperature',
              React.createElement('span', { className: 'ss-pill ' + (overrideTemp ? 'on' : 'off') }, overrideTemp ? 'on' : 'off')
            ),
            overrideTemp && React.createElement('input', {
              key: 'slider',
              type: 'range', min: 0, max: 2, step: 0.05,
              value: temperature,
              onChange: (e) => {
                const v = parseFloat(e.target.value)
                setTemperature(v)
                apply({ temperature: v })
              }
            }),
            overrideTemp && React.createElement('div', { key: 'val', className: 'ss-value' }, temperature.toFixed(2))
          ),
          React.createElement('div', { key: 'max', className: 'ss-row' },
            React.createElement('label', { key: 'label' },
              React.createElement('input', {
                type: 'checkbox',
                checked: overrideMax,
                onChange: (e) => {
                  const v = e.target.checked
                  setOverrideMax(v)
                  apply({ overrideMaxTokens: v })
                }
              }),
              'Max tokens',
              React.createElement('span', { className: 'ss-pill ' + (overrideMax ? 'on' : 'off') }, overrideMax ? 'on' : 'off')
            ),
            overrideMax && React.createElement('input', {
              key: 'slider',
              type: 'range', min: 512, max: 256000, step: 1024,
              value: maxTokens,
              onChange: (e) => {
                const v = parseInt(e.target.value, 10)
                setMaxTokens(v)
                apply({ maxTokens: v })
              }
            }),
            overrideMax && React.createElement('div', { key: 'val', className: 'ss-value' }, maxTokens.toLocaleString())
          ),
          React.createElement('div', { key: 'mode', className: 'ss-row' },
            React.createElement('div', { className: 'ss-radio-row' },
              React.createElement('label', { key: 'persist' },
                React.createElement('input', {
                  type: 'radio', name: 'ss-mode', checked: mode === 'persist',
                  onChange: () => { setMode('persist'); apiHelpers.update({ mode: 'persist' }, revision).catch(() => {}) }
                }), 'Persist'
              ),
              React.createElement('label', { key: 'hot' },
                React.createElement('input', {
                  type: 'radio', name: 'ss-mode', checked: mode === 'hot',
                  onChange: () => { setMode('hot'); apiHelpers.update({ mode: 'hot' }, revision).catch(() => {}) }
                }), 'Hot'
              )
            )
          ),
          React.createElement('div', { key: 'status', className: 'ss-status ' + (status === 'saved' ? 'saved' : status === 'reset' ? 'reset' : status === 'loading' ? 'loading' : (status && status.includes && status.includes('fail')) || (status === 'ns_not_found') ? 'error' : 'ok') },
            status === 'ok' ? 'Ready' : status
          ),
          React.createElement('div', { key: 'footer', className: 'ss-footer' },
            React.createElement('button', {
              className: 'ss-btn reset-all',
              onClick: () => {
                if (confirm('Reset all overrides and switch to persist mode?')) reset()
              }
            }, 'Reset all'),
            React.createElement('button', {
              className: 'ss-btn',
              onClick: () => load()
            }, 'Reload')
          ),
          React.createElement('div', { key: 'help', className: 'ss-help' },
            'Hot: overrides apply this session only, cleared on next start.'
          )
        ].filter(Boolean))
      }

      // 适配后的 API 包装：把 0.2.x 位置参数接口 + 扁平响应 shape 统一成面板内部期望的签名。
      const api = {
        describe: () => settings.describe().then((res) => res || { ok: false, error: { message: 'no response' } }),
        update: (patch, rev) => settings.update('sampling-sliders', patch, rev).then((res) => res || { ok: false, error: { message: 'no response' } }),
        replace: (section, rev) => settings.replace('sampling-sliders', section, rev).then((res) => res || { ok: false, error: { message: 'no response' } })
      }

      // slots.inject 等待槽声明后再注册；inject 回调返回 register 的 disposer，
      // 0.2.x 卸载时据此自动反注册。
      ctx.slots.inject('conversation.input.right', () =>
        ctx.slots.register({ name: 'conversation.input.right', id: 'sampling-params', order: 0 }, () =>
          React.createElement(Panel, { api })
        )
      )
    }

    exports.inject = ['slots', 'remote', 'remote.settings']
    exports.apply = apply
    return module.exports
  }
})
