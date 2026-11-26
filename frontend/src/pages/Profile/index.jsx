import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { getErrorMessage } from '../../services/apiErrors';
import './styles.css';

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetch_profile() {
      try {
        const response = await api.get('/me');
        if (!cancelled) setProfile(response.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Erro ao carregar perfil'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch_profile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handle_update_password(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.patch('/me/password', {
        old_password: currentPassword,
        new_password: newPassword
      });

      setPasswordSuccess('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Erro ao redefinir senha'));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handle_delete_account() {
    setDeleteLoading(true);
    setDeleteError('');

    try {
      await api.delete('/me');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Erro ao excluir conta'));
      setDeleteLoading(false);
    }
  }

  return (
    <div className="profile-container">
      <Navbar active="profile" />

      <main className="profile-main">
        <div className="profile-card">
          <h1 className="profile-subtitle">Meu perfil</h1>

          {loading && <p className="profile-loading" role="status">Carregando...</p>}
          {error && <p className="profile-error" role="alert">{error}</p>}

          {profile && (
            <div className="profile-info">
              <div className="profile-field">
                <span className="profile-label">Nome</span>
                <span className="profile-value">{profile.name}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">E-mail</span>
                <span className="profile-value">{profile.email}</span>
              </div>
              {profile.contact && (
                <div className="profile-field">
                  <span className="profile-label">Telefone</span>
                  <span className="profile-value">{profile.contact}</span>
                </div>
              )}
            </div>
          )}

          <div className="profile-actions">
            <button
              type="button"
              className="profile-btn profile-btn--secondary"
              aria-expanded={showPasswordForm}
              onClick={() => { setShowPasswordForm((v) => !v); setShowDeleteConfirm(false); }}
            >
              Redefinir senha
            </button>

            <button
              type="button"
              className="profile-btn profile-btn--danger-outline"
              aria-expanded={showDeleteConfirm}
              onClick={() => { setShowDeleteConfirm((v) => !v); setShowPasswordForm(false); }}
            >
              Excluir conta
            </button>
          </div>

          {showPasswordForm && (
            <form className="profile-form" onSubmit={handle_update_password}>
              <p className="profile-form-title">Redefinir senha</p>

              {passwordSuccess && <p className="profile-success" role="status">{passwordSuccess}</p>}
              {passwordError && <p className="profile-error" role="alert">{passwordError}</p>}

              <div className="profile-form-field">
                <label htmlFor="current_password">Senha atual</label>
                <input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  enterKeyHint="next"
                  required
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="new_password">Nova senha</label>
                <input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  enterKeyHint="next"
                  required
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="confirm_password">Confirmar nova senha</label>
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  enterKeyHint="done"
                  required
                />
              </div>

              <button type="submit" className="profile-btn" disabled={passwordLoading}>
                {passwordLoading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}

          {showDeleteConfirm && (
            <div className="profile-delete-confirm">
              <p className="profile-delete-text">
                Tem certeza que deseja excluir sua conta? Você sairá do app. Se mudar de ideia, entre de novo com o mesmo e-mail e senha para reativá-la.
              </p>
              {deleteError && <p className="profile-error" role="alert">{deleteError}</p>}
              <div className="profile-delete-btns">
                <button
                  type="button"
                  className="profile-btn profile-btn--danger"
                  onClick={handle_delete_account}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Excluindo...' : 'Sim, excluir conta'}
                </button>
                <button
                  type="button"
                  className="profile-btn profile-btn--secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
