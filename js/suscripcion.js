/* AI Lab · suscripción al newsletter con Brevo.
   Conecta los campos de correo de la portada (primera pantalla, bloque final
   y resultado del test) al formulario de Brevo "AI Lab · Suscripción
   newsletter", sin cambiar su diseño.
   - Escucha los botones con href="#suscribirse" y la tecla Enter en el campo.
   - Valida el correo aquí: Brevo responde "success" incluso con correos mal
     escritos, así que la validación del sitio es la que cuenta.
   - Muestra el resultado en un aviso flotante. No inserta nodos dentro de la
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
    ok: '¡Listo! Ya está suscrito a AI Lab. Recibirá la próxima edición en su correo.',
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
    fetch(BREVO_URL, { method: 'POST', body: body, mode: 'cors' })
      .then(function (r) { return r.ok ? r.json() : { success: false }; })
      .then(function (data) {
        if (data && data.success) { input.value = ''; show(MSG.ok, 'ok'); }
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
