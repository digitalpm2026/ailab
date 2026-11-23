/* AI Lab · suscripción al newsletter con Brevo.
   Conecta los campos de correo de la portada (primera pantalla, bloque final
   y resultado del test) al formulario de Brevo "AI Lab · Suscripción
   newsletter", sin cambiar su diseño.
   - Escucha los botones con href="#suscribirse" y la tecla Enter en el campo.
   - Valida el correo aquí: Brevo responde "success" incluso con correos mal
     escritos, así que la validación del sitio es la que cuenta.
   - Si todo sale bien, abre una ventana "¡Ya está registrado!"; los errores
     se muestran en un aviso flotante. No inserta nodos dentro de la
     página, porque esa parte la redibuja ailab-runtime.js. */
(function () {
  'use strict';

  var BREVO_URL = 'https://50977c7d.sibforms.com/serve/MUIFAGtUE3L0bsYtsNLyg7iV1TU-JRjlVYSp2HMPvZgecA9kfIq7hv6lezKyI47Ho_4knZKUPeYLCxK3JRyDTiEYAh9MW7uefXENR32TfbLfJH8_uPA2cu9DI3eZiPRb7PGCLsUGfiSWJIO56siI2GP1x_xEcoAFVki_cNZ3jI0-hfVNhzGugYu5gdZxeai5MCG8OTIA34V_Jl_D';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var sending = false;

  var MSG = {
    empty: 'Escriba su correo de trabajo para suscribirse.',
    invalid: 'Revise su correo: parece que falta algo (ejemplo: nombre@empresa.com).',
    sending: 'Enviando…',
    error: 'No pudimos completar su suscripción. Intente de nuevo en unos minutos o escríbanos a hola@pra2media.com.'
  };

  // Aviso flotante (fuera del contenido que redibuja el runtime)
  var toast = null, hideTimer = null;
  function show(text, kind) {
    if (!toast) {
      toast = document.createElement('div');
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;' +
        'box-sizing:border-box;width:max-content;max-width:calc(100vw - 32px);padding:14px 20px;border-radius:16px;' +
        'background:#12050A;border:1px solid #3D0019;box-shadow:0 18px 40px -12px rgba(0,0,0,0.8);' +
        "font-family:'Poppins',Arial,sans-serif;font-size:15px;line-height:1.45;color:#FFFFFF;" +
        'transition:opacity .25s ease;opacity:0';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.borderColor = kind === 'ok' ? '#FF005E' : kind === 'error' ? '#FF4D8D' : '#3D0019';
    toast.style.boxShadow = kind === 'ok' ? '0 0 28px rgba(255,0,94,0.45)' : '0 18px 40px -12px rgba(0,0,0,0.8)';
    toast.style.opacity = '1';
    clearTimeout(hideTimer);
    if (kind !== 'sending') hideTimer = setTimeout(function () { toast.style.opacity = '0'; }, kind === 'ok' ? 7000 : 6000);
  }

  // Ventana emergente de registro exitoso (con la gráfica de AI Lab)
  var modal = null, lastFocus = null;
  function closeSuccess() {
    if (!modal) return;
    modal.style.opacity = '0';
    var m = modal; modal = null;
    document.removeEventListener('keydown', onModalKey, true);
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onModalKey(e) {
    if (!modal) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSuccess(); }
    if (e.key === 'Tab') { e.preventDefault(); modal.querySelector('button').focus(); } // un solo botón: el foco se queda en él
  }
  function openSuccess(input) {
    if (modal) return;
    lastFocus = input;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;' +
      'background:rgba(0,0,0,0.78);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .2s ease';
    modal.innerHTML =
      '<div role="dialog" aria-modal="true" aria-labelledby="ailab-ok-title" aria-describedby="ailab-ok-text" style="' +
        'box-sizing:border-box;width:100%;max-width:440px;padding:36px 30px 30px;border-radius:24px;text-align:center;' +
        'background:#12050A;border:1px solid #FF005E;box-shadow:0 0 60px -10px rgba(255,0,94,0.55);color:#FFFFFF;' +
        (reduce ? '' : 'transform:translateY(12px) scale(.97);transition:transform .28s cubic-bezier(.2,.8,.2,1);') + '">' +
        '<div aria-hidden="true" style="width:64px;height:64px;margin:0 auto;border-radius:50%;background:#FF005E;' +
          'box-shadow:0 0 30px rgba(255,0,94,0.7);display:flex;align-items:center;justify-content:center">' +
          '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
        '</div>' +
        '<p style="margin:22px 0 0;font-family:\'Fragment Mono\',Menlo,Consolas,monospace;font-size:13px;color:#FF005E">AI Lab · Newsletter</p>' +
        '<h2 id="ailab-ok-title" style="margin:8px 0 0;font-family:\'Fragment Mono\',Menlo,Consolas,monospace;font-weight:400;' +
          'font-size:26px;line-height:1.2;letter-spacing:-0.015em;color:#FFFFFF">¡Ya está registrado!</h2>' +
        '<p id="ailab-ok-text" style="margin:12px 0 0;font-family:\'Poppins\',Arial,sans-serif;font-size:16px;line-height:1.55;color:#C8C3B4">' +
          'Revise su correo de confirmación. Si no lo ve en unos minutos, busque en spam o promociones.</p>' +
        '<button type="button" style="margin-top:26px;min-height:50px;padding:0 34px;border:0;border-radius:999px;cursor:pointer;' +
          'background:#FF005E;box-shadow:0 0 24px rgba(255,0,94,0.45);color:#FFFFFF;font-family:\'Poppins\',Arial,sans-serif;' +
          'font-weight:500;font-size:16px">Entendido</button>' +
      '</div>';
    document.body.appendChild(modal);
    var card = modal.firstChild;
    modal.querySelector('button').addEventListener('click', closeSuccess);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeSuccess(); });
    document.addEventListener('keydown', onModalKey, true);
    requestAnimationFrame(function () {
      modal.style.opacity = '1';
      if (!reduce) card.style.transform = 'none';
      modal.querySelector('button').focus();
    });
  }

  // Busca el campo de correo que acompaña al botón (mismo bloque)
  function findInput(el) {
    var node = el;
    for (var i = 0; i < 4 && node; i++) {
      node = node.parentElement;
      var input = node && node.querySelector('input[type="email"]');
      if (input) return input;
    }
    return document.getElementById('correo-hero');
  }

  function subscribe(input) {
    if (sending || !input) return;
    var email = (input.value || '').trim();
    if (!email) { input.setAttribute('aria-invalid', 'true'); input.focus(); show(MSG.empty, 'error'); return; }
    if (!EMAIL_RE.test(email)) { input.setAttribute('aria-invalid', 'true'); input.focus(); show(MSG.invalid, 'error'); return; }
    input.removeAttribute('aria-invalid');

    var body = new URLSearchParams();
    body.append('EMAIL', email);
    body.append('email_address_check', ''); // campo trampa de Brevo: debe ir vacío
    body.append('locale', 'es');

    sending = true;
    show(MSG.sending, 'sending');
    // redirect: 'manual' porque, si el formulario de Brevo tiene una página de
    // confirmación, Brevo responde al éxito con una redirección; seguirla la
    // bloquea el navegador (CORS) aunque la suscripción ya quedó registrada.
    fetch(BREVO_URL, { method: 'POST', body: body, mode: 'cors', redirect: 'manual' })
      .then(function (r) {
        if (r.type === 'opaqueredirect') return { success: true };
        return r.json().catch(function () { return { success: r.ok }; });
      })
      .then(function (data) {
        if (data && data.success) {
          input.value = '';
          if (toast) { clearTimeout(hideTimer); toast.style.opacity = '0'; }
          openSuccess(input);
        }
        else if (data && data.errors && data.errors.EMAIL) { input.setAttribute('aria-invalid', 'true'); input.focus(); show(MSG.invalid, 'error'); }
        else show(MSG.error, 'error');
      })
      .catch(function () { show(MSG.error, 'error'); })
      .then(function () { sending = false; });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#suscribirse"]');
    if (!a) return;
    e.preventDefault();
    subscribe(findInput(a));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var t = e.target;
    if (!t || t.tagName !== 'INPUT' || t.type !== 'email') return;
    e.preventDefault();
    subscribe(t);
  });
})();
