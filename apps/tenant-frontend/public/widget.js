(function() {
  // Prevent duplicate script execution
  if (window.RelayDeskWidgetInitialized) return;
  window.RelayDeskWidgetInitialized = true;

  // Find configuration from script tag
  const scriptTag = document.currentScript || (() => {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const tenantKey = scriptTag.getAttribute('data-tenant-key');
  const vapiPublicKey = scriptTag.getAttribute('data-vapi-public-key');
  const vapiAssistantId = scriptTag.getAttribute('data-vapi-assistant-id');

  if (!tenantKey || !vapiPublicKey || !vapiAssistantId) {
    console.error('Relay Desk Widget: Missing required attributes (data-tenant-key, data-vapi-public-key, data-vapi-assistant-id).');
    return;
  }

  // Inject CSS Styles
  const style = document.createElement('style');
  style.innerHTML = `
    .rd-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #12382e;
      color: #ddf070;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(221, 240, 112, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .rd-widget-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
    }
    .rd-widget-btn.active {
      background-color: #dc2626 !important;
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
    .rd-widget-btn svg {
      width: 26px;
      height: 26px;
      fill: currentColor;
    }
    .rd-widget-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #dc2626;
      opacity: 0.5;
      z-index: -1;
      animation: rd-pulse-anim 1.4s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    }
    @keyframes rd-pulse-anim {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // SVG Icons
  const MIC_ICON = `
    <svg viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  `;

  const END_CALL_ICON = `
    <svg viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11H8c-.55 0-1-.45-1-1s.45-1 1-1h8c.55 0 1 .45 1 1s-.45 1-1 1z"/>
    </svg>
    <div class="rd-widget-pulse"></div>
  `;

  // Create Widget Button Element
  const widgetBtn = document.createElement('button');
  widgetBtn.className = 'rd-widget-btn';
  widgetBtn.setAttribute('title', 'Call Support');
  widgetBtn.innerHTML = MIC_ICON;
  document.body.appendChild(widgetBtn);

  let vapiInstance = null;
  let isCalling = false;
  let verifiedTenantId = null;

  // Load Vapi Web SDK from CDN
  function loadVapiSDK(callback) {
    if (window.vapiSDK || window.Vapi) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js';
    script.defer = true;
    script.onload = callback;
    script.onerror = () => console.error('Relay Desk: Failed to load Vapi Web SDK script.');
    document.head.appendChild(script);
  }

  // Toggle Call
  async function toggleCall() {
    if (isCalling) {
      if (vapiInstance) {
        vapiInstance.stop();
      }
      return;
    }

    widgetBtn.disabled = true;
    widgetBtn.style.opacity = '0.7';

    try {
      // 1. Verify widget & whitelisting
      if (!verifiedTenantId) {
        const scriptUrl = new URL(scriptTag.src);
        const frontendBaseUrl = scriptUrl.origin;

        const response = await fetch(`${frontendBaseUrl}/api/widget/verify?publishableKey=${encodeURIComponent(tenantKey)}`);
        if (!response.ok) {
          if (response.status === 402) {
            throw new Error('Call limit reached. Please upgrade your subscription.');
          }
          throw new Error('Unauthorized origin or invalid publishable key.');
        }
        const data = await response.json();
        verifiedTenantId = data.tenantId;
        window.RelayDeskRemainingSeconds = data.remainingSeconds;
      }

      // 2. Initialize Vapi Instance
      loadVapiSDK(() => {
        if (!vapiInstance) {
          if (window.Vapi) {
            vapiInstance = new window.Vapi(vapiPublicKey);
          } else if (window.vapiSDK) {
            vapiInstance = window.vapiSDK;
          } else {
            throw new Error('Vapi SDK could not be initialized.');
          }

          vapiInstance.on('call-start', () => {
            isCalling = true;
            widgetBtn.disabled = false;
            widgetBtn.style.opacity = '1';
            widgetBtn.classList.add('active');
            widgetBtn.setAttribute('title', 'End Call');
            widgetBtn.innerHTML = END_CALL_ICON;
          });

          vapiInstance.on('call-end', () => {
            isCalling = false;
            widgetBtn.disabled = false;
            widgetBtn.style.opacity = '1';
            widgetBtn.classList.remove('active');
            widgetBtn.setAttribute('title', 'Call Support');
            widgetBtn.innerHTML = MIC_ICON;
          });

          vapiInstance.on('error', (err) => {
            console.error('Vapi Error:', err);
            isCalling = false;
            widgetBtn.disabled = false;
            widgetBtn.style.opacity = '1';
            widgetBtn.classList.remove('active');
            widgetBtn.innerHTML = MIC_ICON;
          });
        }

        // 3. Start call with overrides
        const maxSecs = window.RelayDeskRemainingSeconds ? Math.min(window.RelayDeskRemainingSeconds, 1800) : 1800;
        
        vapiInstance.start(vapiAssistantId, {
          maxDurationSeconds: maxSecs,
          assistantOverrides: {
            variableValues: {
              tenantId: verifiedTenantId,
              tenant_id: verifiedTenantId
            }
          },
          variableValues: {
            tenantId: verifiedTenantId,
            tenant_id: verifiedTenantId
          }
        });
      });

    } catch (err) {
      console.error('Relay Desk Widget Error:', err.message);
      alert('Failed to connect call: ' + err.message);
      widgetBtn.disabled = false;
      widgetBtn.style.opacity = '1';
    }
  }

  widgetBtn.addEventListener('click', toggleCall);
})();
