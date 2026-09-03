// pwa-install.js - Handles PWA installation for Nepali Patro

(function() {
  'use strict';

  let deferredPrompt = null;
  let isAppInstalled = false;

  // ============================================================
  //  CHECK IF ALREADY INSTALLED
  // ============================================================
  function checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isAppInstalled = true;
      return true;
    }
    if (window.navigator.standalone === true) {
      isAppInstalled = true;
      return true;
    }
    // Check if launched from a PWA
    if (window.location.search.includes('pwa=true')) {
      isAppInstalled = true;
      return true;
    }
    return false;
  }

  const installed = checkIfInstalled();

  // ============================================================
  //  BEFOREINSTALLPROMPT EVENT
  // ============================================================
  window.addEventListener('beforeinstallprompt', function(event) {
    console.log('[PWA] beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;

    // Show install banner only if not installed and not dismissed
    if (!installed && localStorage.getItem('pwa-banner-dismissed') !== 'true') {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', function() {
    console.log('[PWA] App installed successfully');
    isAppInstalled = true;
    hideInstallBanner();
    showInstallSuccess();
  });

  // ============================================================
  //  INSTALL BANNER
  // ============================================================
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #0a2a4f, #123b6d);
        color: #fff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        z-index: 9999;
        box-shadow: 0 -4px 30px rgba(0,0,0,0.25);
        flex-wrap: wrap;
        transform: translateY(100%);
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      ">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:180px;">
          <span style="font-size:28px;">📱</span>
          <div>
            <div style="font-weight:700;font-size:15px;">नेपाली पात्रो</div>
            <div style="font-size:12px;opacity:0.8;">App install गर्नुहोस् · Install App</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button id="pwa-install-btn" style="
            background: #f4aa2a;
            color: #123b6d;
            border: none;
            padding: 10px 22px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 14px;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.15s;
          ">
            📥 Install
          </button>
          <button id="pwa-close-btn" style="
            background: transparent;
            color: #fff;
            border: 1px solid rgba(255,255,255,0.25);
            padding: 10px 16px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            font-family: inherit;
          ">
            ✕
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.querySelector('div').style.transform = 'translateY(0)';
    });

    // Install button
    document.getElementById('pwa-install-btn').addEventListener('click', function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted');
          } else {
            console.log('[PWA] User dismissed');
          }
          deferredPrompt = null;
        });
      } else {
        showDesktopFallback();
      }
    });

    // Close button
    document.getElementById('pwa-close-btn').addEventListener('click', function() {
      hideInstallBanner();
      localStorage.setItem('pwa-banner-dismissed', 'true');
    });
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      const inner = banner.querySelector('div');
      if (inner) {
        inner.style.transform = 'translateY(100%)';
        setTimeout(() => banner.remove(), 400);
      } else {
        banner.remove();
      }
    }
  }

  function showInstallSuccess() {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #2e7d32;
        color: #fff;
        padding: 14px 28px;
        border-radius: 12px;
        z-index: 9999;
        font-weight: 600;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        text-align: center;
        min-width: 200px;
      ">
        ✅ App सफलतापूर्वक Install भयो!<br>
        <span style="font-size:13px;opacity:0.8;">App installed successfully!</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 4000);
  }

  // ============================================================
  //  DESKTOP FALLBACK
  // ============================================================
  function showDesktopFallback() {
    if (document.getElementById('pwa-desktop-fallback')) return;
    if (localStorage.getItem('pwa-desktop-dismissed') === 'true') return;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);

    const fallback = document.createElement('div');
    fallback.id = 'pwa-desktop-fallback';
    fallback.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #1a2639;
        color: #fff;
        padding: 20px 24px;
        z-index: 9998;
        box-shadow: 0 -4px 30px rgba(0,0,0,0.3);
        text-align: center;
        transform: translateY(100%);
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      ">
        <div style="max-width:600px;margin:0 auto;">
          <div style="font-size:28px;margin-bottom:6px;">📲</div>
          <div style="font-weight:700;font-size:17px;">App Install गर्नुहोस्</div>
          <div style="font-size:13px;opacity:0.8;margin-top:4px;">
            नेपाली पात्रोलाई आफ्नो घर पृष्ठमा थप्नुहोस्
          </div>
          <div style="margin-top:10px;font-size:13px;opacity:0.9;line-height:1.8;">
            ${isMobile ? `
              <strong>Chrome:</strong> ⋮ → Install App<br>
              <strong>Safari:</strong> Share → Add to Home Screen
            ` : `
              <strong>Chrome/Edge:</strong> ⋮ → Install "Nepali Patro"<br>
              <strong>Firefox:</strong> Add to Home Screen
            `}
          </div>
          <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button id="pwa-fallback-close" style="
              background: transparent;
              color: #fff;
              border: 1px solid rgba(255,255,255,0.3);
              padding: 8px 20px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              font-family: inherit;
            ">
              ✕ बुझें
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(fallback);

    // Animate in
    requestAnimationFrame(() => {
      fallback.querySelector('div').style.transform = 'translateY(0)';
    });

    document.getElementById('pwa-fallback-close').addEventListener('click', function() {
      const inner = fallback.querySelector('div');
      if (inner) {
        inner.style.transform = 'translateY(100%)';
        setTimeout(() => fallback.remove(), 400);
      } else {
        fallback.remove();
      }
      localStorage.setItem('pwa-desktop-dismissed', 'true');
    });
  }

  // ============================================================
  //  NAVBAR INSTALL BUTTON
  // ============================================================
  function addInstallButtonToNav() {
    if (isAppInstalled) return;
    if (document.getElementById('pwa-nav-btn')) return;

    const nav = document.querySelector('.navbar .nav .menu-wrapper .year-selector');
    if (!nav) return;

    const btn = document.createElement('button');
    btn.id = 'pwa-nav-btn';
    btn.style.cssText = `
      background: #f4aa2a;
      color: #123b6d;
      border: none;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.15s;
    `;
    btn.innerHTML = '📥 Install';

    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted from navbar');
          }
          deferredPrompt = null;
        });
      } else {
        showDesktopFallback();
      }
    });

    // Insert before the year-selector's content or after
    const parent = nav.parentNode;
    const yearSelector = nav;
    parent.insertBefore(btn, yearSelector);

    // Make it look natural
    btn.style.marginRight = '8px';
  }

  // ============================================================
  //  INIT
  // ============================================================
  function init() {
    console.log('[PWA] Initializing...');

    // If not installed, show fallback after a delay if no banner appeared
    if (!isAppInstalled) {
      setTimeout(() => {
        const hasBanner = document.getElementById('pwa-install-banner');
        const hasFallback = document.getElementById('pwa-desktop-fallback');
        if (!hasBanner && !hasFallback && localStorage.getItem('pwa-banner-dismissed') !== 'true') {
          // Check if we're on a mobile device
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);
          // Only show fallback for desktop or if beforeinstallprompt never fired
          if (!isMobile || !deferredPrompt) {
            showDesktopFallback();
          }
        }
      }, 5000);

      // Add navbar button
      setTimeout(addInstallButtonToNav, 1500);
    }

    // Listen for display-mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', function(e) {
      if (e.matches) {
        isAppInstalled = true;
        hideInstallBanner();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();