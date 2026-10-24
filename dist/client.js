// dsh-sampling-sliders — Client half (Web SDK), ported to DSH 0.2.x
//
// v0.4.0 hot 模式修复：
//   - persist 模式：写入全局 settings namespace，所有会话共享 ✓
//   - hot 模式：写入 Host 端 per-session 内存 Map（key=sessionId），仅当前会话生效
//     会话切换/销毁时自动清除，不再污染其他会话
//   - 客户端从 window.location 提取当前 sessionId，随 hot 请求一起发送

window.__ModuleLoader__.load({
  id: 'dsh-sampling-sliders',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    /**
     * 从当前 URL 提取 DSH 会话 ID。
     * DSH Web 典型 URL: http://127.0.0.1:3080/?token=xxx#/session/session-abc123...
     */
    function extractCurrentSessionId() {
      try {
        var hash = window.location.hash || ''
        var m = hash.match(/\/session\/([a-zA-Z0-9_-]+)/)
        if (m) return m[1]
      } catch (_) { /* ignore */ }
      return null
    }

    function apply(ctx) {
      var settings = ctx.remote && ctx.remote.settings
      if (!settings) {
        console.warn('[sampling-sliders] remote.settings unavailable — UI registration skipped')
        return
      }

      var origin = window.location.origin

      var api = {
        describe: function () {
          return settings.describe().then(function (res) { return res || { ok: false, error: { message: 'no response' } } })
        },
        update: function (patch, rev) {
          return settings.update('sampling-sliders', patch, rev).then(function (res) { return res || { ok: false, error: { message: 'no response' } } })
        },

        // Hot 模式 per-session HTTP 路由
        getHot: function (sessionId) {
          if (!sessionId) return Promise.resolve({ ok: false, error: 'no sessionId' })
          return fetch(origin + '/api/plugin/sampling-sliders/hot/' + encodeURIComponent(sessionId))
            .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'invalid json' } }) })
            .catch(function (e) { return { ok: false, error: (e && e.message) || 'fetch error' } })
        },
        setHot: function (sessionId, values) {
          if (!sessionId) return Promise.resolve({ ok: false, error: 'no sessionId' })
          return fetch(origin + '/api/plugin/sampling-sliders/hot/' + encodeURIComponent(sessionId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values)
          }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'invalid json' } }) })
            .catch(function (e) { return { ok: false, error: (e && e.message) || 'fetch error' } })
        },
        clearHot: function (sessionId) {
          if (!sessionId) return Promise.resolve({ ok: false, error: 'no sessionId' })
          return fetch(origin + '/api/plugin/sampling-sliders/hot/' + encodeURIComponent(sessionId), { method: 'DELETE' })
            .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'invalid json' } }) })
            .catch(function (e) { return { ok: false, error: (e && e.message) || 'fetch error' } })
        }
      }

      // -------------------- 样式 --------------------
      var css = [
        '#ss-trigger { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; cursor:pointer; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.06); color:#bdbdd0; font-size:14px; line-height:1; transition:background .15s,color .15s,border-color .15s; position:relative; }',
        '#ss-trigger:hover { background:rgba(255,255,255,.12); color:#e8e8ef; border-color:rgba(255,255,255,.25); }',
        '#ss-trigger.active { background:rgba(141,124,255,.2); border-color:rgba(141,124,255,.4); color:#c8bfff; }',
        '#ss-trigger .ss-dot { position:absolute; top:3px; right:3px; width:6px; height:6px; border-radius:50%; background:#66c266; display:none; }',
        '#ss-trigger.has-active .ss-dot { display:block; }',
        '#ss-popup { position:absolute; bottom:36px; right:0; z-index:9999; display:flex; flex-direction:column; gap:8px; padding:10px 12px; border:1px solid rgba(255,255,255,.15); border-radius:10px; background:rgba(18,20,24,.92); backdrop-filter:blur(8px); box-shadow:0 -8px 24px rgba(0,0,0,.4); font-size:13px; color:#e8e8ef; font-family:var(--dsh-font-family,sans-serif); width:270px; }',
        '#ss-popup .ss-header { display:flex; justify-content:space-between; align-items:center; }',
        '#ss-popup .ss-title { font-size:13px; font-weight:600; color:#f0f0f8; }',
        '#ss-popup .ss-close { cursor:pointer; color:#88889c; font-size:14px; padding:2px 6px; border-radius:4px; }',
        '#ss-popup .ss-close:hover { color:#e8e8ef; background:rgba(255,255,255,.1); }',
        '#ss-popup .ss-row { display:flex; flex-direction:column; gap:4px; }',
        '#ss-popup .ss-row label { display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:#bdbdd0; }',
        '#ss-popup .ss-row label:hover { color:#e8e8ef; }',
        '#ss-popup .ss-row input[type="range"] { width:100%; accent-color:#8d7cff; }',
        '#ss-popup .ss-value { font-family:monospace; font-size:12px; color:#c0c0d8; min-width:40px; text-align:right; }',
        '#ss-popup .ss-pill { display:inline-block; font-size:10px; padding:1px 6px; border-radius:10px; margin-left:4px; font-weight:500; }',
        '#ss-popup .ss-pill.on { background:rgba(102,194,102,.18); color:#66c266; }',
        '#ss-popup .ss-pill.off { background:rgba(128,128,148,.18); color:#88889c; }',
        '#ss-popup .ss-radio-row { display:flex; gap:12px; }',
        '#ss-popup .ss-radio-row label { display:flex; align-items:center; gap:4px; font-size:12px; color:#bdbdd0; cursor:pointer; }',
        '#ss-popup .ss-radio-row label:hover { color:#e8e8ef; }',
        '#ss-popup .ss-footer { display:flex; gap:6px; margin-top:2px; }',
        '#ss-popup .ss-btn { flex:1; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.08); color:#e8e8ef; }',
        '#ss-popup .ss-btn:hover { background:rgba(255,255,255,.14); }',
        '#ss-popup .ss-btn.primary { background:rgba(141,124,255,.25); border-color:rgba(141,124,255,.4); color:#d5ccff; }',
        '#ss-popup .ss-btn.primary:hover { background:rgba(141,124,255,.4); }',
        '#ss-popup .ss-btn.cancel { background:rgba(255,255,255,.04); color:#88889c; }',
        '#ss-popup .ss-btn.cancel:hover { color:#e8e8ef; }',
        '#ss-popup .ss-btn[disabled] { opacity:.5; cursor:not-allowed; }',
        '#ss-popup .ss-status { font-size:11px; padding:2px 6px; border-radius:4px; min-height:14px; }',
        '#ss-popup .ss-status.saved { color:#66c266; background:rgba(102,194,102,.12); }',
        '#ss-popup .ss-status.dirty { color:#e29b4a; background:rgba(226,155,74,.12); }',
        '#ss-popup .ss-status.error { color:#e24a4a; background:rgba(226,74,74,.12); }',
        '.ss-label-tooltip { position:relative; display:inline-flex; align-items:center; }',
        '.ss-label-tooltip .ss-tooltip { visibility:hidden; opacity:0; position:absolute; bottom:100%; left:50%; transform:translateX(-50%); margin-bottom:6px; padding:6px 10px; font-size:11px; color:#e8e8ef; background:rgba(30,32,40,.95); border:1px solid rgba(255,255,255,.15); border-radius:6px; white-space:nowrap; z-index:10000; pointer-events:none; transition:opacity .15s,visibility .15s; box-shadow:0 4px 12px rgba(0,0,0,.3); }',
        '.ss-label-tooltip .ss-tooltip::after { content:""; position:absolute; top:100%; left:50%; margin-left:-4px; border:4px solid transparent; border-top-color:rgba(30,32,40,.95); }',
        '.ss-label-tooltip:hover .ss-tooltip { visibility:visible; opacity:1; }'
      ].join('')
      if (!document.getElementById('dsh-sampling-sliders-styles')) {
        var s = document.createElement('style')
        s.id = 'dsh-sampling-sliders-styles'
        s.textContent = css
        document.head.appendChild(s)
      }

      var SamplingSlidersWidget = function () {
        var open = React.useState(false); var setOpen = open[1]
        var loaded = React.useState(false); var setLoaded = loaded[1]

        var savedMode = React.useState('persist'); var setSavedMode = savedMode[1]
        var savedTemperature = React.useState(1); var setSavedTemperature = savedTemperature[1]
        var savedMaxTokens = React.useState(4096); var setSavedMaxTokens = savedMaxTokens[1]
        var savedOverrideTemp = React.useState(false); var setSavedOverrideTemp = savedOverrideTemp[1]
        var savedOverrideMax = React.useState(false); var setSavedOverrideMax = savedOverrideMax[1]
        var revision = React.useState(0); var setRevision = revision[1]

        var hasHotOverride = React.useState(false); var setHasHotOverride = hasHotOverride[1]

        var mode = React.useState('persist'); var setMode = mode[1]
        var temperature = React.useState(1); var setTemperature = temperature[1]
        var maxTokens = React.useState(4096); var setMaxTokens = maxTokens[1]
        var overrideTemp = React.useState(false); var setOverrideTemp = overrideTemp[1]
        var overrideMax = React.useState(false); var setOverrideMax = overrideMax[1]

        var status = React.useState(''); var setStatus = status[1]
        var saving = React.useState(false); var setSaving = saving[1]
        var errorMsg = React.useState(''); var setErrorMsg = errorMsg[1]

        var sessionIdRef = React.useRef(null)

        var resolveEffective = function (nsValue, hotValue) {
          if (hotValue && (hotValue.overrideTemperature || hotValue.overrideMaxTokens)) {
            return { mode: 'hot', overrideTemperature: hotValue.overrideTemperature, temperature: hotValue.temperature, overrideMaxTokens: hotValue.overrideMaxTokens, maxTokens: hotValue.maxTokens }
          }
          return { mode: nsValue.mode || 'persist', overrideTemperature: !!nsValue.overrideTemperature, temperature: nsValue.temperature != null ? nsValue.temperature : 1, overrideMaxTokens: !!nsValue.overrideMaxTokens, maxTokens: nsValue.maxTokens != null ? nsValue.maxTokens : 4096 }
        }

        var load = function () {
          var sid = extractCurrentSessionId()
          sessionIdRef.current = sid

          api.describe().then(function (res) {
            if (!res || !res.ok) {
              setStatus('error'); setErrorMsg(((res && res.error && res.error.message) || '加载失败')); setLoaded(true); return null
            }
            var ns = (res.value && res.value.namespaces || []).find(function (n) { return n.ns === 'sampling-sliders' })
            var nsValue = ns && ns.value ? ns.value : {}
            setRevision(ns && ns.revision || 0)
            return { nsValue: nsValue }
          }).then(function (intermediate) {
            if (!intermediate) return
            if (!sid) {
              var eff = resolveEffective(intermediate.nsValue, null)
              setSavedMode(eff.mode); setSavedTemperature(eff.temperature); setSavedMaxTokens(eff.maxTokens)
              setSavedOverrideTemp(eff.overrideTemperature); setSavedOverrideMax(eff.overrideMaxTokens)
              setMode(eff.mode); setTemperature(eff.temperature); setMaxTokens(eff.maxTokens)
              setOverrideTemp(eff.overrideTemperature); setOverrideMax(eff.overrideMaxTokens)
              setHasHotOverride(false); setStatus(''); setErrorMsg(''); setLoaded(true); return
            }
            return api.getHot(sid).then(function (hotRes) {
              var hotVal = (hotRes && hotRes.ok && hotRes.value) ? hotRes.value : null
              setHasHotOverride(!!hotVal)
              var eff = resolveEffective(intermediate.nsValue, hotVal)
              setSavedMode(eff.mode); setSavedTemperature(eff.temperature); setSavedMaxTokens(eff.maxTokens)
              setSavedOverrideTemp(eff.overrideTemperature); setSavedOverrideMax(eff.overrideMaxTokens)
              setMode(eff.mode); setTemperature(eff.temperature); setMaxTokens(eff.maxTokens)
              setOverrideTemp(eff.overrideTemperature); setOverrideMax(eff.overrideMaxTokens)
              setStatus(''); setErrorMsg(''); setLoaded(true)
            })
          }).catch(function (err) {
            setStatus('error'); setErrorMsg((err && err.message) || '加载异常'); setLoaded(true)
          })
        }

        React.useEffect(function () { load() }, [])

        // 订阅 hashchange —— 切换会话时自动重新加载
        React.useEffect(function () {
          var onHashChange = function () {
            var newSid = extractCurrentSessionId()
            if (newSid !== sessionIdRef.current) load()
          }
          window.addEventListener('hashchange', onHashChange)
          return function () { window.removeEventListener('hashchange', onHashChange) }
        }, [])

        var isDirty = (mode[0] !== savedMode) || (temperature[0] !== savedTemperature) || (maxTokens[0] !== savedMaxTokens) || (overrideTemp[0] !== savedOverrideTemp) || (overrideMax[0] !== savedOverrideMax)
        var hasActiveOverrides = (savedOverrideTemp && !isNaN(savedTemperature)) || (savedOverrideMax && !isNaN(savedMaxTokens))

        var handleSave = function () {
          if (saving[0]) return
          setSaving(true); setStatus(''); setErrorMsg('')

          var sid = sessionIdRef.current || extractCurrentSessionId()
          var hotValues = { overrideTemperature: overrideTemp[0], temperature: temperature[0], overrideMaxTokens: overrideMax[0], maxTokens: maxTokens[0] }

          if (mode[0] === 'hot') {
            if (!sid) { setStatus('error'); setErrorMsg('Hot 模式需要识别当前会话'); setSaving(false); return }
            api.setHot(sid, hotValues).then(function (res) {
              if (res && res.ok) {
                setSavedMode('hot'); setSavedTemperature(temperature[0]); setSavedMaxTokens(maxTokens[0])
                setSavedOverrideTemp(overrideTemp[0]); setSavedOverrideMax(overrideMax[0])
                setHasHotOverride(true)
                // 顺便把全局 settings 的 mode 复位为 persist
                return api.update({ mode: 'persist' }, revision[0])
              } else { throw new Error((res && res.error) || '保存 hot 失败') }
            }).then(function () { setStatus('saved'); setTimeout(function () { setStatus('') }, 1500) })
              .catch(function (err) { setStatus('error'); setErrorMsg((err && err.message) || '保存异常') })
              .finally(function () { setSaving(false) })
          } else {
            var persistPatch = { mode: 'persist', overrideTemperature: overrideTemp[0], temperature: temperature[0], overrideMaxTokens: overrideMax[0], maxTokens: maxTokens[0] }
            Promise.resolve()
              .then(function () { return sid ? api.clearHot(sid) : null })
              .then(function () { return api.update(persistPatch, revision[0]) })
              .then(function (res) {
                if (res && res.ok) {
                  var newRev = (res.value && res.value.revision) || revision[0]
                  setRevision(newRev); setSavedMode('persist'); setSavedTemperature(temperature[0]); setSavedMaxTokens(maxTokens[0])
                  setSavedOverrideTemp(overrideTemp[0]); setSavedOverrideMax(overrideMax[0])
                  setHasHotOverride(false); setStatus('saved'); setTimeout(function () { setStatus('') }, 1500)
                } else { setStatus('error'); setErrorMsg(((res && res.error && res.error.message) || '保存失败')) }
              })
              .catch(function (err) { setStatus('error'); setErrorMsg((err && err.message) || '保存异常') })
              .finally(function () { setSaving(false) })
          }
        }

        var handleCancel = function () {
          setMode(savedMode); setTemperature(savedTemperature); setMaxTokens(savedMaxTokens)
          setOverrideTemp(savedOverrideTemp); setOverrideMax(savedOverrideMax)
          setStatus(''); setErrorMsg(''); setOpen(false)
        }

        React.useEffect(function () {
          if (!open[0]) return
          var onKey = function (e) { if (e.key === 'Escape') handleCancel() }
          window.addEventListener('keydown', onKey)
          return function () { window.removeEventListener('keydown', onKey) }
        }, [open[0]])

        React.useEffect(function () {
          if (!open[0]) return
          var onDocClick = function (e) {
            var popup = document.getElementById('ss-popup')
            var trigger = document.getElementById('ss-trigger')
            if (popup && !popup.contains(e.target) && trigger && !trigger.contains(e.target)) handleCancel()
          }
          var id = setTimeout(function () { document.addEventListener('mousedown', onDocClick) }, 0)
          return function () { clearTimeout(id); document.removeEventListener('mousedown', onDocClick) }
        }, [open[0]])

        return React.createElement('div', { style: { position: 'relative', display: 'inline-block' }, onClick: function () { setOpen(!open[0]) } }, [
          React.createElement('button', {
            id: 'ss-trigger',
            className: 'ss-trigger' + (open[0] ? ' active' : '') + (hasActiveOverrides ? ' has-active' : ''),
            type: 'button', title: '采样参数（Temperature / MaxTokens）'
          }, [
            React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block' } }, [
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
            React.createElement('span', { className: 'ss-dot' })
          ]),

          open[0] && React.createElement('div', { id: 'ss-popup', onClick: function (e) { e.stopPropagation() } }, [
            React.createElement('div', { className: 'ss-header' }, [
              React.createElement('span', { className: 'ss-title' }, '采样参数'),
              React.createElement('span', { className: 'ss-close', role: 'button', title: '关闭（ESC）', onClick: function (e) { e.stopPropagation(); handleCancel() } }, '✕')
            ]),

            hasHotOverride[0] && React.createElement('div', { style: { fontSize: 11, color: '#e29b4a', background: 'rgba(226,155,74,0.12)', padding: '2px 6px', borderRadius: 4 } },
              '当前会话处于 Hot 模式：退出会话后自动清除'
            ),

            React.createElement('div', { className: 'ss-row' },
              React.createElement('label', {},
                React.createElement('input', { type: 'checkbox', checked: overrideTemp[0], onChange: function (e) { setOverrideTemp(e.target.checked) } }),
                React.createElement('span', { className: 'ss-label-tooltip' }, ['Temperature', React.createElement('span', { className: 'ss-tooltip' }, '控制生成文本的随机性。值越高输出越多样。')]),
                React.createElement('span', { className: 'ss-pill ' + (overrideTemp[0] ? 'on' : 'off') }, overrideTemp[0] ? 'on' : 'off')
              ),
              overrideTemp[0] && React.createElement('input', { type: 'range', min: 0, max: 2, step: 0.05, value: temperature[0], onChange: function (e) { setTemperature(parseFloat(e.target.value)) } }),
              overrideTemp[0] && React.createElement('div', { className: 'ss-value' }, temperature[0].toFixed(2))
            ),

            React.createElement('div', { className: 'ss-row' },
              React.createElement('label', {},
                React.createElement('input', { type: 'checkbox', checked: overrideMax[0], onChange: function (e) { setOverrideMax(e.target.checked) } }),
                React.createElement('span', { className: 'ss-label-tooltip' }, ['Max tokens', React.createElement('span', { className: 'ss-tooltip' }, '单次回复最多生成的 token 数上限。')]),
                React.createElement('span', { className: 'ss-pill ' + (overrideMax[0] ? 'on' : 'off') }, overrideMax[0] ? 'on' : 'off')
              ),
              overrideMax[0] && React.createElement('input', { type: 'range', min: 512, max: 256000, step: 1024, value: maxTokens[0], onChange: function (e) { setMaxTokens(parseInt(e.target.value, 10)) } }),
              overrideMax[0] && React.createElement('div', { className: 'ss-value' }, maxTokens[0].toLocaleString())
            ),

            React.createElement('div', { className: 'ss-row' },
              React.createElement('div', { className: 'ss-radio-row' },
                React.createElement('label', {},
                  React.createElement('input', { type: 'radio', name: 'ss-mode', checked: mode[0] === 'persist', onChange: function () { setMode('persist') } }),
                  React.createElement('span', { className: 'ss-label-tooltip' }, ['Persist', React.createElement('span', { className: 'ss-tooltip' }, '覆盖值保存到配置，后续所有会话持续生效。')])
                ),
                React.createElement('label', {},
                  React.createElement('input', { type: 'radio', name: 'ss-mode', checked: mode[0] === 'hot', onChange: function () { setMode('hot') } }),
                  React.createElement('span', { className: 'ss-label-tooltip' }, ['Hot', React.createElement('span', { className: 'ss-tooltip' }, '仅当前会话生效；切换会话或关闭后自动清除。')])
                )
              )
            ),

            React.createElement('div', { className: 'ss-status ' + status[0] },
              status[0] === 'saved' ? '✓ 已保存' : status[0] === 'error' ? ('✗ ' + errorMsg[0]) : ''
            ),

            React.createElement('div', { className: 'ss-footer' },
              React.createElement('button', { className: 'ss-btn primary', disabled: !isDirty || saving[0], onClick: handleSave, type: 'button' }, saving[0] ? '保存中…' : '保存'),
              React.createElement('button', { className: 'ss-btn cancel', disabled: saving[0], onClick: handleCancel, type: 'button' }, '取消')
            )
          ])
        ])
      }

      ctx.slots.inject('conversation.input.right', function () {
        return ctx.slots.register({ name: 'conversation.input.right', id: 'sampling-params', order: 0 }, function () {
          return React.createElement(SamplingSlidersWidget)
        })
      })
    }

    exports.inject = ['slots', 'remote', 'remote.settings']
    exports.apply = apply
    return module.exports
  }
})
