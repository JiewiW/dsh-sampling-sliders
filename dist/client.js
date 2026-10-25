window.__ModuleLoader__.load({
  id: "dsh-sampling-sliders",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const React = require("react");

    const inject = ["slots"];

    const CSS = `
      .dsp-anchor{position:relative;display:inline-flex;align-items:center}
      .dsp-trigger{border:1px solid var(--dsw-alias-border-l2);height:32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);cursor:pointer;background:transparent;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:6px 12px;font-size:13px;font-weight:400;line-height:20px;display:inline-flex;white-space:nowrap}
      .dsp-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
      .dsp-trigger.has-override{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
      .dsp-trigger span,.dsp-trigger svg{flex:none}
      .dsp-backdrop{position:fixed;inset:0;z-index:9990;background:transparent}
      .dsp-pop{position:absolute;bottom:calc(100% + 10px);right:0;z-index:9991;width:300px;max-width:calc(100vw - 24px);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px;color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.5;box-shadow:0 10px 34px rgba(0,0,0,.3)}
      .dsp-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .dsp-pop-head-left{display:flex;align-items:center;gap:6px;min-width:0}
      .dsp-pop-title{font-size:13px;font-weight:600;line-height:20px}
      .dsp-help{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:1px solid var(--dsw-alias-border-l2);border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1;cursor:pointer;flex:none;padding:0}
      .dsp-help:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsp-help-text{font-size:11px;line-height:1.7;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;white-space:pre-line}
      .dsp-mode{display:inline-flex;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;overflow:hidden;flex:none}
      .dsp-mode button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:3px 10px;cursor:pointer;font-size:11px;line-height:18px}
      .dsp-mode button.on{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:500}
      .dsp-divider{border-top:1px solid var(--dsw-alias-border-l1)}
      .dsp-param{display:flex;flex-direction:column;gap:4px}
      .dsp-param-head{display:flex;align-items:center;gap:8px}
      .dsp-label{font-weight:500}
      .dsp-val{margin-left:auto;opacity:.75;font-variant-numeric:tabular-nums;font-size:11px}
      .dsp-check{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dsp-check input{accent-color:var(--dsw-alias-brand-primary);width:13px;height:13px;margin:0;cursor:pointer}
      .dsp-slider{-webkit-appearance:none;appearance:none;width:100%;height:16px;margin:0;padding:0;background:transparent;cursor:pointer}
      .dsp-slider::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:var(--dsw-alias-border-l2)}
      .dsp-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-brand-primary);border:none;margin-top:-5px;cursor:pointer}
      .dsp-slider::-moz-range-track{height:4px;border-radius:2px;background:var(--dsw-alias-border-l2)}
      .dsp-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-brand-primary);border:none;cursor:pointer}
      .dsp-slider:disabled{opacity:.4;cursor:default}
      .dsp-actions{display:flex;gap:8px}
      .dsp-actions button{flex:1;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px}
      .dsp-actions button:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsp-actions button.primary{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
      .dsp-status{min-height:16px;font-size:11px;opacity:.8;white-space:pre-wrap;word-break:break-all;color:var(--dsw-alias-label-secondary)}
      .dsp-effective{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:11px;line-height:1.6}
      .dsp-eff-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:500}
      .dsp-eff-badge{font-size:10px;line-height:16px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);white-space:nowrap}
      .dsp-eff-badge.hot{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
      .dsp-eff-row{display:flex;align-items:baseline;gap:6px}
      .dsp-eff-key{color:var(--dsw-alias-label-secondary);min-width:84px;flex:none}
      .dsp-eff-val{font-variant-numeric:tabular-nums}
      .dsp-eff-src{opacity:.6;font-size:10px}
      .dsp-eff-sid{font-size:10px;opacity:.55;word-break:break-all;line-height:1.5}
    `;

    function TuneIcon() {
      return React.createElement('svg', { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', 'aria-hidden': true },
        React.createElement('line', { x1: 1.5, y1: 2.5, x2: 10.5, y2: 2.5, stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        React.createElement('circle', { cx: 7.5, cy: 2.5, r: 1.6, fill: 'currentColor' }),
        React.createElement('line', { x1: 1.5, y1: 6, x2: 10.5, y2: 6, stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        React.createElement('circle', { cx: 4, cy: 6, r: 1.6, fill: 'currentColor' }),
        React.createElement('line', { x1: 1.5, y1: 9.5, x2: 10.5, y2: 9.5, stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        React.createElement('circle', { cx: 8, cy: 9.5, r: 1.6, fill: 'currentColor' })
      );
    }

    function rpcId() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    }
    function settingsRpc(endpoint, args) {
      const id = rpcId();
      return fetch('/api/' + endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId: id, method: endpoint, payload: { args: args } })
      }).then((r) => r.json()).then((full) => {
        if (full && full.rpcId !== id) throw new Error('rpcId mismatch for ' + endpoint);
        return full ? full.result : null;
      });
    }

    // Per-session hot HTTP routes on the host side
    const HOT_PREFIX = '/api/plugin/sampling-sliders/hot';
    const SESSION_ROUTE = '/api/plugin/sampling-sliders/currentSession';
    function hotGet(sessionId) {
      return fetch(HOT_PREFIX + '/' + encodeURIComponent(sessionId)).then((r) => r.json());
    }
    function hotSet(sessionId, body) {
      return fetch(HOT_PREFIX + '/' + encodeURIComponent(sessionId), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json());
    }
    function hotClear(sessionId) {
      return fetch(HOT_PREFIX + '/' + encodeURIComponent(sessionId), { method: 'DELETE' }).then((r) => r.json());
    }
    function fetchHostSessionId() {
      return fetch(SESSION_ROUTE).then((r) => r.json()).then((res) => (res && res.ok && res.sessionId) ? res.sessionId : '').catch(() => '');
    }

    // 同步兜底链（client 端立即能拿到的）。异步 fetchHostSessionId 由 Panel 轮询定时刷新。
    function getCurrentSessionIdSync(ctx) {
      // 0. 宿主侧边栏当前选中会话行（前端活动会话，最准；比 host recentSessionId 更实时）
      try {
        const sel = document.querySelector('[role="treeitem"][aria-selected="true"][data-row-key^="session:"]');
        if (sel) {
          const key = sel.getAttribute('data-row-key') || '';
          const m = key.match(/^session:(.+)$/);
          if (m && m[1]) return m[1];
        }
      } catch {}
      // 1. 宿主 slot 注入时的 props
      if (ctx && ctx.sessionId) return String(ctx.sessionId);
      if (ctx && ctx.snapshot && ctx.snapshot.sessionId) return String(ctx.snapshot.sessionId);
      // 2. DOM data 属性
      try {
        const root = document.querySelector('[data-dsh-session-id]');
        if (root) return root.getAttribute('data-dsh-session-id') || '';
      } catch {}
      try {
        const body = document.body;
        if (body && body.dataset && body.dataset.dshSessionId) return body.dataset.dshSessionId;
      } catch {}
      // 3. window 全局
      try {
        if (typeof window !== 'undefined' && window.__DSH_SESSION_ID__) return String(window.__DSH_SESSION_ID__);
      } catch {}
      return '';
    }

    function Panel(props) {
      const [open, setOpen] = React.useState(false);
      const [mode, setMode] = React.useState('persist');
      const [temperature, setTemperature] = React.useState(1.0);
      const [overrideTemp, setOverrideTemp] = React.useState(false);
      const [maxTokens, setMaxTokens] = React.useState(4096);
      const [overrideMax, setOverrideMax] = React.useState(false);
      const [revision, setRevision] = React.useState(0);
      const [status, setStatus] = React.useState('');
      const [loaded, setLoaded] = React.useState(false);
      const [showHelp, setShowHelp] = React.useState(false);
      const [currentSessionId, setCurrentSessionId] = React.useState(() => getCurrentSessionIdSync(props));
      // 生效配置快照：load() 读到的真实数据（热调值 + 全局持久化值），供底部信息块展示，
      // 不随 mode 选项卡被 recentSessionId 串会话误导而丢失
      const [effHot, setEffHot] = React.useState(null);
      const [effGlobal, setEffGlobal] = React.useState(null);
      // sid 镜像 ref：load() 读取已提交的 sid，禁止在 load 内反向覆写轮询结果
      const sidRef = React.useRef(currentSessionId);
      sidRef.current = currentSessionId;
      // dirty 标记：用户在面板内编辑（未应用）期间，禁止 load() 重跑覆盖其输入
      const dirtyRef = React.useRef(false);
      const markDirty = () => { dirtyRef.current = true; };

      // 轮询：同步兜底链 + host 端 currentSession 路由刷新 sessionId
      React.useEffect(() => {
        let cancelled = false;
        const refresh = () => {
          // 前端活动会话（侧边栏选中行）优先；它最准且切换立即反映。
          // 同步来源有值时，不用 host recentSessionId 覆盖（后者是"最近发消息的会话"，可能滞后）。
          const syncSid = getCurrentSessionIdSync(props);
          if (syncSid) {
            if (!cancelled) setCurrentSessionId((prev) => (prev === syncSid ? prev : syncSid));
            return;
          }
          fetchHostSessionId().then((asyncSid) => {
            if (cancelled || !asyncSid) return;
            setCurrentSessionId((prev) => (prev === asyncSid ? prev : asyncSid));
          }).catch(() => {});
        };
        refresh();
        const t = setInterval(refresh, 1500);
        return () => { cancelled = true; clearInterval(t); };
      }, []);

      // load 函数：hot 模式先读 per-session，persist 模式读全局 settings
      const load = React.useCallback(() => {
        setLoaded(false);
        const sid = sidRef.current;

        const describeP = settingsRpc('settings/describe', {});
        const hotP = sid ? hotGet(sid) : Promise.resolve({ ok: true, value: null });

        Promise.all([describeP, hotP]).then(([res, hotRes]) => {
          // 全局持久化参数（所有会话共享的基线）
          let gv = {};
          let rev = 0;
          if (res && res.ok) {
            const ns = (res.value.namespaces || []).find((n) => n.ns === 'sampling-sliders');
            if (ns) { gv = ns.value || {}; rev = ns.revision; }
          }
          // 本会话是否有 hot 覆盖 → 决定 mode
          const hot = (hotRes && hotRes.ok) ? hotRes.value : null;
          // 快照给底部信息块（不随 mode 选项卡被误导）
          setEffHot(hot);
          setEffGlobal(gv);
          // 用户正在编辑（未应用）时不覆盖其输入值，只更新 mode/revision
          const dirty = dirtyRef.current;
          if (sid && hot) {
            // 该会话处于热调：值取本会话的 hot 覆盖
            setMode('hot');
            if (!dirty) {
              setOverrideTemp(!!hot.overrideTemperature);
              setTemperature(typeof hot.temperature === 'number' ? hot.temperature : 1.0);
              setOverrideMax(!!hot.overrideMaxTokens);
              setMaxTokens(typeof hot.maxTokens === 'number' ? hot.maxTokens : 4096);
            }
          } else {
            // 无本会话覆盖（含切到新会话）→ 回到持久化基线
            setMode('persist');
            if (!dirty) {
              // 覆盖开关由 host 的 override* 字段决定，不能用 temperature/maxTokens 是否存在判断
              // （默认值 1 / 4096 恒存在，会导致 UI 误显示“覆盖开启 + 默认值”）
              setOverrideTemp(!!gv.overrideTemperature);
              if (typeof gv.temperature === 'number') { setTemperature(gv.temperature); }
              setOverrideMax(!!gv.overrideMaxTokens);
              if (typeof gv.maxTokens === 'number') { setMaxTokens(gv.maxTokens); }
            }
          }
          setRevision(rev);
          setLoaded(true);
        }).catch(() => setLoaded(true));
      }, []);

      // 仅在会话切换（sid 变化）或挂载时重新加载；load 引用稳定，不会每帧重跑
      React.useEffect(() => { load(); }, [currentSessionId, load]);

      const apply = () => {
        const sid = sidRef.current;
        setStatus('保存中…');

        if (mode === 'hot') {
          // hot 模式：只写 per-session 内存 Map，不写全局持久化 mode
          if (!sid) {
            setStatus('失败：无法获取当前会话 ID');
            return;
          }
          const body = {
            overrideTemperature: overrideTemp,
            temperature: temperature,
            overrideMaxTokens: overrideMax,
            maxTokens: maxTokens,
          };
          hotSet(sid, body).then((res) => {
            if (res && res.ok) {
              // 同时把 mode='hot' 也写入 settings（下次打开面板知道上次用的是 hot）
              settingsRpc('settings/mutate', {
                ns: 'sampling-sliders',
                ops: [{ op: 'set', path: ['mode'], value: 'hot' }],
              }).catch(() => {}); // 失败不影响 hot 生效
              dirtyRef.current = false;
              // 快照同步：本次应用后，当前会话 hot 生效
              setEffHot({ overrideTemperature: overrideTemp, temperature: temperature, overrideMaxTokens: overrideMax, maxTokens: maxTokens });
              setStatus('已热调 ✓ 仅本会话生效，换会话自动恢复持久化');
            } else {
              setStatus('失败：' + (res && res.error ? res.error : '未知错误'));
            }
          }).catch((e) => setStatus('失败：' + String((e && e.message) || e)));
          return;
        }

        // persist 模式：走 settings.mutate 写全局配置
        const ops = [{ op: 'set', path: ['mode'], value: 'persist' }];
        if (overrideTemp) { ops.push({ op: 'set', path: ['overrideTemperature'], value: true }); ops.push({ op: 'set', path: ['temperature'], value: temperature }); }
        else { ops.push({ op: 'unset', path: ['overrideTemperature'] }); ops.push({ op: 'unset', path: ['temperature'] }); }
        if (overrideMax) { ops.push({ op: 'set', path: ['overrideMaxTokens'], value: true }); ops.push({ op: 'set', path: ['maxTokens'], value: maxTokens }); }
        else { ops.push({ op: 'unset', path: ['overrideMaxTokens'] }); ops.push({ op: 'unset', path: ['maxTokens'] }); }

        // 如果当前会话有残留 hot 覆盖，先清掉再写全局，保证顺序（hot 优先于全局，竞态会导致旧 hot 被先应用）
        const doMutate = () => settingsRpc('settings/mutate', { ns: 'sampling-sliders', ops: ops });
        const clearAndMutate = sid
          ? hotClear(sid).catch(() => null).then(() => doMutate())
          : doMutate();

        clearAndMutate.then((res) => {
          if (res && res.ok) {
            setRevision(res.value.revision);
            // 快照同步：本次应用后，当前会话 hot 已被清空、全局生效 persist 值
            setEffHot(null);
            setEffGlobal({ overrideTemperature: overrideTemp, temperature: temperature, overrideMaxTokens: overrideMax, maxTokens: maxTokens, mode: 'persist' });
            dirtyRef.current = false;
            setStatus('已持久化 ✓ 长期生效');
          } else {
            setStatus('失败：' + (res && res.error ? res.error.message : '未知错误'));
          }
        }).catch((e) => setStatus('失败：' + String((e && e.message) || e)));
      };

      const reset = () => {
        const sid = sidRef.current;
        setStatus('重置中…');

        // 同时清当前会话的 hot 覆盖 + 全局 settings
        const doSettings = () => {
          const ops = [
            { op: 'unset', path: ['overrideTemperature'] },
            { op: 'unset', path: ['temperature'] },
            { op: 'unset', path: ['overrideMaxTokens'] },
            { op: 'unset', path: ['maxTokens'] },
            { op: 'set', path: ['mode'], value: 'persist' }
          ];
          return settingsRpc('settings/mutate', { ns: 'sampling-sliders', ops: ops });
        };
        const doHot = sid ? hotClear(sid).catch(() => null) : Promise.resolve(null);

        Promise.all([doSettings(), doHot]).then(([settingsRes]) => {
          if (settingsRes && settingsRes.ok) {
            setRevision(settingsRes.value.revision);
            setMode('persist');
            setOverrideTemp(false);
            setOverrideMax(false);
            setTemperature(1.0);
            setMaxTokens(4096);
            dirtyRef.current = false;
            // 快照同步：重置后，当前会话 hot 已清空、全局回到模型默认
            setEffHot(null);
            setEffGlobal({ mode: 'persist' });
            setStatus('已恢复默认（跟随模型默认值）');
          } else {
            setStatus('失败：' + (settingsRes && settingsRes.error ? settingsRes.error.message : '未知错误'));
          }
        }).catch((e) => setStatus('失败：' + String((e && e.message) || e)));
      };

      const fmt = (n) => Number(n).toFixed(2);
      const fmtMax = (n) => Number(n).toLocaleString();
      const anyOverride = overrideTemp || overrideMax;

      return React.createElement('div', { className: 'dsp-anchor' },
        React.createElement('button', {
          className: 'dsp-trigger' + (anyOverride ? ' has-override' : ''),
          title: mode === 'hot'
            ? '模型采样参数（热调 · 仅本会话）'
            : '模型采样参数（持久化）',
          onClick: () => setOpen((v) => !v),
        },
          React.createElement('span', null, '采样'),
          React.createElement(TuneIcon, null)
        ),
        open ? React.createElement('div', { className: 'dsp-backdrop', onClick: () => setOpen(false) }) : null,
        open ? React.createElement('div', { className: 'dsp-pop' },
          React.createElement('div', { className: 'dsp-pop-head' },
            React.createElement('div', { className: 'dsp-pop-head-left' },
              React.createElement('span', { className: 'dsp-pop-title' }, '模型采样参数'),
              React.createElement('button', { className: 'dsp-help', title: '温度 / 最大输出说明', onClick: () => setShowHelp((v) => !v) }, '?')
            ),
            React.createElement('div', { className: 'dsp-mode' },
              React.createElement('button', { className: mode === 'hot' ? 'on' : '', onClick: () => setMode('hot') }, '热调'),
              React.createElement('button', { className: mode === 'persist' ? 'on' : '', onClick: () => setMode('persist') }, '持久化')
            )
          ),
          showHelp ? React.createElement('div', { className: 'dsp-help-text' },
            '温度（temperature，0–2）：控制输出随机性/创造性。\n' +
            '· 0 = 最确定保守（贪心）\n' +
            '· 0–0.3：编码 / 事实性任务\n' +
            '· 0.7–1.0：对话 / 创意写作\n' +
            '· 1–2：高随机、高发散\n' +
            '· 不勾选「覆盖」= 跟随模型默认。\n\n' +
            '最大输出（maxTokens）：单次回答最多生成的 token 数，不是上下文长度。\n\n' +
            '模式说明：\n' +
            '· 热调：仅当前会话生效，换会话自动恢复持久化设置\n' +
            '· 持久化：写入全局配置，所有会话共享'
          ) : null,
          React.createElement('div', { className: 'dsp-divider' }),
          React.createElement('div', { className: 'dsp-param' },
            React.createElement('div', { className: 'dsp-param-head' },
              React.createElement('span', { className: 'dsp-label' }, 'temperature'),
              React.createElement('label', { className: 'dsp-check' },
                React.createElement('input', { type: 'checkbox', checked: overrideTemp, onChange: (e) => { markDirty(); setOverrideTemp(e.target.checked); } }),
                React.createElement('span', null, '覆盖')
              ),
              React.createElement('span', { className: 'dsp-val' }, overrideTemp ? fmt(temperature) : '默认')
            ),
            React.createElement('input', {
              type: 'range', className: 'dsp-slider', min: '0', max: '2', step: '0.05',
              value: overrideTemp ? temperature : 1.0, disabled: !overrideTemp,
              onChange: (e) => { markDirty(); setTemperature(Number(e.target.value)); },
            })
          ),
          React.createElement('div', { className: 'dsp-param' },
            React.createElement('div', { className: 'dsp-param-head' },
              React.createElement('span', { className: 'dsp-label' }, 'maxTokens'),
              React.createElement('label', { className: 'dsp-check' },
                React.createElement('input', { type: 'checkbox', checked: overrideMax, onChange: (e) => { markDirty(); setOverrideMax(e.target.checked); } }),
                React.createElement('span', null, '覆盖')
              ),
              React.createElement('span', { className: 'dsp-val' }, overrideMax ? fmtMax(maxTokens) : '默认')
            ),
            React.createElement('input', {
              type: 'range', className: 'dsp-slider', min: '512', max: '256000', step: '512',
              value: overrideMax ? maxTokens : 4096, disabled: !overrideMax,
              onChange: (e) => { markDirty(); setMaxTokens(Number(e.target.value)); },
            })
          ),
          React.createElement('div', { className: 'dsp-actions' },
            React.createElement('button', { className: 'primary', onClick: apply }, '应用'),
            React.createElement('button', { onClick: reset }, '恢复默认')
          ),
          // 生效配置信息块：真实数据（不随 mode 选项卡被串会话误导），明确告知用户当前窗口实际生效的设置
          (() => {
            const hot = effHot;
            const g = effGlobal || {};
            const effMode = (hot && (hot.overrideTemperature || hot.overrideMaxTokens)) ? 'hot' : 'persist';
            const showGlobal = !!g && (g.overrideTemperature || g.overrideMaxTokens);
            const srcLabel = effMode === 'hot' ? '热调 · 仅本会话' : '持久化 · 全局共享';
            const tempSrc = effMode === 'hot' ? (hot.overrideTemperature ? '热调' : '模型默认') : (g.overrideTemperature ? '持久化' : '模型默认');
            const maxSrc = effMode === 'hot' ? (hot.overrideMaxTokens ? '热调' : '模型默认') : (g.overrideMaxTokens ? '持久化' : '模型默认');
            const tempVal = effMode === 'hot'
              ? (hot.overrideTemperature ? Number(hot.temperature).toFixed(2) : '—')
              : (g.overrideTemperature ? Number(g.temperature).toFixed(2) : '—');
            const maxVal = effMode === 'hot'
              ? (hot.overrideMaxTokens ? Number(hot.maxTokens).toLocaleString() : '—')
              : (g.overrideMaxTokens ? Number(g.maxTokens).toLocaleString() : '—');
            return React.createElement('div', { className: 'dsp-effective' },
              React.createElement('div', { className: 'dsp-eff-head' },
                React.createElement('span', null, '当前生效设置'),
                React.createElement('span', { className: 'dsp-eff-badge' + (effMode === 'hot' ? ' hot' : '') },
                  effMode === 'hot' ? '热调' : '持久化')
              ),
              React.createElement('div', { className: 'dsp-eff-row' },
                React.createElement('span', { className: 'dsp-eff-key' }, '会话'),
                React.createElement('span', { className: 'dsp-eff-val' }, currentSessionId || '（未检测到）')
              ),
              React.createElement('div', { className: 'dsp-eff-row' },
                React.createElement('span', { className: 'dsp-eff-key' }, 'temperature'),
                React.createElement('span', { className: 'dsp-eff-val' }, tempVal),
                React.createElement('span', { className: 'dsp-eff-src' }, tempSrc)
              ),
              React.createElement('div', { className: 'dsp-eff-row' },
                React.createElement('span', { className: 'dsp-eff-key' }, 'maxTokens'),
                React.createElement('span', { className: 'dsp-eff-val' }, maxVal),
                React.createElement('span', { className: 'dsp-eff-src' }, maxSrc)
              ),
              React.createElement('div', { className: 'dsp-eff-row' },
                React.createElement('span', { className: 'dsp-eff-key' }, '来源'),
                React.createElement('span', { className: 'dsp-eff-val' }, srcLabel)
              )
            );
          })(),
          React.createElement('div', { className: 'dsp-status' },
            loaded ? (status || (
              mode === 'hot'
                ? (currentSessionId
                    ? '热调模式：仅本会话（' + currentSessionId + '）生效，换会话自动恢复持久化设置。'
                    : '热调模式：未检测到会话 ID，请先选择一个会话。')
                : '持久化模式：写入全局配置，所有会话共享。'
            )) : '读取状态中…'
          )
        ) : null
      );
    }

    function apply(ctx) {
      const tagId = 'dsh-sampling-sliders/styles';
      if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin-css="' + tagId + '"]')) {
        const tag = document.createElement('style');
        tag.setAttribute('data-plugin-css', tagId);
        tag.textContent = CSS;
        document.head.appendChild(tag);
      }

      if (typeof ctx.inject !== 'function') return;

      ctx.inject(['slots'], function (scope) {
        scope.slots.inject('conversation.input.right', function (slotCtx) {
          return scope.slots.register(
            { name: 'conversation.input.right', id: 'sampling-params', order: 0 },
            function () {
              // 把 slotCtx 透传给 Panel，让它能拿到 sessionId
              return React.createElement(Panel, slotCtx || {});
            },
          );
        });
      });
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  }
});
