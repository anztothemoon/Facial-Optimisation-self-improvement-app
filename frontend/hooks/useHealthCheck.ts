import { useEffect, useState } from 'react';
import { fetchHealth } from '../services/api';

/** Example hook — pings backend /health when mounted */
export function useHealthCheck() {
  const [status, setStatus] = useState<string>('idle');
  useEffect(() => {
    fetchHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('offline'));
  }, []);
  return status;
}
