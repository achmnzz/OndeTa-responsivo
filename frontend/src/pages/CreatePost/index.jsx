import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import LocationPicker from '../../components/LocationPicker';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { getErrorMessage } from '../../services/apiErrors';
import { reverseGeocode } from '../../services/geocoding';
import { compressImage } from '../../utils/compressImage';
import './styles.css';

const PET_TYPES = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
];

const CATEGORIES = [
  { value: 'perdido', label: '🔍 Perdi um animal', short: 'Perdido' },
  { value: 'encontrado', label: '🐾 Encontrei um animal', short: 'Encontrado' },
];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const ADDRESS_MIN = 5;

export default function CreatePost() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ coords: null, address: '' });
  const [locationError, setLocationError] = useState('');

  const [existingImages, setExistingImages] = useState([]);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;

    async function load_post() {
      try {
        const { data } = await api.get(`/posts/${id}`);
        if (cancelled) return;

        if (data.author?.id !== user?.id) {
          setLoadError('Você só pode editar as suas próprias postagens.');
          return;
        }

        setCategory(data.category);
        setPetName(data.pet_name ?? '');
        setPetType(data.pet_type ?? '');
        setDescription(data.description ?? '');
        setExistingImages(data.images ?? []);
        setLocation({
          coords: { latitude: data.latitude, longitude: data.longitude },
          address: data.address ?? '',
        });

        if (!data.address) {
          reverseGeocode(data.latitude, data.longitude)
            .then((address) => {
              if (!cancelled && address) {
                setLocation((prev) => (prev.address ? prev : { ...prev, address }));
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Não foi possível carregar a postagem.'));
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    load_post();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, user?.id]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  async function handlePhotoChange(e) {
    const original = e.target.files?.[0] ?? null;
    setPhotoError('');
    if (!original) return;

    setPhotoProcessing(true);
    const file = await compressImage(original);
    setPhotoProcessing(false);

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext)) {
      setPhotoError('Formato de foto não suportado. Use uma foto JPG, PNG ou WEBP.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('A foto é grande demais (máximo 5 MB). Escolha outra foto.');
      e.target.value = '';
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    if (photoFile) {
      setPhotoFile(null);
      setPhotoPreview('');
    } else {
      setRemoveExistingPhoto(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleLocationChange(next) {
    setLocation(next);
    setLocationError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (!location.coords) {
      setLocationError('Informe o local: use sua localização atual ou digite o endereço.');
      return;
    }

    const address = location.address.trim();
    if (address.length < ADDRESS_MIN) {
      setLocationError(
        address
          ? 'Endereço muito curto. Informe rua, número, bairro e cidade.'
          : 'Informe o endereço do local (rua, número, bairro e cidade).'
      );
      document.getElementById('post-address')?.focus();
      return;
    }

    const payload = {
      pet_name: petName.trim() || null,
      pet_type: petType,
      category,
      description: description.trim() || null,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
    };

    setSubmitting(true);
    try {
      let postId = id;
      if (isEdit) {
        await api.patch(`/me/posts/${id}`, payload);
      } else {
        const response = await api.post('/posts', payload);
        postId = response.data.id;
      }

      let photoNotice = '';
      try {
        if (isEdit && (removeExistingPhoto || photoFile)) {
          for (const img of existingImages) {
            await api.delete(`/me/images/${img.id}`);
          }
        }
        if (photoFile) {
          const formData = new FormData();
          formData.append('file', photoFile);
          await api.post(`/me/posts/${postId}/images`, formData, {
            headers: { 'Content-Type': undefined },
          });
        }
      } catch (photoErr) {
        photoNotice =
          'Postagem salva, mas houve um erro com a foto: ' +
          getErrorMessage(photoErr, 'erro desconhecido');
      }

      if (isEdit) {
        navigate(`/posts/${id}`, {
          replace: true,
          state: { notice: photoNotice || 'Postagem atualizada!' },
        });
      } else {
        navigate('/feed', { state: { showMyPosts: true, notice: photoNotice } });
      }
    } catch (err) {
      const addressError = err.response?.data?.details?.address?.[0];
      if (addressError) {
        setLocationError(addressError);
      } else {
        setSubmitError(getErrorMessage(err, isEdit ? 'Erro ao salvar as alterações' : 'Erro ao criar postagem'));
      }
      setSubmitting(false);
    }
  }

  const showExistingPhoto =
    isEdit && existingImages.length > 0 && !removeExistingPhoto && !photoPreview;
  const hasPhoto = Boolean(photoPreview) || showExistingPhoto;

  let title = 'O que aconteceu?';
  if (isEdit) title = 'Editar postagem';
  else if (category === 'perdido') title = 'Perdi um animal';
  else if (category === 'encontrado') title = 'Encontrei um animal';

  return (
    <div className="create-post-container">
      <Navbar active={isEdit ? 'my-posts' : 'create'} />

      <main className="create-post-main">
        <div className="create-post-card">
          <h1 className="create-post-title">{title}</h1>

          {isEdit && loadingPost && <p className="create-post-status" role="status">Carregando...</p>}

          {loadError && (
            <div className="create-post-load-error">
              <p className="create-post-error" role="alert">{loadError}</p>
              <button
                type="button"
                className="create-post-secondary-btn"
                onClick={() => navigate('/feed', { state: { showMyPosts: true } })}
              >
                Ir para Minhas postagens
              </button>
            </div>
          )}

          {!isEdit && !category && (
            <div className="create-post-category-options">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className="create-post-category-btn"
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {category && !loadError && (
            <form onSubmit={handleSubmit} className="create-post-form">
              {isEdit ? (
                <div className="create-post-field">
                  <span className="create-post-label" id="categoria-label">Situação</span>
                  <div className="create-post-segmented" role="group" aria-labelledby="categoria-label">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`create-post-segment ${category === c.value ? 'create-post-segment--active' : ''}`}
                        aria-pressed={category === c.value}
                        onClick={() => setCategory(c.value)}
                      >
                        {c.short}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="create-post-change-category-btn"
                  onClick={() => setCategory('')}
                >
                  ← Trocar
                </button>
              )}

              <div className="create-post-field">
                <label htmlFor="petName">
                  Nome do animal <span className="create-post-optional">(opcional)</span>
                </label>
                <input
                  id="petName"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Ex: Rex"
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  maxLength={100}
                />
              </div>

              <div className="create-post-field">
                <label htmlFor="petType">Tipo</label>
                <select
                  id="petType"
                  value={petType}
                  onChange={(e) => setPetType(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {PET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="create-post-field">
                <label htmlFor="description">
                  Descrição <span className="create-post-optional">(opcional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Características do animal, local onde foi visto..."
                  rows={4}
                  autoCapitalize="sentences"
                />
              </div>

              <div className="create-post-field">
                <label htmlFor="photo">
                  {hasPhoto ? 'Trocar foto' : 'Foto'} <span className="create-post-optional">(opcional)</span>
                </label>

                {showExistingPhoto && (
                  <img
                    src={existingImages[0].url}
                    alt="Foto atual da postagem"
                    className="create-post-photo-preview"
                  />
                )}
                {photoPreview && (
                  <img src={photoPreview} alt="Pré-visualização da nova foto" className="create-post-photo-preview" />
                )}

                <input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="create-post-file-input"
                />
                {hasPhoto && (
                  <button type="button" className="create-post-remove-photo-btn" onClick={handleRemovePhoto}>
                    Remover foto
                  </button>
                )}
                {photoProcessing && (
                  <p className="create-post-status" role="status">Preparando a foto...</p>
                )}
                {photoError && <p className="create-post-error" role="alert">{photoError}</p>}
              </div>

              <LocationPicker
                value={location}
                onChange={handleLocationChange}
                autoLocate={!isEdit}
                error={locationError}
              />

              {submitError && <p className="create-post-error" role="alert">{submitError}</p>}

              <div className="create-post-actions">
                <button
                  type="submit"
                  className="create-post-submit-btn"
                  disabled={submitting || photoProcessing}
                >
                  {isEdit
                    ? (submitting ? 'Salvando...' : 'Salvar alterações')
                    : (submitting ? 'Publicando...' : 'Publicar postagem')}
                </button>
                {isEdit && (
                  <button
                    type="button"
                    className="create-post-secondary-btn"
                    onClick={() => navigate(`/posts/${id}`, { replace: true })}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
