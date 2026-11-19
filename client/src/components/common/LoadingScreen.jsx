import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Landmark, Loader2, AlertCircle } from 'lucide-react';
import Button from './Button';

export const LoadingScreen = ({ children }) => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
  const healthUrl = `${socketUrl}/health`;

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const checkServerHealth = async () => {
      try {
        const res = await axios.get(healthUrl, { timeout: 4000 });
        if (res.data?.status === 'ok') {
          if (isMounted) setIsServerReady(true);
          return;
        }
      } catch (err) {
        if (!isMounted) return;
        setAttempt((prev) => prev + 1);
        if (attempt > 30) {
          setErrorMessage('Server connection is taking longer than usual. You can continue or retry.');
        }
      }

      // Schedule next check
      if (isMounted) {
        timer = setTimeout(checkServerHealth, 3000);
      }
    };

    checkServerHealth();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [healthUrl, attempt]);

  if (isServerReady) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-bg p-4 select-none">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center space-y-6 shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
          <Landmark className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Connecting to Server…
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Initializing connection to the municipal grievance network. If the service was idle, it may take 20–45 seconds to wake up.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2.5 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
          <span>Verifying API handshake (attempt {attempt + 1})</span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsServerReady(true)}
            className="w-full text-slate-600"
          >
            Continue anyway
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
