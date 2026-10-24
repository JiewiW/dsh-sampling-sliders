// dsh-sampling-sliders — Client half (Web SDK), ported to DSH 0.2.x
//
// 交互改造（v0.3.0 目标）：
//   - 不再常驻显示面板，改为输入栏右侧一个小按钮，点击唤起/隐藏浮窗
//   - 所有滑块/勾选改动只更新本地 state，点「保存」才调 API 写回 settings
//   - 浮窗用 position: absolute + z-index 脱离输入栏布局，像 dsh-naonao 一样
//   - "Hot: overrides apply this session only..." 改为鼠标悬停 Hot 选项时的 tooltip
//   - 持久化由 settings API 自动完成（写入 profile patch）

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

      // API 包装：把 0.2.x 位置参数接口 + 扁平响应 shape 统一成面板内部期望的签名。
      const api = {
        describe: () => settings.describe().then((res) => res || { ok: false, error: { message: 'no response' } }),
        update: (patch, rev) => settings.update('sampling-sliders', patch, rev).then((res) => res || { ok: false, error: { message: 'no response' } }),
        replace: (section, rev) => settings.replace('sampling-sliders', section, rev).then((res) => res || { ok: false, error: { message: 'no response' } })
      }

      // -------------------- 样式 --------------------
      const css = `
        #ss-trigger {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06);
          color: #bdbdd0; font-size: 14px; line-height: 1;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          position: relative;
        }
        #ss-trigger:hover { background: rgba(255,255,255,0.12); color: #e8e8ef; border-color: rgba(255,255,255,0.25); }
        #ss-trigger.active { background: rgba(141,124,255,0.2); border-color: rgba(141,124,255,0.4); color: #c8bfff; }
        #ss-trigger .ss-dot { position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%;
          background: #66c266; display: none; }
        #ss-trigger.has-active .ss-dot { display: block; }

        #ss-popup {
          position: absolute; bottom: 36px; right: 0; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px; padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
          background: rgba(18, 20, 24, 0.92); backdrop-filter: blur(8px);
          box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
          font-size: 13px; color: #e8e8ef; font-family: var(--dsh-font-family, sans-serif);
          width: 270px;
        }
        #ss-popup .ss-header { display: flex; justify-content: space-between; align-items: center; }
        #ss-popup .ss-title { font-size: 13px; font-weight: 600; color: #f0f0f8; }
        #ss-popup .ss-close { cursor: pointer; color: #88889c; font-size: 14px; padding: 2px 6px; border-radius: 4px; }
        #ss-popup .ss-close:hover { color: #e8e8ef; background: rgba(255,255,255,0.1); }

        #ss-popup .ss-row { display: flex; flex-direction: column; gap: 4px; }
        #ss-popup .ss-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; color: #bdbdd0; }
        #ss-popup .ss-row label:hover { color: #e8e8ef; }
        #ss-popup .ss-row input[type="range"] { width: 100%; accent-color: #8d7cff; }
        #ss-popup .ss-value { font-family: monospace; font-size: 12px; color: #c0c0d8; min-width: 40px; text-align: right; }
        #ss-popup .ss-pill { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; font-weight: 500; }
        #ss-popup .ss-pill.on { background: rgba(102,194,102,0.18); color: #66c266; }
        #ss-popup .ss-pill.off { background: rgba(128,128,148,0.18); color: #88889c; }

        #ss-popup .ss-radio-row { display: flex; gap: 12px; }
        #ss-popup .ss-radio-row label { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #bdbdd0; cursor: pointer; }
        #ss-popup .ss-radio-row label:hover { color: #e8e8ef; }

        #ss-popup .ss-footer { display: flex; gap: 6px; margin-top: 2px; }
        #ss-popup .ss-btn { flex: 1; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
          border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #e8e8ef; }
        #ss-popup .ss-btn:hover { background: rgba(255,255,255,0.14); }
        #ss-popup .ss-btn.primary { background: rgba(141,124,255,0.25); border-color: rgba(141,124,255,0.4); color: #d5ccff; }
        #ss-popup .ss-btn.primary:hover { background: rgba(141,124,255,0.4); }
        #ss-popup .ss-btn.cancel { background: rgba(255,255,255,0.04); color: #88889c; }
        #ss-popup .ss-btn.cancel:hover { color: #e8e8ef; }
        #ss-popup .ss-btn[disabled] { opacity: 0.5; cursor: not-allowed; }

        #ss-popup .ss-status { font-size: 11px; padding: 2px 6px; border-radius: 4px; min-height: 14px; }
        #ss-popup .ss-status.saved { color: #66c266; background: rgba(102,194,102,0.12); }
        #ss-popup .ss-status.dirty { color: #e29b4a; background: rgba(226,155,74,0.12); }
        #ss-popup .ss-status.error { color: #e24a4a; background: rgba(226,74,74,0.12); }

        /* 通用 label tooltip（Temperature / Max tokens / Persist / Hot） */
        .ss-label-tooltip { position: relative; display: inline-flex; align-items: center; }
        .ss-label-tooltip .ss-tooltip {
          visibility: hidden; opacity: 0; position: absolute; bottom: 100%; left: 50%;
          transform: translateX(-50%); margin-bottom: 6px; padding: 6px 10px;
          font-size: 11px; color: #e8e8ef; background: rgba(30,32,40,0.95);
          border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
          white-space: nowrap; z-index: 10000; pointer-events: none;
          transition: opacity 0.15s, visibility 0.15s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .ss-label-tooltip .ss-tooltip::after {
          content: ''; position: absolute; top: 100%; left: 50%; margin-left: -4px;
          border: 4px solid transparent; border-top-color: rgba(30,32,40,0.95);
        }
        .ss-label-tooltip:hover .ss-tooltip { visibility: visible; opacity: 1; }
      `
      const styleEl = document.getElementById('dsh-sampling-sliders-styles')
      if (!styleEl) {
        const s = document.createElement('style')
        s.id = 'dsh-sampling-sliders-styles'
        s.textContent = css
        document.head.appendChild(s)
      }

      // -------------------- 主组件 --------------------
      const SamplingSlidersWidget = () => {
        const [open, setOpen] = React.useState(false)
        const [loaded, setLoaded] = React.useState(false)

        // 已保存的值（来自 settings）
        const [savedMode, setSavedMode] = React.useState('persist')
        const [savedTemperature, setSavedTemperature] = React.useState(1)
        const [savedMaxTokens, setSavedMaxTokens] = React.useState(4096)
        const [savedOverrideTemp, setSavedOverrideTemp] = React.useState(false)
        const [savedOverrideMax, setSavedOverrideMax] = React.useState(false)
        const [revision, setRevision] = React.useState(0)

        // 编辑中的值（浮窗内）
        const [mode, setMode] = React.useState('persist')
        const [temperature, setTemperature] = React.useState(1)
        const [maxTokens, setMaxTokens] = React.useState(4096)
        const [overrideTemp, setOverrideTemp] = React.useState(false)
        const [overrideMax, setOverrideMax] = React.useState(false)

        const [status, setStatus] = React.useState('') // '', 'saved', 'dirty', 'error'
        const [saving, setSaving] = React.useState(false)
        const [errorMsg, setErrorMsg] = React.useState('')

        // 从 settings 加载
        const load = () => {
          api.describe()
            .then((res) => {
              if (res && res.ok) {
                const ns = (res.value && res.value.namespaces || []).find(n => n.ns === 'sampling-sliders')
                if (ns && ns.value) {
                  const v = ns.value
                  setSavedMode(v.mode || 'persist')
                  setSavedTemperature(v.temperature ?? 1)
                  setSavedMaxTokens(v.maxTokens ?? 4096)
                  setSavedOverrideTemp(!!v.overrideTemperature)
                  setSavedOverrideMax(!!v.overrideMaxTokens)
                  setRevision(ns.revision || 0)
                  // 同步到编辑态
                  setMode(v.mode || 'persist')
                  setTemperature(v.temperature ?? 1)
                  setMaxTokens(v.maxTokens ?? 4096)
                  setOverrideTemp(!!v.overrideTemperature)
                  setOverrideMax(!!v.overrideMaxTokens)
                } else {
                  // namespace 不存在，用默认值
                  resetEditing()
                }
                setStatus('')
                setErrorMsg('')
              } else {
                setStatus('error')
                setErrorMsg((res && res.error && res.error.message) || '加载失败')
              }
            })
            .catch((err) => {
              setStatus('error')
              setErrorMsg(err && err.message || '加载异常')
            })
            .finally(() => setLoaded(true))
        }

        const resetEditing = () => {
          setMode('persist')
          setTemperature(1)
          setMaxTokens(4096)
          setOverrideTemp(false)
          setOverrideMax(false)
        }

        // 初次加载
        React.useEffect(() => { load() }, [])

        // 判断是否有未保存的改动
        const isDirty = React.useMemo(() => {
          return mode !== savedMode
            || temperature !== savedTemperature
            || maxTokens !== savedMaxTokens
            || overrideTemp !== savedOverrideTemp
            || overrideMax !== savedOverrideMax
        }, [mode, temperature, maxTokens, overrideTemp, overrideMax,
            savedMode, savedTemperature, savedMaxTokens, savedOverrideTemp, savedOverrideMax])

        // 判断是否有活跃的覆盖（决定是否显示触发器上的绿点）
        const hasActiveOverrides = React.useMemo(() => {
          return (savedOverrideTemp && !isNaN(savedTemperature))
            || (savedOverrideMax && !isNaN(savedMaxTokens))
        }, [savedOverrideTemp, savedOverrideMax, savedTemperature, savedMaxTokens])

        // 保存
        const handleSave = () => {
          if (saving) return
          setSaving(true)
          setStatus('')
          setErrorMsg('')

          const patch = {
            mode: mode,
            overrideTemperature: overrideTemp,
            temperature: temperature,
            overrideMaxTokens: overrideMax,
            maxTokens: maxTokens
          }

          api.update(patch, revision)
            .then((res) => {
              if (res && res.ok) {
                const newRev = (res.value && res.value.revision) || revision
                setRevision(newRev)
                setSavedMode(mode)
                setSavedTemperature(temperature)
                setSavedMaxTokens(maxTokens)
                setSavedOverrideTemp(overrideTemp)
                setSavedOverrideMax(overrideMax)
                setStatus('saved')
                setTimeout(() => setStatus(''), 1500)
              } else {
                setStatus('error')
                setErrorMsg((res && res.error && res.error.message) || '保存失败')
              }
            })
            .catch((err) => {
              setStatus('error')
              setErrorMsg(err && err.message || '保存异常')
            })
            .finally(() => setSaving(false))
        }

        // 取消关闭浮窗
        const handleCancel = () => {
          // 把编辑态还原为已保存态
          setMode(savedMode)
          setTemperature(savedTemperature)
          setMaxTokens(savedMaxTokens)
          setOverrideTemp(savedOverrideTemp)
          setOverrideMax(savedOverrideMax)
          setStatus('')
          setErrorMsg('')
          setOpen(false)
        }

        // ESC 关闭浮窗
        React.useEffect(() => {
          if (!open) return
          const onKey = (e) => { if (e.key === 'Escape') handleCancel() }
          window.addEventListener('keydown', onKey)
          return () => window.removeEventListener('keydown', onKey)
        }, [open])

        // 点击外部关闭浮窗
        React.useEffect(() => {
          if (!open) return
          const onDocClick = (e) => {
            const popup = document.getElementById('ss-popup')
            const trigger = document.getElementById('ss-trigger')
            if (popup && !popup.contains(e.target) && trigger && !trigger.contains(e.target)) {
              handleCancel()
            }
          }
          // 延迟一帧再绑定，避免触发器的 click 立即触发关闭
          const id = setTimeout(() => document.addEventListener('mousedown', onDocClick), 0)
          return () => {
            clearTimeout(id)
            document.removeEventListener('mousedown', onDocClick)
          }
        }, [open])

        // 渲染触发器按钮（内嵌 relative container）
        const triggerEl = React.createElement('div', {
          style: { position: 'relative', display: 'inline-block' },
          onClick: () => setOpen(prev => !prev),
          onMouseDown: (e) => {
            // popup 内部的 mousedown 不要冒泡到触发器的 toggle
            const popup = document.getElementById('ss-popup')
            if (popup && popup.contains(e.target)) e.stopPropagation()
          }
        }, [
          React.createElement('button', {
            id: 'ss-trigger',
            className: 'ss-trigger' + (open ? ' active' : '') + (hasActiveOverrides ? ' has-active' : ''),
            type: 'button',
            title: '采样参数（Temperature / MaxTokens）'
          }, [
            // Slider 图标（SVG inline）
            React.createElement('svg', {
              width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
              style: { display: 'block' }
            }, [
              React.createElement('line', { x1: '4', y1: '21', x2: '4', y2: '14' }),
              React.createElement('line', { x1: '4', y1: '10', x2: '4', y2: '3' }),
              React.createElement('line', { x1: '12', y1: '21', x2: '12', y2: '12' }),
              React.createElement('line', { x1: '12', y1: '8', x2: '12', y2: '3' }),
              React.createElement('line', { x1: '20', y1: '21', x2: '20', y2: '16' }),
              React.createElement('line', { x1: '20', y1: '12', x2: '20', y2: '3' }),
              React.createElement('line', { x1: '1', y1: '14', x2: '7', y2: '14' }),
              React.createElement('line', { x1: '9', y1: '8', x2: '15', y2: '8' }),
              React.createElement('line', { x1: '17', y1: '16', x2: '23', y2: '16' })
            ]),
            React.createElement('span', { className: 'ss-dot', key: 'dot' })
          ]),

          // 浮窗（onClick stopPropagation 防止冒泡到外层 toggle 容器导致误关闭）
          open && React.createElement('div', {
            id: 'ss-popup', key: 'popup',
            onClick: (e) => { e.stopPropagation() }
          }, [
            // header
            React.createElement('div', { className: 'ss-header' }, [
              React.createElement('span', { className: 'ss-title', key: 'title' }, '采样参数'),
              React.createElement('span', {
                className: 'ss-close', key: 'close',
                onClick: (e) => { e.stopPropagation(); handleCancel() },
                role: 'button', 'aria-label': '关闭', title: '关闭（ESC）'
              }, '✕')
            ]),

            // Temperature row
            React.createElement('div', { className: 'ss-row', key: 'temp' },
              React.createElement('label', {},
                React.createElement('input', {
                  type: 'checkbox',
                  checked: overrideTemp,
                  onChange: (e) => setOverrideTemp(e.target.checked)
                }),
                React.createElement('span', { className: 'ss-label-tooltip' }, [
                  'Temperature',
                  React.createElement('span', { className: 'ss-tooltip', role: 'tooltip', key: 'tip' },
                    '控制生成文本的随机性。值越高输出越多样，值越低越确定。'
                  )
                ]),
                React.createElement('span', { className: 'ss-pill ' + (overrideTemp ? 'on' : 'off') }, overrideTemp ? 'on' : 'off')
              ),
              overrideTemp && React.createElement('input', {
                type: 'range', min: 0, max: 2, step: 0.05,
                value: temperature,
                onChange: (e) => setTemperature(parseFloat(e.target.value))
              }),
              overrideTemp && React.createElement('div', { className: 'ss-value' }, temperature.toFixed(2))
            ),

            // Max tokens row
            React.createElement('div', { className: 'ss-row', key: 'max' },
              React.createElement('label', {},
                React.createElement('input', {
                  type: 'checkbox',
                  checked: overrideMax,
                  onChange: (e) => setOverrideMax(e.target.checked)
                }),
                React.createElement('span', { className: 'ss-label-tooltip' }, [
                  'Max tokens',
                  React.createElement('span', { className: 'ss-tooltip', role: 'tooltip', key: 'tip' },
                    '单次回复最多生成的 token 数上限，防止回复过长。'
                  )
                ]),
                React.createElement('span', { className: 'ss-pill ' + (overrideMax ? 'on' : 'off') }, overrideMax ? 'on' : 'off')
              ),
              overrideMax && React.createElement('input', {
                type: 'range', min: 512, max: 256000, step: 1024,
                value: maxTokens,
                onChange: (e) => setMaxTokens(parseInt(e.target.value, 10))
              }),
              overrideMax && React.createElement('div', { className: 'ss-value' }, maxTokens.toLocaleString())
            ),

            // Mode row
            React.createElement('div', { className: 'ss-row', key: 'mode' },
              React.createElement('div', { className: 'ss-radio-row' },
                React.createElement('label', { key: 'persist' },
                  React.createElement('input', {
                    type: 'radio', name: 'ss-mode',
                    checked: mode === 'persist',
                    onChange: () => setMode('persist')
                  }),
                  React.createElement('span', { className: 'ss-label-tooltip' }, [
                    'Persist',
                    React.createElement('span', { className: 'ss-tooltip', role: 'tooltip', key: 'tip' },
                      '覆盖值保存到配置，后续会话持续生效，可随时修改。'
                    )
                  ])
                ),
                React.createElement('label', { key: 'hot' },
                  React.createElement('input', {
                    type: 'radio', name: 'ss-mode',
                    checked: mode === 'hot',
                    onChange: () => setMode('hot')
                  }),
                  React.createElement('span', { className: 'ss-label-tooltip' }, [
                    'Hot',
                    React.createElement('span', { className: 'ss-tooltip', role: 'tooltip', key: 'tip' },
                      '覆盖值仅在当前会话生效，下次启动自动清除。'
                    )
                  ])
                )
              )
            ),

            // 状态提示
            React.createElement('div', { key: 'status', className: 'ss-status ' + status },
              status === 'saved' ? '✓ 已保存'
              : status === 'dirty' ? '● 有未保存的改动'
              : status === 'error' ? ('✗ ' + errorMsg)
              : ''
            ),

            // Footer
            React.createElement('div', { className: 'ss-footer' },
              React.createElement('button', {
                className: 'ss-btn primary',
                disabled: !isDirty || saving,
                onClick: handleSave,
                type: 'button'
              }, saving ? '保存中…' : '保存'),
              React.createElement('button', {
                className: 'ss-btn cancel',
                disabled: saving,
                onClick: handleCancel,
                type: 'button'
              }, '取消')
            )
          ])
        ])

        return triggerEl
      }

      // slots.inject 等待槽声明后再注册
      ctx.slots.inject('conversation.input.right', () =>
        ctx.slots.register({ name: 'conversation.input.right', id: 'sampling-params', order: 0 }, () =>
          React.createElement(SamplingSlidersWidget)
        )
      )
    }

    exports.inject = ['slots', 'remote', 'remote.settings']
    exports.apply = apply
    return module.exports
  }
})
