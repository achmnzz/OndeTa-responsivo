import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { getErrorMessage } from '../../services/apiErrors';
import { reverseGeocode } from '../../services/geocoding';
import { useSlowHint, SLOW_SERVER_MESSAGE } from '../../hooks/useSlowHint';
import './styles.css';

const STATUS_LABEL = {
  perdido: 'Perdido',
  encontrado: 'Encontrado',
};

function only_digits(value) {
  return (value || '').replace(/\D/g, '');
}

function whatsapp_link(contact) {
  const digits = only_digits(contact);
  if (digits.length < 10) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export default function PostDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareFeedback, setShareFeedback] = useState('');
  const [fallbackAddress, setFallbackAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice ?? '');
  const slow = useSlowHint(loading);

  useEffect(() => {
    let cancelled = false;

    async function fetch_post() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/posts/${id}`);
        if (cancelled) return;
        setPost(response.data);

        const { address, latitude, longitude } = response.data;
        if (!address && latitude != null && longitude != null) {
          setAddressLoading(true);
          reverseGeocode(latitude, longitude)
            .then((found) => { if (!cancelled) setFallbackAddress(found); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setAddressLoading(false); });
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Não foi possível carregar essa postagem.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch_post();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handle_back() {
    if (location.key !== 'default') navigate(-1);
    else navigate('/feed');
  }

  async function handle_share() {
    const url = window.location.href;
    const title = `${STATUS_LABEL[post.category] ?? 'Pet'}: ${post.pet_name || post.pet_type || 'animal'} – OndeTá?`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: post.description || title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareFeedback('Link copiado!');
    } catch (err) {
      if (err?.name !== 'AbortError') setShareFeedback('Não foi possível compartilhar.');
    }
    setTimeout(() => setShareFeedback(''), 3000);
  }

  const whatsapp = post?.author?.contact ? whatsapp_link(post.author.contact) : null;
  const isOwner = Boolean(post && user && post.author?.id === user.id);
  const addressText = post?.address || fallbackAddress;

  return (
    <div className="post-detail-container">
      <Navbar active="feed" />

      <main className="post-detail-main">
        <button type="button" className="post-detail-back-btn" onClick={handle_back}>
          ← Voltar
        </button>

        {notice && (
          <div className="post-detail-notice" role="status">
            <p>{notice}</p>
            <button
              type="button"
              className="post-detail-notice-close"
              onClick={() => {
                setNotice('');
                navigate('.', { replace: true, state: null });
              }}
            >
              Ok
            </button>
          </div>
        )}

        {loading && (
          <p className="post-detail-loading" role="status">
            Carregando...
            {slow && <span className="post-detail-slow-hint">{SLOW_SERVER_MESSAGE}</span>}
          </p>
        )}
        {error && <p className="post-detail-error" role="alert">{error}</p>}

        {post && (
          <article className="post-detail-card">
            <div className="post-detail-gallery">
              {post.images && post.images.length > 0 ? (
                post.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={post.pet_name || 'Foto do animal'}
                    decoding="async"
                  />
                ))
              ) : (
                <div className="post-detail-photo-placeholder" aria-hidden="true">🐾</div>
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

              <p className="post-detail-location">
                <span className="post-detail-location-label">📍 Local:</span>{' '}
                {addressText ||
                  (addressLoading ? 'buscando endereço...' : 'endereço não informado')}
              </p>

              {post.author && (
                <section className="post-detail-author" aria-labelledby="contato-titulo">
                  <h2 id="contato-titulo">Contato</h2>
                  <p className="post-detail-author-name">{post.author.name}</p>

                  <div className="post-detail-contact-actions">
                    {post.author.contact && (
                      <a
                        className="post-detail-contact-btn"
                        href={`tel:${only_digits(post.author.contact)}`}
                      >
                        Ligar: {post.author.contact}
                      </a>
                    )}
                    {whatsapp && (
                      <a
                        className="post-detail-contact-btn post-detail-contact-btn--whatsapp"
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                    {post.author.email && (
                      <a
                        className="post-detail-contact-btn"
                        href={`mailto:${post.author.email}`}
                      >
                        E-mail: {post.author.email}
                      </a>
                    )}
                  </div>
                </section>
              )}

              <div className="post-detail-actions">
                {isOwner && (
                  <button
                    type="button"
                    className="post-detail-edit-btn"
                    onClick={() => navigate(`/posts/${post.id}/edit`)}
                  >
                    Editar postagem
                  </button>
                )}
                <button type="button" className="post-detail-share-btn" onClick={handle_share}>
                  Compartilhar
                </button>
              </div>
              {shareFeedback && (
                <p className="post-detail-share-feedback" role="status">{shareFeedback}</p>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
