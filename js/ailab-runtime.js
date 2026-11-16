/* AI Lab · motor ligero para las secciones interactivas (test de madurez, calculadora, luz del cursor).
   Lee la plantilla de <template id="ailab-tpl">, calcula los valores con la clase Component
   y actualiza solo lo que cambia, sin recargar la página. */
(function () {
  'use strict';

  class DCLogic {
    constructor() { this.props = {}; this.state = undefined; this._pending = false; }
    setState(patch) {
      const prev = this.state || {};
      const next = typeof patch === 'function' ? patch(prev) : patch;
      this.state = Object.assign({}, prev, next);
      this._schedule();
    }
    forceUpdate() { this._schedule(); }
    _schedule() {
      if (this._pending || !this._render) return;
      this._pending = true;
      const run = () => { this._pending = false; this._render(); };
      if (typeof window !== 'undefined' && window.requestAnimationFrame) window.requestAnimationFrame(run);
      else setTimeout(run, 16);
    }
  }

  const WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;
  const ANY = /\{\{([^}]+)\}\}/g;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const branchIds = new WeakMap();
  let branchSeq = 0;

  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    const parts = path.split('.');
    for (let i = scopes.length - 1; i >= 0; i--) {
      const sc = scopes[i];
      if (sc && Object.prototype.hasOwnProperty.call(sc, parts[0])) {
        let v = sc[parts[0]];
        for (let k = 1; k < parts.length; k++) v = v == null ? undefined : v[parts[k]];
        return v;
      }
    }
    return undefined;
  }
  function interp(str, scopes) {
    return str.replace(ANY, (m, p) => { const v = lookup(p, scopes); return v == null ? '' : String(v); });
  }
  function bare(attr) { return (attr || '').replace(/[{}]/g, ''); }

  function renderNodes(nodes, scopes, out, ctx, branch) {
    for (const n of Array.from(nodes)) renderNode(n, scopes, out, ctx, branch);
  }
  function renderNode(n, scopes, out, ctx, branch) {
    const doc = ctx.doc;
    if (n.nodeType === 3) {
      out.push(doc.createTextNode(n.nodeValue.indexOf('{{') >= 0 ? interp(n.nodeValue, scopes) : n.nodeValue));
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.localName;
    if (tag === 'sc-for') {
      const list = lookup(bare(n.getAttribute('list')), scopes) || [];
      const as = n.getAttribute('as') || 'item';
      list.forEach((item, i) => { const sc = { $index: i }; sc[as] = item; renderNodes(n.childNodes, scopes.concat([sc]), out, ctx, null); });
      return;
    }
    if (tag === 'sc-if') {
      if (!branchIds.has(n)) branchIds.set(n, 'b' + (++branchSeq));
      if (lookup(bare(n.getAttribute('value')), scopes)) renderNodes(n.childNodes, scopes, out, ctx, branchIds.get(n));
      return;
    }
    const el = n.namespaceURI === SVG_NS ? doc.createElementNS(SVG_NS, n.localName) : doc.createElement(n.localName);
    for (const a of Array.from(n.attributes)) {
      const name = a.name, val = a.value;
      if (name.indexOf('hint-') === 0) continue;
      const isEvent = /^on[a-z]+$/.test(name);
      const whole = val.match(WHOLE);
      if (whole) {
        const v = lookup(whole[1], scopes);
        if (isEvent) {
          if (typeof v === 'function') { el.setAttribute('data-ai-' + name, String(ctx.handlers.length)); ctx.handlers.push(v); }
          continue;
        }
        if (v === false || v == null) continue;
        el.setAttribute(name, v === true ? '' : String(v));
        continue;
      }
      if (isEvent) continue;
      el.setAttribute(name, val.indexOf('{{') >= 0 ? interp(val, scopes) : val);
    }
    if (branch) el.setAttribute('data-ai-branch', branch);
    const kids = [];
    renderNodes(n.childNodes, scopes, kids, ctx, null);
    for (const k of kids) el.appendChild(k);
    out.push(el);
  }

  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName ||
        (a.nodeType === 1 && a.getAttribute('data-ai-branch') !== b.getAttribute('data-ai-branch'))) {
      a.parentNode.replaceChild(b, a);
      return;
    }
    if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (a.nodeType !== 1) return;
    for (const at of Array.from(a.attributes)) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    if (a.localName === 'input') {
      const v = b.getAttribute('value');
      const focused = a.ownerDocument.activeElement === a;
      if (v != null && a.value !== v && (!focused || a.type === 'range')) a.value = v;
    }
    morphChildren(a, b);
  }
  function morphChildren(a, b) {
    const an = Array.from(a.childNodes), bn = Array.from(b.childNodes);
    for (let i = 0; i < bn.length; i++) { if (i < an.length) morph(an[i], bn[i]); else a.appendChild(bn[i]); }
    for (let i = bn.length; i < an.length; i++) a.removeChild(an[i]);
  }

  function mount(root, tpl, Component, opts) {
    const doc = root.ownerDocument;
    const comp = new Component();
    let handlers = [];
    comp._render = function () {
      const ctx = { doc, handlers: [] };
      const vals = comp.renderVals ? (comp.renderVals() || {}) : {};
      const out = [];
      renderNodes(tpl.content.childNodes, [vals], out, ctx, null);
      const tmp = doc.createElement('div');
      for (const n of out) tmp.appendChild(n);
      morphChildren(root, tmp);
      handlers = ctx.handlers;
    };
    comp._render();
    if (opts && opts.static) return comp;

    const fire = (attr, e, el) => {
      const id = el.getAttribute(attr);
      const h = handlers[+id];
      if (typeof h === 'function') h({
        nativeEvent: e, target: e.target, currentTarget: el, type: e.type,
        clientX: e.clientX, clientY: e.clientY, key: e.key,
        preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation()
      });
    };
    ['click', 'input', 'change', 'mousemove', 'keydown'].forEach((type) => {
      root.addEventListener(type, (e) => {
        const attr = 'data-ai-on' + type;
        let el = e.target;
        while (el && el !== root.parentNode) {
          if (el.nodeType === 1 && el.hasAttribute(attr)) { fire(attr, e, el); break; }
          el = el.parentNode;
        }
      });
    });
    root.addEventListener('mouseout', (e) => {
      let el = e.target;
      while (el && el !== root.parentNode) {
        if (el.nodeType === 1 && el.hasAttribute('data-ai-onmouseleave')) {
          if (!e.relatedTarget || !el.contains(e.relatedTarget)) fire('data-ai-onmouseleave', e, el);
          break;
        }
        el = el.parentNode;
      }
    });
    return comp;
  }

  const api = { DCLogic, mount };
  if (typeof window !== 'undefined') {
    window.DCLogic = DCLogic;
    window.AILab = api;
    const boot = () => {
      const root = document.getElementById('ailab-root');
      const tpl = document.getElementById('ailab-tpl');
      const src = document.getElementById('ailab-logic');
      if (!root || !tpl || !src) return;
      const Component = new Function('DCLogic', src.textContent + '\nreturn Component;')(DCLogic);
      mount(root, tpl, Component);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
  if (typeof module !== 'undefined') module.exports = api;
})();
