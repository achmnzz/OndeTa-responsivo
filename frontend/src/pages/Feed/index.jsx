import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { getErrorMessage } from '../../services/apiErrors';
import { useSlowHint, SLOW_SERVER_MESSAGE } from '../../hooks/useSlowHint';
import './styles.css';

const STATUS_LABEL = {
  perdido: 'Perdido',
  encontrado: 'Encontrado',
};

const PAGE_SIZE = 10;
const AUTO_LOAD = 'IntersectionObserver' in window;

function PetCard({ pet, onDelete, onEdit, onOpen }) {
  const [deleting, setDeleting] = useState(false);
  const thumbnailUrl = pet.images?.[0]?.url;

  async function handle_delete(e) {
    e.stopPropagation();
    if (!window.confirm('Excluir esta postagem? Essa ação não pode ser desfeita.')) return;
    setDeleting(true);
    await onDelete(pet.id);
    setDeleting(false);
  }

  function handle_key_down(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      className="feed-card"
      onClick={onOpen}
      onKeyDown={handle_key_down}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes: ${pet.pet_name || 'animal sem nome'}`}
    >
      <div className="feed-card-thumbnail">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={pet.pet_name || 'Foto do animal'}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="feed-card-thumbnail-placeholder" aria-hidden="true">🐾</span>
        )}
      </div>

      <div className="feed-card-body">
        <div className="feed-card-header">
          <span className={`feed-badge feed-badge--${pet.category}`}>
            {STATUS_LABEL[pet.category] ?? pet.category}
          </span>
          {pet.pet_type && <span className="feed-card-type">{pet.pet_type}</span>}
        </div>
        <h3 className="feed-card-name">{pet.pet_name || 'Sem nome informado'}</h3>
        {pet.description && (
          <p className="feed-card-description">{pet.description}</p>
        )}
        {pet.address && (
          <p className="feed-card-address">📍 {pet.address}</p>
        )}
        {pet.date && (
          <p className="feed-card-date">
            {new Date(pet.date).toLocaleDateString('pt-BR')}
          </p>
        )}
        {(onEdit || onDelete) && (
          <div className="feed-card-actions">
            {onEdit && (
              <button
                type="button"
                className="feed-card-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="feed-card-delete-btn"
                onClick={handle_delete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pets, setPets] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [error, setError] = useState('');
  const [myPostsError, setMyPostsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(location.state?.showMyPosts ?? false);
  const [notice, setNotice] = useState(location.state?.notice ?? '');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState('');
  const sentinelRef = useRef(null);

  const slow = useSlowHint(showMyPosts ? myPostsLoading : loading || loadingMore);

  useEffect(() => {
    let cancelled = false;

    async function fetch_pets() {
      try {
        const response = await api.get('/posts', { params: { limit: PAGE_SIZE, page: 1 } });
        if (!cancelled) {
          setPets(response.data.posts);
          setHasNext(response.data.meta.has_next);
          setTotalPosts(response.data.meta.total_posts);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Erro ao carregar os relatos.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch_pets();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showMyPosts) return undefined;
    let cancelled = false;

    async function fetch_my_pets() {
      setMyPostsLoading(true);
      setMyPostsError('');
      try {
        const response = await api.get('/me/posts');
        if (!cancelled) setMyPets(response.data.posts);
      } catch (err) {
        if (!cancelled) setMyPostsError(getErrorMessage(err, 'Erro ao carregar suas postagens.'));
      } finally {
        if (!cancelled) setMyPostsLoading(false);
      }
    }

    fetch_my_pets();
    return () => {
      cancelled = true;
    };
  }, [showMyPosts]);

  const load_more = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    setLoadMoreError('');
    try {
      const response = await api.get('/posts', { params: { limit: PAGE_SIZE, page: nextPage } });
      setPets((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...response.data.posts.filter((p) => !ids.has(p.id))];
      });
      setPage(nextPage);
      setHasNext(response.data.meta.has_next);
      setTotalPosts(response.data.meta.total_posts);
    } catch (err) {
      setLoadMoreError(getErrorMessage(err, 'Erro ao carregar mais relatos.'));
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  const showFooter = !showMyPosts && !loading && !error && pets.length > 0;
  const canAutoLoad = AUTO_LOAD && showFooter && hasNext && !loadingMore && !loadMoreError;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!canAutoLoad || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          load_more();
        }
      },
      { rootMargin: '0px 0px 600px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canAutoLoad, load_more]);

  async function handle_delete(petId) {
    try {
      await api.delete(`/me/posts/${petId}`);
      setMyPets((prev) => prev.filter((p) => p.id !== petId));
      setPets((prev) => prev.filter((p) => p.id !== petId));
      setTotalPosts((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setMyPostsError(getErrorMessage(err, 'Erro ao excluir a postagem.'));
    }
  }

  function show_list(mine) {
    setShowMyPosts(mine);
    window.scrollTo({ top: 0 });
  }

  const list = showMyPosts ? myPets : pets;
  const isLoading = showMyPosts ? myPostsLoading : loading;
  const listError = showMyPosts ? myPostsError : error;

  return (
    <div className="feed-container">
      <Navbar
        active={showMyPosts ? 'my-posts' : 'feed'}
        onFeed={() => show_list(false)}
        onMyPosts={() => show_list(true)}
      />

      <main className="feed-main">
        <h1 className="feed-title">{showMyPosts ? 'Minhas postagens' : 'Pets reportados'}</h1>

        {notice && (
          <div className="feed-notice" role="status">
            <p>{notice}</p>
            <button
              type="button"
              className="feed-notice-close"
              onClick={() => {
                setNotice('');
                navigate('.', { replace: true, state: { showMyPosts } });
              }}
            >
              Ok
            </button>
          </div>
        )}

        {isLoading && (
          <p className="feed-loading" role="status">
            Carregando...
            {slow && <span className="feed-slow-hint">{SLOW_SERVER_MESSAGE}</span>}
          </p>
        )}
        {listError && <p className="feed-error" role="alert">{listError}</p>}

        {!isLoading && !listError && list.length === 0 && (
          <div className="feed-empty">
            <p>
              {showMyPosts
                ? 'Você ainda não fez nenhuma postagem.'
                : 'Nenhum pet reportado ainda.'}
            </p>
            <button
              type="button"
              className="feed-empty-btn"
              onClick={() => navigate('/create-post')}
            >
              Criar uma postagem
            </button>
          </div>
        )}

        <div className="feed-grid">
          {list.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onDelete={showMyPosts ? handle_delete : null}
              onEdit={showMyPosts ? () => navigate(`/posts/${pet.id}/edit`) : null}
              onOpen={() => navigate(`/posts/${pet.id}`)}
            />
          ))}
        </div>

        {showFooter && hasNext && (
          <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
        )}

        {showFooter && (
          <div className="feed-more">
            {hasNext ? (
              <>
                <p className="feed-more-count" role="status">
                  {loadingMore
                    ? 'Carregando mais relatos...'
                    : `Exibindo ${pets.length} de ${totalPosts} relatos`}
                </p>
                {loadMoreError && <p className="feed-error" role="alert">{loadMoreError}</p>}
                {(loadMoreError || !AUTO_LOAD) && (
                  <button
                    type="button"
                    className="feed-more-btn"
                    onClick={load_more}
                    disabled={loadingMore}
                  >
                    {loadMoreError ? 'Tentar novamente' : 'Carregar mais'}
                  </button>
                )}
                {slow && loadingMore && <p className="feed-slow-hint">{SLOW_SERVER_MESSAGE}</p>}
              </>
            ) : (
              <p className="feed-more-count">Não há mais relatos para mostrar.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
