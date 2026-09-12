export type SystemUser = {
  email: string;
  name: string;
  role: string;
};

export type PatientSummary = {
  code: string;
  name: string;
  dateOfBirth?: string;
  age: number | null;
  active: boolean;
  teamEmails?: string[];
};

export type AttendanceSummary = {
  id: string;
  patientCode: string;
  patientName: string;
  type: string;
  destination: string;
  date: string;
  status: string;
  version: number;
  updatedAt: string;
};

export type BootstrapResult = {
  user: SystemUser;
  users: SystemUser[];
  patients: PatientSummary[];
  attendances: AttendanceSummary[];
  serverTime: string;
};

type RpcResponse<T> = {
  requestId: string;
  ok: boolean;
  result?: T;
  error?: string;
};

function isAppsScriptOrigin(origin: string) {
  if (origin === 'https://script.google.com') return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'));
  } catch {
    return false;
  }
}

const APPS_SCRIPT_URL = String(import.meta.env.VITE_APPS_SCRIPT_URL || '').trim();
export const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
export const backendConfigured = Boolean(APPS_SCRIPT_URL && GOOGLE_CLIENT_ID);

export function callBackend<T>(action: string, idToken: string, payload: unknown = {}): Promise<T> {
  if (!APPS_SCRIPT_URL) return Promise.reject(new Error('A URL do Apps Script ainda não foi configurada.'));

  const requestId = crypto.randomUUID();
  const iframeName = `ortogotardo_rpc_${requestId.replaceAll('-', '')}`;
  const iframe = document.createElement('iframe');
  iframe.name = iframeName;
  iframe.hidden = true;
  iframe.setAttribute('aria-hidden', 'true');

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = APPS_SCRIPT_URL;
  form.target = iframeName;
  form.hidden = true;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'request';
  input.value = JSON.stringify({
    action,
    idToken,
    payload,
    requestId,
    clientOrigin: window.location.origin,
  });
  form.appendChild(input);

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', receive);
      window.clearTimeout(timeout);
      form.remove();
      iframe.remove();
    };

    const receive = (event: MessageEvent<RpcResponse<T>>) => {
      // O HtmlService executa o conteúdo dentro de um iframe adicional do Google.
      // Por isso, event.source não é o iframe criado acima; validamos a origem do
      // serviço e o identificador aleatório exclusivo de cada solicitação.
      if (!isAppsScriptOrigin(event.origin) || !event.data || event.data.requestId !== requestId) return;
      cleanup();
      if (event.data.ok && event.data.result !== undefined) resolve(event.data.result);
      else reject(new Error(event.data.error || 'O serviço não concluiu a solicitação.'));
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('O serviço demorou para responder. Verifique a conexão e tente novamente.'));
    }, 45000);

    window.addEventListener('message', receive);
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}
