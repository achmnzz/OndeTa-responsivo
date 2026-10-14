import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import logo from '../../assets/Logo-ondeta-v1.png';
import './styles.css';

const STATUS_LABEL = {
  perdido: 'Perdido',
  encontrado: 'Encontrado',
};

export default function PostDetail() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetch_post();
  }, [user, id]);

  async function fetch_post() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Não foi possível carregar essa postagem.');
    } finally {
      setLoading(false);
    }
  }

  function handle_logout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="post-detail-container">
      <header className="post-detail-header">
        <img src={logo} alt="OndeTá?" className="post-detail-logo" />
        <div className="post-detail-header-actions">
          <button className="post-detail-nav-btn" onClick={() => navigate('/feed')}>
            Feed
          </button>
          <button className="post-detail-nav-btn" onClick={() => navigate('/feed', { state: { showMyPosts: true } })}>
            Minhas postagens
          </button>
          <button className="post-detail-nav-btn" onClick={() => navigate('/map')}>
            Mapa
          </button>
          <button className="post-detail-nav-btn" onClick={() => navigate('/create-post')}>
            Criar postagem
          </button>
          <button className="post-detail-nav-btn" onClick={() => navigate('/profile')}>
            Meu perfil
          </button>
          <button className="post-detail-logout-btn" onClick={handle_logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="post-detail-main">
        <button className="post-detail-back-btn" onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        {loading && <p className="post-detail-loading">Carregando...</p>}
        {error && <p className="post-detail-error">{error}</p>}

        {post && (
          <article className="post-detail-card">
            <div className="post-detail-gallery">
              {post.images && post.images.length > 0 ? (
                post.images.map((img) => (
                  <img key={img.id} src={img.url} alt={post.pet_name || 'Foto do animal'} />
                ))
              ) : (
                <div className="post-detail-photo-placeholder">🐾</div>
              )}
            </div>

            <div className="post-detail-info">
              <div className="post-detail-badges">
                <span className={`post-detail-badge post-detail-badge--${post.category}`}>
                  {STATUS_LABEL[post.category] ?? post.category}
                </span>
                {post.pet_type && <span className="post-detail-type">{post.pet_type}</span>}
              </div>

              <h1 className="post-detail-name">{post.pet_name || 'Animal sem nome informado'}</h1>

              {post.description && (
                <p className="post-detail-description">{post.description}</p>
              )}

              {post.date && (
                <p className="post-detail-date">
                  Reportado em {new Date(post.date).toLocaleDateString('pt-BR')}
                </p>
              )}

              {(post.latitude != null && post.longitude != null) && (
                <p className="post-detail-location">
                  Localização: {post.latitude.toFixed(5)}, {post.longitude.toFixed(5)}
                </p>
              )}

              {post.author && (
                <div className="post-detail-author">
                  <h2>Contato</h2>
                  <p>{post.author.name}</p>
                  {post.author.email && <p>{post.author.email}</p>}
                  {post.author.contact && <p>{post.author.contact}</p>}
                </div>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
