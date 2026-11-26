import { useEffect, useState } from 'react';

export function useSlowHint(loading, delay = 5000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setSlow(true), delay);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [loading, delay]);

  return loading && slow;
}

export const SLOW_SERVER_MESSAGE =
  'O servidor está iniciando (plano gratuito) e pode levar até 1 minuto na primeira vez. Aguarde…';
