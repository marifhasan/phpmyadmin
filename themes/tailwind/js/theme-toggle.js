/**
 * phpMyAdmin Tailwind theme — light/dark toggle.
 *
 * Behavior
 * --------
 *   1. On load, read localStorage('pma_theme').
 *        - If 'light' or 'dark' -> set <html data-theme>.
 *        - Otherwise, follow the OS prefers-color-scheme (no data-theme attr).
 *   2. Inject a floating toggle button (sun/moon SVG) into the page.
 *   3. Clicking the button cycles between explicit light <-> dark and
 *      persists the choice. A long-press / right-click clears the override
 *      (returns to "follow system").
 *
 * Integration
 * -----------
 * phpMyAdmin does NOT auto-load per-theme JS. Include this file by adding
 * the following to your `config/config.footer.inc.php` (create it if missing):
 *
 *     <?php
 *     // Inject Tailwind theme toggle when that theme is active.
 *     $themeName = $GLOBALS['PMA_Config'] ?? null;
 *     ?>
 *     <script src="themes/tailwind/js/theme-toggle.js" defer></script>
 *
 * Or, more simply, paste the minified inline version from README.md.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pma_theme';
  var root = document.documentElement;

  function resolveInitialTheme() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      return { mode: stored, explicit: true };
    }
    return { mode: null, explicit: false };
  }

  function currentVisualMode() {
    if (root.dataset.theme === 'light' || root.dataset.theme === 'dark') {
      return root.dataset.theme;
    }
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }

  function applyInitial() {
    var init = resolveInitialTheme();
    if (init.explicit) {
      root.dataset.theme = init.mode;
    } else {
      delete root.dataset.theme;
    }
  }

  // Toggle button styles — kept inline so the script is fully self-contained
  // and works even before theme.css finishes loading.
  function injectStyles() {
    if (document.getElementById('pma-theme-toggle-styles')) return;
    var css = [
      '.pma-theme-toggle{',
        'position:fixed;',
        'top:1rem;',
        'inset-inline-end:1rem;',
        'z-index:9999;',
        'display:inline-flex;',
        'align-items:center;',
        'justify-content:center;',
        'width:2.25rem;',
        'height:2.25rem;',
        'padding:0;',
        'border:1px solid var(--pma-border-strong,#cbd5e1);',
        'border-radius:9999px;',
        'background-color:var(--pma-surface,#f8fafc);',
        'color:var(--pma-text,#0f172a);',
        'cursor:pointer;',
        'box-shadow:0 1px 3px rgba(15,23,42,.12);',
        'transition:background-color .15s ease,color .15s ease,border-color .15s ease;',
      '}',
      '.pma-theme-toggle:hover{',
        'background-color:var(--pma-surface-2,#f1f5f9);',
        'border-color:var(--pma-muted,#64748b);',
      '}',
      '.pma-theme-toggle:focus-visible{',
        'outline:none;',
        'box-shadow:0 0 0 3px color-mix(in srgb,var(--pma-ring,#6366f1) 35%,transparent);',
      '}',
      '.pma-theme-toggle svg{width:1.05rem;height:1.05rem;}',
      '.pma-theme-toggle .pma-toggle-sun{display:none;}',
      '.pma-theme-toggle .pma-toggle-moon{display:inline-block;}',
      '.pma-theme-toggle.is-light .pma-toggle-sun{display:inline-block;}',
      '.pma-theme-toggle.is-light .pma-toggle-moon{display:none;}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'pma-theme-toggle-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  var SUN_SVG = '<svg class="pma-toggle-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
  var MOON_SVG = '<svg class="pma-toggle-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  function createButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pma-theme-toggle';
    btn.setAttribute('aria-label', 'Toggle light/dark theme');
    btn.title = 'Toggle light/dark theme (right-click to follow system)';
    btn.innerHTML = SUN_SVG + MOON_SVG;
    btn.addEventListener('click', function () {
      var next = currentVisualMode() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      updateButton(btn);
    });
    btn.addEventListener('contextmenu', function (e) {
      // Clear override -> follow system.
      e.preventDefault();
      delete root.dataset.theme;
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
      updateButton(btn);
    });
    return btn;
  }

  function updateButton(btn) {
    var mode = currentVisualMode();
    btn.classList.toggle('is-light', mode === 'light');
    btn.setAttribute('aria-pressed', String(mode === 'dark'));
  }

  function init() {
    applyInitial();
    injectStyles();
    if (document.querySelector('.pma-theme-toggle')) return; // idempotent
    var btn = createButton();
    document.body.appendChild(btn);
    updateButton(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Respond to OS theme changes when no explicit override is set.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener(
      'change',
      function () {
        if (!root.dataset.theme) {
          var btn = document.querySelector('.pma-theme-toggle');
          if (btn) updateButton(btn);
        }
      }
    );
  }
})();
