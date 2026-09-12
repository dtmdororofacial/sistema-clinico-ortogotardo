import { useState } from 'react';
import { CheckCircle2, Pencil, Power, ShieldCheck, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { callBackend, type SystemUser } from '@/src/lib/backend';

type Role = 'aluno' | 'professora' | 'coordenacao' | 'admin';

const roleLabels: Record<Role, string> = {
  aluno: 'Aluno',
  professora: 'Professora',
  coordenacao: 'Coordenação',
  admin: 'Administração',
};

const emptyForm = () => ({ email: '', name: '', role: 'aluno' as Role, active: true });

export function UserAccessManager({
  users,
  currentUser,
  idToken,
  demo,
  onRefresh,
}: {
  users: SystemUser[];
  currentUser: SystemUser;
  idToken: string;
  demo: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    if (!name) { setError('Informe o nome completo.'); return; }
    if (!email || !email.includes('@')) { setError('Informe um e-mail válido.'); return; }
    if (email === currentUser.email && (!form.active || form.role !== 'admin')) {
      setError('A conta administrativa em uso não pode perder o próprio acesso.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (demo) {
        setMessage('Demonstração concluída. Nenhum acesso foi alterado.');
      } else {
        await callBackend<SystemUser>('setUserAccess', idToken, { ...form, email, name });
        await onRefresh();
        setMessage(form.active ? 'Acesso salvo na base do sistema.' : 'Acesso desativado na base do sistema.');
      }
      setForm(emptyForm());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const edit = (user: SystemUser) => {
    setForm({ email: user.email, name: user.name, role: user.role as Role, active: true });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deactivate = async (user: SystemUser) => {
    if (user.email === currentUser.email) { setError('A conta administrativa em uso não pode ser desativada.'); return; }
    if (!window.confirm(`Desativar o acesso de ${user.name}?`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (demo) {
        setMessage('Demonstração concluída. Nenhum acesso foi alterado.');
      } else {
        await callBackend<SystemUser>('setUserAccess', idToken, { email: user.email, name: user.name, role: user.role, active: false });
        await onRefresh();
        setMessage(`O acesso de ${user.name} foi desativado.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-[0_16px_45px_rgba(15,44,69,0.07)] ring-1 ring-slate-200">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-[var(--brand-navy)]">Cadastrar ou atualizar usuário</CardTitle>
              <CardDescription>Esta área aparece somente para a administração.</CardDescription>
            </div>
            <UserPlus className="size-5 text-[var(--brand-blue)]" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo *"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="E-mail Google *"><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Função">
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                {(Object.keys(roleLabels) as Role[]).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="size-4 accent-[var(--brand-blue)]" />
              Acesso ativo
            </label>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            Enquanto o OAuth estiver no modo “Testando”, o e-mail também precisa ser incluído em Público-alvo → Usuários de teste no Google Cloud.
          </div>
          {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}
          {message ? <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="size-4" />{message}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={submit} className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-navy)]"><ShieldCheck className="size-4" />{busy ? 'Salvando…' : 'Salvar acesso'}</Button>
            <Button variant="outline" disabled={busy} onClick={() => { setForm(emptyForm()); setError(''); setMessage(''); }}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--brand-navy)]">Usuários ativos</h2>
            <p className="mt-1 text-xs text-slate-500">{users.length} usuário(s) com acesso à base clínica.</p>
          </div>
          <Badge variant="outline">Controle administrativo</Badge>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {users.map((user) => (
            <div key={user.email} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="mt-1 text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{roleLabels[user.role as Role] || user.role}</Badge>
                {user.email === currentUser.email ? <span className="text-xs text-slate-500">Conta em uso</span> : <>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => edit(user)}><Pencil className="size-3.5" />Editar</Button>
                  <Button size="sm" variant="outline" disabled={busy} className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => deactivate(user)}><Power className="size-3.5" />Desativar</Button>
                </>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}
