export function getFieldErrors(err) {
  const details = err?.response?.data?.details;
  if (!details || typeof details !== 'object') return {};

  const errors = {};
  for (const [field, messages] of Object.entries(details)) {
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (typeof message === 'string') errors[field] = message;
  }
  return errors;
}

export function getErrorMessage(err, fallback = 'Algo deu errado. Tente novamente.') {
  const data = err?.response?.data;
  const fieldMessage = Object.values(getFieldErrors(err))[0];
  if (fieldMessage) return fieldMessage;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (err?.request && !err?.response) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  }

  return fallback;
}
