import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSlowHint, SLOW_SERVER_MESSAGE } from '../../hooks/useSlowHint';
import api from '../../services/api';
import { getErrorMessage, getFieldErrors } from '../../services/apiErrors';
import logo from '../../assets/logo-ondeta.webp';
import './styles.css';

const FIELDS = ['name', 'email', 'password', 'contact'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/;

function validate({ name, email, password, contact }) {
  const errors = {};
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const phoneDigits = contact.replace(/\D/g, '');

  if (!cleanName) errors.name = 'Informe seu nome.';
  else if (cleanName.length < 2) errors.name = 'O nome deve ter pelo menos 2 caracteres.';

  if (!cleanEmail) errors.email = 'Informe seu e-mail.';
  else if (!EMAIL_PATTERN.test(cleanEmail)) {
    errors.email = 'Informe um e-mail válido, como nome@exemplo.com.';
  }

  if (!password) errors.password = 'Informe uma senha.';
  else if (password.length < 6) errors.password = 'A senha deve ter pelo menos 6 caracteres.';

  if (phoneDigits && !PHONE_PATTERN.test(phoneDigits)) {
    errors.contact = 'Informe um telefone válido com DDD, como (41) 99999-9999.';
  }

  return errors;
}

function focus_first_error(errors) {
  const field = FIELDS.find((key) => errors[key]);
  if (field) document.getElementById(field)?.focus();
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const slow = useSlowHint(loading);

  const { login: authLogin } = useAuth();

  function format_contact(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function clear_field_error(field) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  }

  function error_props(field) {
    return fieldErrors[field]
      ? { 'aria-invalid': true, 'aria-describedby': `${field}-error` }
      : {};
  }

  function field_error(field) {
    if (!fieldErrors[field]) return null;
    return (
      <p id={`${field}-error`} className="register-field-error">
        {fieldErrors[field]}
      </p>
    );
  }

  async function handle_submit(e) {
    e.preventDefault();
    setError('');

    const errors = validate({ name, email, password, contact });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focus_first_error(errors);
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim();

    try {
      await api.post('/auth/register', {
        name: name.trim(),
        email: cleanEmail,
        password,
        contact
      });

      await authLogin(cleanEmail, password);
    } catch (err) {
      const serverErrors = getFieldErrors(err);
      if (err.response?.status === 409) {
        serverErrors.email = getErrorMessage(err, 'Este e-mail já está cadastrado.');
      }

      const known = Object.fromEntries(
        FIELDS.filter((field) => serverErrors[field]).map((field) => [field, serverErrors[field]]),
      );
      if (Object.keys(known).length > 0) {
        setFieldErrors(known);
        focus_first_error(known);
      } else {
        setError(err.response ? getErrorMessage(err, 'Erro ao processar cadastro') : err.message);
      }
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <main className="register-card">
        <img src={logo} alt="OndeTá?" className="register-logo" width="480" height="334" />
        <h1 className="register-subtitle">Crie sua conta</h1>

        <form onSubmit={handle_submit} className="register-form" noValidate>
          <div className="register-field">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clear_field_error('name');
              }}
              placeholder="Seu nome completo"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              {...error_props('name')}
            />
            {field_error('name')}
          </div>

          <div className="register-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clear_field_error('email');
              }}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              {...error_props('email')}
            />
            {field_error('email')}
          </div>

          <div className="register-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear_field_error('password');
              }}
              placeholder="Mínimo de 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              enterKeyHint="next"
              {...error_props('password')}
            />
            {field_error('password')}
          </div>

          <div className="register-field">
            <label htmlFor="contact">
              Telefone <span className="register-optional">(opcional)</span>
            </label>
            <input
              id="contact"
              type="tel"
              inputMode="tel"
              value={contact}
              onChange={(e) => {
                setContact(format_contact(e.target.value));
                clear_field_error('contact');
              }}
              placeholder="(00) 00000-0000"
              autoComplete="tel-national"
              enterKeyHint="done"
              {...error_props('contact')}
            />
            {field_error('contact')}
          </div>

          {error && <p className="register-error" role="alert">{error}</p>}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Processando...' : 'Criar conta'}
          </button>

          {slow && <p className="register-slow-hint" role="status">{SLOW_SERVER_MESSAGE}</p>}
        </form>

        <p className="register-link">
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </p>
      </main>
    </div>
  );
}
