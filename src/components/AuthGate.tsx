import { useEffect, useRef, useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { callBackend, backendConfigured, GOOGLE_CLIENT_ID, type BootstrapResult } from '@/src/lib/backend';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export type AppSession = {
  idToken: string;
  bootstrap: BootstrapResult;
  demo: boolean;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const demoBootstrap: BootstrapResult = {
  user: { email: 'modo.demonstracao@local', name: 'Modo de demonstração', role: 'admin' },
  users: [
    { email: 'aluno1@exemplo.com', name: 'Aluno demonstrativo 1', role: 'aluno' },
    { email: 'aluno2@exemplo.com', name: 'Aluno demonstrativo 2', role: 'aluno' },
  ],
  patients: [],
  attendances: [],
  serverTime: new Date().toISOString(),
};

export function AuthGate({ children }: { children: (session: AppSession) => React.ReactNode }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [idToken, setIdToken] = useState(() => sessionStorage.getItem('ortogotardo_id_token') || '');
  const [bootstrap, setBootstrap] = useState<BootstrapResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(idToken));

  const refresh = async (token = idToken) => {
    if (!token) return;
    setBootstrap(await callBackend<BootstrapResult>('bootstrap', token));
  };

  const signOut = () => {
    sessionStorage.removeItem('ortogotardo_id_token');
    window.google?.accounts.id.disableAutoSelect();
    setIdToken('');
    setBootstrap(null);
    setError('');
  };

  useEffect(() => {
    if (!backendConfigured || !idToken) return;
    void callBackend<BootstrapResult>('bootstrap', idToken).then((result) => setBootstrap(result)).catch((cause) => {
      sessionStorage.removeItem('ortogotardo_id_token');
      setIdToken('');
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => setLoading(false));
  }, [idToken]);

  useEffect(() => {
    if (!backendConfigured || idToken || !buttonRef.current) return;
    const element = buttonRef.current;
    const render = () => {
      if (!window.google) return false;
      element.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          setError('');
          setLoading(true);
          callBackend<BootstrapResult>('bootstrap', credential)
            .then((result) => {
              sessionStorage.setItem('ortogotardo_id_token', credential);
              setIdToken(credential);
              setBootstrap(result);
            })
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))
            .finally(() => setLoading(false));
        },
      });
      window.google.accounts.id.renderButton(element, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'pt-BR', width: 280 });
      return true;
    };
    if (render()) return;
    const interval = window.setInterval(() => render() && window.clearInterval(interval), 200);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 10000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [idToken]);

  if (!backendConfigured && import.meta.env.DEV) {
    return children({ idToken: '', bootstrap: demoBootstrap, demo: true, signOut: () => undefined, refresh: async () => undefined });
  }

  if (!backendConfigured) {
    return (
      <AccessShell>
        <ShieldCheck className="mx-auto size-9 text-[var(--brand-blue)]" />
        <h1 className="mt-4 text-xl font-semibold text-[var(--brand-navy)]">Configuração administrativa pendente</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">O site está publicado, mas ainda precisa receber o Client ID do Google e a URL do Apps Script antes de aceitar dados clínicos.</p>
      </AccessShell>
    );
  }

  if (loading) return <AccessShell><p className="text-sm text-slate-600">Validando acesso seguro…</p></AccessShell>;

  if (idToken && bootstrap) return children({ idToken, bootstrap, demo: false, signOut, refresh: () => refresh(idToken) });

  return (
    <AccessShell>
      <LogIn className="mx-auto size-9 text-[var(--brand-blue)]" />
      <h1 className="mt-4 text-xl font-semibold text-[var(--brand-navy)]">Entrar no sistema clínico</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Use uma Conta Google previamente autorizada pela administração do curso.</p>
      <div ref={buttonRef} className="mt-6 flex min-h-11 justify-center" />
      {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}
      <a href={`${import.meta.env.BASE_URL}privacidade.html`} target="_blank" rel="noreferrer" className="mt-4 block text-xs text-[var(--brand-blue)] underline-offset-4 hover:underline">Aviso de privacidade</a>
      <Button variant="ghost" className="mt-3 text-xs" onClick={() => window.location.reload()}>Tentar novamente</Button>
    </AccessShell>
  );
}

function AccessShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page)] px-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,44,69,0.12)]">
        <img src={`${import.meta.env.BASE_URL}brand/ortogotardo.png`} alt="Ortogotardo" className="mx-auto h-auto w-52" />
        <div className="my-7 h-px bg-slate-100" />
        {children}
      </section>
    </main>
  );
}
