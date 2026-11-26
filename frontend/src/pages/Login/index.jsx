import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSlowHint, SLOW_SERVER_MESSAGE } from '../../hooks/useSlowHint';
import logo from '../../assets/logo-ondeta.webp';
import './styles.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountInactive, setAccountInactive] = useState(false);
  const slow = useSlowHint(loading);

  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('sessao') === 'expirada';

  const { login: authLogin } = useAuth();

  async function do_login({ reactivate = false } = {}) {
    setError('');
    setAccountInactive(false);
    setLoading(true);

    try {
      await authLogin(email.trim(), password, { reactivate });
    } catch (err) {
      if (err.accountInactive) {
        setAccountInactive(true);
      } else {
        setError(err.message || 'Erro ao realizar login');
      }
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    do_login();
  }

  return (
    <div className="login-container">
      <main className="login-card">
        <img src={logo} alt="OndeTá?" className="login-logo" width="480" height="334" />
        <h1 className="login-subtitle">Encontre seu pet perdido</h1>

        {sessionExpired && !error && (
          <p className="login-info" role="status">
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              enterKeyHint="go"
            />
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          {accountInactive && (
            <div className="login-inactive" role="alert">
              <p>Esta conta foi excluída. Deseja reativá-la e entrar?</p>
              <button
                type="button"
                className="login-reactivate-btn"
                onClick={() => do_login({ reactivate: true })}
                disabled={loading}
              >
                Reativar conta
              </button>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {slow && <p className="login-slow-hint" role="status">{SLOW_SERVER_MESSAGE}</p>}
        </form>

        <p className="login-register">
          Não tem conta?{' '}
          <Link to="/register">Cadastre-se</Link>
        </p>

        <p className="login-register login-guest">
          <Link to="/feed">Ver os relatos sem entrar</Link>
        </p>
      </main>
    </div>
  );
}
