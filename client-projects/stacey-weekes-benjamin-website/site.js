/* ==========================================================================
   Stacey Weekes-Benjamin Design House — interface behaviour
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopNav = window.matchMedia('(min-width: 1181px)');
  var compactFooter = window.matchMedia('(max-width: 780px)');

  /* ------------------------------------------------------------- Drawer -- */

  var toggle = document.getElementById('menu-toggle');
  var drawer = document.getElementById('nav-drawer');
  var scrim = document.getElementById('drawer-scrim');
  var drawerClose = document.getElementById('drawer-close');
  var lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    scrim.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    drawerClose.focus();
    document.addEventListener('keydown', trapDrawerFocus);
  }

  function closeDrawer(restoreFocus) {
    if (drawer.hidden) return;
    drawer.hidden = true;
    scrim.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', trapDrawerFocus);
    if (restoreFocus !== false && lastFocus) lastFocus.focus();
  }

  function trapDrawerFocus(event) {
    if (event.key !== 'Tab') return;
    var items = drawer.querySelectorAll('a[href], button:not([disabled])');
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener('click', function () {
    if (drawer.hidden) openDrawer();
    else closeDrawer();
  });
  drawerClose.addEventListener('click', function () { closeDrawer(); });
  scrim.addEventListener('click', function () { closeDrawer(); });
  drawer.addEventListener('click', function (event) {
    if (event.target.closest('a')) closeDrawer(false);
  });

  /* ---------------------------------------------------------- Scrollspy -- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-desktop a'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var match = link.getAttribute('href') === '#' + entry.target.id;
          if (match) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------------ Reveal on view -- */

  var revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { revealer.observe(el); });
  }

  /* ----------------------------------------------------- Product detail -- */

  var pdp = document.getElementById('pdp');
  var pdpImage = document.getElementById('pdp-image');
  var pdpCollection = document.getElementById('pdp-collection');
  var pdpRef = document.getElementById('pdp-ref');
  var pdpName = document.getElementById('pdp-name');
  var pdpSpecs = document.getElementById('pdp-specs');
  var pdpEnquire = document.getElementById('pdp-enquire');
  var pdpClose = document.getElementById('pdp-close');
  var pdpTrigger = null;
  var activeRef = '';
  var activeCollection = '';

  var SPEC_FIELDS = [
    { key: 'edition', label: 'Edition' },
    { key: 'remaining', label: 'Quantity remaining' },
    { key: 'year', label: 'Year' },
    { key: 'designer', label: 'Designed by' },
    { key: 'status', label: 'Availability' },
    { key: 'price', label: 'Price' },
    { key: 'fabric', label: 'Fabrication' },
    { key: 'size', label: 'Sizes' },
    { key: 'views', label: 'Additional views', optional: true }
  ];

  function buildSpecs(data) {
    pdpSpecs.textContent = '';
    SPEC_FIELDS.forEach(function (field) {
      var value = data[field.key];
      if (field.key === 'price' && !value) value = 'On enquiry';
      if (field.optional && !value) return;
      var row = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = field.label;
      dd.textContent = value || 'To be confirmed';
      if (value) dd.classList.add('is-set');
      row.appendChild(dt);
      row.appendChild(dd);
      pdpSpecs.appendChild(row);
    });
  }

  function openDetail(card, trigger) {
    var data = card.dataset;
    activeRef = data.ref || '';
    activeCollection = data.collection || '';
    pdpTrigger = trigger;

    pdpImage.src = data.image || '';
    pdpImage.alt = data.alt || '';
    pdpCollection.textContent = data.collection || '';
    pdpRef.textContent = data.ref || '';
    pdpName.textContent = data.name || 'Design name to be confirmed';
    buildSpecs(data);

    if (typeof pdp.showModal === 'function') {
      pdp.showModal();
      document.body.classList.add('is-locked');
    } else {
      pdp.setAttribute('open', '');
    }
  }

  function closeDetail() {
    if (typeof pdp.close === 'function') pdp.close();
    else pdp.removeAttribute('open');
  }

  document.querySelectorAll('[data-open-detail]').forEach(function (trigger) {
    var card = trigger.closest('[data-ref]');
    if (!card) return;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.addEventListener('click', function () { openDetail(card, trigger); });
  });

  pdpClose.addEventListener('click', closeDetail);

  pdp.addEventListener('click', function (event) {
    if (event.target === pdp) closeDetail();
  });

  pdp.addEventListener('close', function () {
    document.body.classList.remove('is-locked');
    if (pdpTrigger) pdpTrigger.focus();
  });

  /* ------------------------------------------------------ Enquiry form --- */

  var form = document.getElementById('enquiry-form');
  var status = document.getElementById('enquiry-status');
  var refField = document.getElementById('enq-reference');
  var subjectField = document.getElementById('enq-subject');
  var defaultStatus = status.textContent;

  function subjectForCollection(collection) {
    if (/OOO/i.test(collection)) return 'OOO-AṢA private acquisition';
    return 'Availability and pricing';
  }

  function prefillEnquiry() {
    if (activeRef) refField.value = activeRef;
    var wanted = subjectForCollection(activeCollection);
    Array.prototype.forEach.call(subjectField.options, function (option) {
      if (option.value === wanted || option.textContent === wanted) subjectField.value = option.value;
    });
  }

  pdpEnquire.addEventListener('click', function () {
    prefillEnquiry();
    closeDetail();
    var target = document.getElementById('enquiry-form');
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    window.setTimeout(function () { document.getElementById('enq-name').focus(); }, reduceMotion ? 0 : 600);
  });

  function setError(field, message) {
    var wrap = field.closest('.field');
    clearError(field);
    if (!message) return;
    wrap.classList.add('has-error');
    field.setAttribute('aria-invalid', 'true');
    var note = document.createElement('p');
    note.className = 'field-error';
    note.textContent = message;
    wrap.appendChild(note);
  }

  function clearError(field) {
    var wrap = field.closest('.field');
    wrap.classList.remove('has-error');
    field.removeAttribute('aria-invalid');
    var existing = wrap.querySelector('.field-error');
    if (existing) existing.remove();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = document.getElementById('enq-name');
    var email = document.getElementById('enq-email');
    var message = document.getElementById('enq-message');
    var firstInvalid = null;

    if (!name.value.trim()) {
      setError(name, 'Please enter your name.');
      firstInvalid = firstInvalid || name;
    } else { clearError(name); }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      setError(email, 'Please enter a valid email address.');
      firstInvalid = firstInvalid || email;
    } else { clearError(email); }

    if (firstInvalid) {
      status.textContent = 'Please complete the highlighted fields.';
      firstInvalid.focus();
      return;
    }

    var lines = [
      'Name: ' + name.value.trim(),
      'Email: ' + email.value.trim(),
      'Nature of enquiry: ' + subjectField.value
    ];
    if (refField.value.trim()) lines.push('Design reference: ' + refField.value.trim());
    if (message.value.trim()) lines.push('', message.value.trim());

    var subject = 'Enquiry — ' + subjectField.value + (refField.value.trim() ? ' (' + refField.value.trim() + ')' : '');
    var href = 'mailto:concierge@staceyweekesbenjamin.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(lines.join('\n'));

    status.textContent = 'Opening your email application. If nothing opens, write to concierge@staceyweekesbenjamin.com.';
    window.location.href = href;
    window.setTimeout(function () { status.textContent = defaultStatus; }, 9000);
  });

  form.addEventListener('input', function (event) {
    if (event.target.closest('.field')) clearError(event.target);
  });

  /* -------------------------------------------------- Footer accordions -- */

  document.querySelectorAll('.footer-toggle').forEach(function (button) {
    var column = button.closest('.footer-col');
    button.addEventListener('click', function () {
      if (!compactFooter.matches) return;
      var open = column.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  function syncFooter() {
    document.querySelectorAll('.footer-col').forEach(function (column) {
      var button = column.querySelector('.footer-toggle');
      if (compactFooter.matches) {
        button.setAttribute('aria-expanded', String(column.classList.contains('is-open')));
      } else {
        button.setAttribute('aria-expanded', 'true');
      }
    });
  }

  syncFooter();
  if (compactFooter.addEventListener) compactFooter.addEventListener('change', syncFooter);

  /* ------------------------------------------------------------ Escape --- */

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeDrawer();
  });

  if (desktopNav.addEventListener) {
    desktopNav.addEventListener('change', function (event) {
      if (event.matches) closeDrawer(false);
    });
  }
})();
