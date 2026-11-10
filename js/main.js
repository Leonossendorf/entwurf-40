/* PharCoNa – Entwurf, kein Versand */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ruhig = function () {
    return root.classList.contains('no-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* Bewegung an/aus */
  var bew = $('#bewegung');
  function bewegungZeigen() {
    var aus = root.classList.contains('no-motion');
    if (bew) { bew.setAttribute('aria-pressed', aus ? 'true' : 'false'); bew.textContent = aus ? 'Bewegung an' : 'Bewegung aus'; }
  }
  if (bew) {
    bew.addEventListener('click', function () {
      root.classList.toggle('no-motion');
      try { localStorage.setItem('pc-motion', root.classList.contains('no-motion') ? 'off' : 'on'); } catch (e) {}
      bewegungZeigen();
      $$('.zeigen').forEach(function (el) { el.classList.add('ist-da'); });
    });
    bewegungZeigen();
  }

  /* Kopf: Linie beim Scrollen, Mobilmenü */
  var kopf = $('#kopf');
  window.addEventListener('scroll', function () { kopf.classList.toggle('ist-gescrollt', window.scrollY > 8); }, { passive: true });
  var menue = $('.menue'), mnav = $('#mobilnav');
  if (menue) {
    menue.addEventListener('click', function () {
      var offen = menue.getAttribute('aria-expanded') === 'true';
      menue.setAttribute('aria-expanded', String(!offen));
      mnav.hidden = offen;
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { menue.setAttribute('aria-expanded', 'false'); mnav.hidden = true; }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { mnav.hidden = true; menue.setAttribute('aria-expanded', 'false'); menue.focus(); } });
  }

  /* Einblenden */
  var zeig = $$('.zeigen');
  if ('IntersectionObserver' in window && !ruhig()) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ist-da'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    zeig.forEach(function (el) { io.observe(el); });
  } else { zeig.forEach(function (el) { el.classList.add('ist-da'); }); }

  /* Etikett: Markenname und Strichcode */
  var code = $('#strichcode'), eing = $('#marke-eingabe'), tipp = $('#etikett-tipp');
  function strichcode(text) {
    if (!code) return;
    var s = (text || 'PharCoNa Ahaus').toUpperCase(), x = 2, h = '', i, c, w;
    for (i = 0; i < s.length * 3 && x < 116; i++) {
      c = s.charCodeAt(i % s.length) + i * 7;
      w = 1 + (c % 3);
      if (i % 2 === 0) h += '<rect x="' + x + '" y="0" width="' + w + '" height="30"/>';
      x += w + 1 + ((c >> 2) % 2);
    }
    code.innerHTML = h;
  }
  strichcode('');
  if (eing) {
    eing.addEventListener('input', function () { strichcode(eing.value); if (tipp) tipp.hidden = true; });
  }

  /* Produktionslinie: Fortschritt und Pfeile */
  var band = $('#linie-band'), fluss = $('#linie-fluss');
  function fortschritt() {
    if (!band || !fluss) return;
    var max = band.scrollWidth - band.clientWidth;
    fluss.style.width = (max > 0 ? Math.max(6, band.scrollLeft / max * 100) : 100) + '%';
  }
  if (band) {
    band.addEventListener('scroll', fortschritt, { passive: true });
    window.addEventListener('resize', fortschritt);
    fortschritt();
    $$('.linie__steuer .rund').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = parseInt(b.getAttribute('data-richtung'), 10);
        band.scrollBy({ left: r * band.clientWidth * 0.8, behavior: ruhig() ? 'auto' : 'smooth' });
      });
    });
  }

  /* Stellen filtern */
  var status = $('#filter-status');
  $$('.filter__knopf').forEach(function (k) {
    k.addEventListener('click', function () {
      var f = k.getAttribute('data-filter'), n = 0;
      $$('.filter__knopf').forEach(function (x) { x.setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
      $$('.stelle').forEach(function (s) {
        var zeigen = f === 'alle' || s.getAttribute('data-gruppe') === f;
        s.hidden = !zeigen; if (zeigen) n++;
      });
      if (status) status.textContent = n + (n === 1 ? ' Stelle' : ' Stellen') + ' angezeigt';
    });
  });

  /* Bewerben-Knopf wählt die Stelle vor */
  var sel = $('#b-stelle');
  $$('[data-bewerben]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-bewerben');
      $$('option', sel).forEach(function (o) { if (o.textContent.trim() === t) sel.value = o.value || o.textContent; });
      $('#bewerbung').scrollIntoView({ behavior: ruhig() ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { sel.focus({ preventScroll: true }); }, ruhig() ? 0 : 450);
    });
  });

  /* Links in Leistungen wählen die passende Weiche im Anfrageformular */
  function waehle(name, wert) {
    $$('#form-anfrage input[name="' + name + '"]').forEach(function (i) { if (i.value === wert) i.checked = true; });
  }
  $$('[data-weg]').forEach(function (a) { a.addEventListener('click', function () { waehle('weg', a.getAttribute('data-weg')); }); });
  $$('[data-bereich]').forEach(function (a) { a.addEventListener('click', function () { waehle('bereich', a.getAttribute('data-bereich')); }); });

  /* Mengenregler */
  var stufen = ['unter 5.000 Stück', '5.000 bis 10.000 Stück', '10.000 bis 50.000 Stück', '50.000 bis 250.000 Stück', 'über 250.000 Stück', 'noch offen'];
  var menge = $('#a-menge'), mout = $('#a-menge-wert');
  if (menge) menge.addEventListener('input', function () { var t = stufen[+menge.value]; mout.textContent = t; menge.setAttribute('aria-valuetext', t); });

  /* Formulare: nur Telefon oder E-Mail ist Pflicht, Demo-Bestätigung */
  $$('form.formular').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var tel = $('input[type=tel]', f), mail = $('input[type=email]', f), fehler = $('.fehler', f);
      var t = tel.value.trim(), m = mail.value.trim();
      var mailOk = !m || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
      if ((!t && !m) || !mailOk) {
        fehler.textContent = !mailOk ? 'Die E-Mail-Adresse sieht unvollständig aus.' : 'Bitte Telefon oder E-Mail angeben, damit eine Antwort ankommt.';
        fehler.hidden = false;
        (!mailOk ? mail : (m ? tel : mail)).setAttribute('aria-invalid', 'true');
        (!mailOk ? mail : mail).focus();
        return;
      }
      fehler.hidden = true; tel.removeAttribute('aria-invalid'); mail.removeAttribute('aria-invalid');
      var ok = $('.erfolg', f);
      $$('.feld, .feldhilfe, button[type=submit], .demo', f).forEach(function (el) { el.hidden = true; });
      ok.hidden = false; ok.focus();
    });
  });
})();
