import React, { useState } from 'react';

/**
 * BethelLogin
 *
 * A self-contained login component for the "Bethel SME Fundings" micro-lending
 * platform. All colours, fonts and spacing are defined as CSS custom properties
 * near the top of the embedded stylesheet so the theme can be changed in one
 * place.
 *
 * Auth is intentionally left as a stub: replace `simulateLogin` with a real
 * Firebase/Supabase call.
 */
export default function BethelLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = `
    :root {
      --bethel-primary: #1d4ed8;
      --bethel-primary-dark: #1e3a8a;
      --bethel-accent: #10b981;
      --bethel-bg: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%);
      --bethel-surface: #ffffff;
      --bethel-card: #ffffff;
      --bethel-text: #111827;
      --bethel-muted: #6b7280;
      --bethel-border: #d1d5db;
      --bethel-danger: #dc2626;
      --bethel-danger-soft: #fef2f2;
      --bethel-radius: 14px;
      --bethel-shadow: 0 20px 45px rgba(30, 58, 138, 0.12);
      --bethel-font: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      --bethel-space: 20px;
    }

    .bethel-login-root {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--bethel-bg);
      font-family: var(--bethel-font);
      color: var(--bethel-text);
    }

    .bethel-login-shell {
      width: min(100%, 980px);
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: 22px;
      overflow: hidden;
      box-shadow: var(--bethel-shadow);
      background: var(--bethel-card);
    }

    .bethel-login-brand {
      padding: 40px;
      background: linear-gradient(160deg, var(--bethel-primary) 0%, var(--bethel-primary-dark) 100%);
      color: #ffffff;
      display: grid;
      align-content: space-between;
      gap: 32px;
    }

    .bethel-login-brand h1 {
      margin: 0;
      font-size: 1.9rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .bethel-login-brand p {
      margin: 8px 0 0;
      color: rgba(255, 255, 255, 0.82);
      font-size: 1rem;
      line-height: 1.55;
    }

    .bethel-login-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 14px;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .bethel-login-feature {
      display: grid;
      gap: 12px;
    }

    .bethel-login-feature div {
      padding: 14px 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .bethel-login-feature strong {
      display: block;
      font-size: 0.92rem;
    }

    .bethel-login-feature span {
      color: rgba(255, 255, 255, 0.78);
      font-size: 0.82rem;
    }

    .bethel-login-form-wrap {
      padding: 40px 36px;
      display: grid;
      align-content: center;
    }

    .bethel-login-form-wrap h2 {
      margin: 0 0 6px;
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .bethel-login-form-wrap .bethel-subtitle {
      margin: 0 0 var(--bethel-space);
      color: var(--bethel-muted);
      font-size: 0.95rem;
    }

    .bethel-error-banner {
      margin-bottom: 16px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--bethel-danger-soft);
      border: 1px solid #fecaca;
      color: var(--bethel-danger);
      font-size: 0.88rem;
      font-weight: 500;
    }

    .bethel-field {
      margin-bottom: var(--bethel-space);
    }

    .bethel-field label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--bethel-text);
    }

    .bethel-input {
      width: 100%;
      height: 44px;
      padding: 0 14px;
      border: 1px solid var(--bethel-border);
      border-radius: 10px;
      background: #f9fafb;
      color: var(--bethel-text);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .bethel-input::placeholder {
      color: #9ca3af;
    }

    .bethel-input:focus {
      border-color: var(--bethel-primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.16);
    }

    .bethel-input.bethel-input-error {
      border-color: var(--bethel-danger);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .bethel-helper {
      margin-top: 6px;
      font-size: 0.8rem;
      color: var(--bethel-danger);
    }

    .bethel-password-wrap {
      position: relative;
    }

    .bethel-password-toggle {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      border: 0;
      background: transparent;
      color: var(--bethel-muted);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 8px;
    }

    .bethel-password-toggle:hover {
      color: var(--bethel-primary);
      background: rgba(29, 78, 216, 0.06);
    }

    .bethel-button {
      width: 100%;
      height: 46px;
      border: 0;
      border-radius: 11px;
      background: var(--bethel-primary);
      color: #ffffff;
      font-size: 0.98rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
      margin-top: 6px;
    }

    .bethel-button:hover:not(:disabled) {
      background: var(--bethel-primary-dark);
    }

    .bethel-button:active:not(:disabled) {
      transform: translateY(1px);
    }

    .bethel-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .bethel-links {
      display: grid;
      gap: 10px;
      margin-top: 16px;
      text-align: center;
      font-size: 0.88rem;
    }

    .bethel-links a {
      color: var(--bethel-primary);
      font-weight: 500;
      text-decoration: none;
    }

    .bethel-links a:hover {
      text-decoration: underline;
    }

    .bethel-footnote {
      margin-top: 10px;
      color: var(--bethel-muted);
    }

    @media (max-width: 760px) {
      .bethel-login-shell {
        grid-template-columns: 1fr;
      }

      .bethel-login-brand {
        padding: 30px 26px;
      }

      .bethel-login-form-wrap {
        padding: 30px 24px;
      }

      .bethel-login-brand h1 {
        font-size: 1.6rem;
      }
    }
  `;

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required.';
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) return 'Enter a valid email address.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    setLoading(true);
    setFormError('');

    try {
      // Replace this stub with Firebase/Supabase login:
      // await signInWithEmailAndPassword(auth, email, password)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      if (email.toLowerCase().includes('fail')) {
        throw new Error('Invalid email or password.');
      }
      if (onSuccess) onSuccess({ email });
    } catch (error) {
      setFormError(error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bethel-login-root">
      <style>{styles}</style>
      <div className="bethel-login-shell">
        <aside className="bethel-login-brand" aria-label="Bethel SME Fundings brand panel">
          <div>
            <div className="bethel-login-pill">Youth micro-lending</div>
            <h1>Bethel SME Fundings</h1>
            <p>
              Small capital, big momentum. Access fast, fair funding for your
              business, track repayments, and grow with confidence.
            </p>
            <div className="bethel-login-feature">
              <div>
                <strong>Fast approval</strong>
                <span>Get a decision within minutes, not weeks.</span>
              </div>
              <div>
                <strong>Transparent terms</strong>
                <span>No hidden fees. Clear repayment schedules.</span>
              </div>
              <div>
                <strong>Grow together</strong>
                <span>Tools and mentorship for young entrepreneurs.</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            © {new Date().getFullYear()} Bethel SME Fundings
          </p>
        </aside>

        <section className="bethel-login-form-wrap" aria-labelledby="bethel-login-heading">
          <h2 id="bethel-login-heading">Welcome back</h2>
          <p className="bethel-subtitle">Sign in to manage your funding account.</p>

          {formError ? <div className="bethel-error-banner">{formError}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="bethel-field">
              <label htmlFor="bethel-email">Email</label>
              <input
                id="bethel-email"
                type="email"
                className={`bethel-input ${errors.email ? 'bethel-input-error' : ''}`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'bethel-email-error' : undefined}
              />
              {errors.email ? (
                <div id="bethel-email-error" className="bethel-helper">
                  {errors.email}
                </div>
              ) : null}
            </div>

            <div className="bethel-field">
              <label htmlFor="bethel-password">Password</label>
              <div className="bethel-password-wrap">
                <input
                  id="bethel-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`bethel-input ${errors.password ? 'bethel-input-error' : ''}`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'bethel-password-error' : undefined}
                />
                <button
                  type="button"
                  className="bethel-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? (
                <div id="bethel-password-error" className="bethel-helper">
                  {errors.password}
                </div>
              ) : null}
            </div>

            <button type="submit" className="bethel-button" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="bethel-links">
              <a href="/forgot-password">Forgot password?</a>
              <div className="bethel-footnote">
                Don&apos;t have an account? <a href="/signup">Sign up</a>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}