/**
 * Cross-platform clipboard copy utility
 * Works on both desktop and mobile browsers
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first (works on most modern browsers)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      // Fall through to fallback method
    }
  }

  // Fallback method for older browsers and mobile devices
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);

    // Select and copy
    textArea.focus();
    textArea.select();
    
    // For iOS Safari
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    }

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Fallback copy method failed:', err);
    return false;
  }
}

/**
 * Copy to clipboard with user feedback
 * Shows a temporary input field on mobile if clipboard API fails
 */
export async function copyToClipboardWithFallback(
  text: string,
  onSuccess?: () => void,
  onError?: () => void
): Promise<boolean> {
  const success = await copyToClipboard(text);
  
  if (success) {
    onSuccess?.();
    return true;
  } else {
    // If copy failed, show a fallback UI
    showCopyFallback(text);
    onError?.();
    return false;
  }
}

/**
 * Show a temporary input field for manual copy on mobile
 */
function showCopyFallback(text: string) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 90%;
    width: 100%;
    max-width: 400px;
  `;

  modal.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">
      Copy Link
    </h3>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
      Select and copy the link below:
    </p>
    <input 
      type="text" 
      value="${text}" 
      readonly
      id="copy-fallback-input"
      style="
        width: 100%;
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        background: #f9fafb;
        margin-bottom: 16px;
      "
    />
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button 
        id="copy-fallback-close"
        style="
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        "
      >
        Close
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus and select the input
  const input = modal.querySelector('#copy-fallback-input') as HTMLInputElement;
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
      // Try to copy again after user interaction
      if (document.execCommand('copy')) {
        overlay.remove();
        return;
      }
    }, 100);
  }

  // Close button handler
  const closeBtn = modal.querySelector('#copy-fallback-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.remove();
    }
  }, 30000);
}

