import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, ClipboardPlus, FileClock, Home, LockKeyhole, LogOut, RotateCcw, Save, ShieldCheck, Stethoscope, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AuthGate, type AppSession } from '@/src/components/AuthGate';
import { ComplaintForm, emptyComplaint, type Complaint } from '@/src/components/ComplaintForm';
import { InstrumentForm, conditionalQuestions, type Answers } from '@/src/components/InstrumentForm';
import { PainMap, type PainPoint } from '@/src/components/PainMap';
import { PhysicalExamForm, type ExamMode } from '@/src/components/PhysicalExamForm';
import { PlanForm } from '@/src/components/PlanForm';
import { ReturnForm } from '@/src/components/ReturnForm';
import { ReviewForm } from '@/src/components/ReviewForm';
import { anamnesisSections, combinedAnamnesisSections, combinedStabSections, dctmdSymptomSections, gcpsSection, stabSections } from '@/src/domain/instruments';
import { callBackend, type AttendanceSummary, type PatientSummary } from '@/src/lib/backend';
import { calculateAge, calculateCpi, triageDestination, type TriageDestination } from '@/src/lib/clinical';
import { renderPainMapImage } from '@/src/lib/pain-map-image';
import { buildDocuments } from '@/src/lib/reports';

type Screen = 'triage' | 'anamnese' | 'exame' | 'plano' | 'revisao' | 'retorno' | 'patients' | 'drafts';
type ClinicalScreen = Exclude<Screen, 'patients' | 'drafts'>;
type TriageAnswer = 'sim' | 'nao' | null;
type TeamMember = { name: string; email: string };
type SaveResult = { patientCode: string; attendanceId: string; version: number; status: string; files?: Array<{ id: string; name: string; url: string }> };
type StoredPayload = {
  type?: string;
  attendanceDate?: string;
  patient: { code: string; name: string; dateOfBirth: string; teamEmails: string[] };
  studentNames?: string[];
  triage?: { painLast30Days?: TriageAnswer; jointLast30Days?: TriageAnswer; bruxismLast30Days?: TriageAnswer };
  complaints?: Complaint[];
  painPoints?: PainPoint[];
  answers?: Answers;
  examMode?: ExamMode;
  consentConfirmed?: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyMember = (): TeamMember => ({ name: '', email: '' });
const workflow: Array<{ id: Exclude<ClinicalScreen, 'retorno'>; label: string }> = [
  { id: 'triage', label: 'Triagem' }, { id: 'anamnese', label: 'Anamnese' }, { id: 'exame', label: 'Exame físico' }, { id: 'plano', label: 'Avaliação e plano' }, { id: 'revisao', label: 'Revisão' },
];
const navigation = [
  { id: 'patients', label: 'Início e pacientes', icon: Home }, { id: 'triage', label: 'Novo atendimento', icon: ClipboardPlus }, { id: 'retorno', label: 'Novo retorno', icon: RotateCcw }, { id: 'drafts', label: 'Atendimentos', icon: FileClock },
] as const;

export default function App() {
  return <AuthGate>{(session) => <ClinicalApp session={session} />}</AuthGate>;
}

function ClinicalApp({ session }: { session: AppSession }) {
  const [screen, setScreen] = useState<Screen>('patients');
  const [patientCode, setPatientCode] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [attendanceId, setAttendanceId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [students, setStudents] = useState<TeamMember[]>(() => session.bootstrap.user.role === 'aluno' ? [{ name: session.bootstrap.user.name, email: session.bootstrap.user.email }, emptyMember()] : [emptyMember(), emptyMember()]);
  const [painAnswer, setPainAnswer] = useState<TriageAnswer>(null);
  const [jointAnswer, setJointAnswer] = useState<TriageAnswer>(null);
  const [bruxismAnswer, setBruxismAnswer] = useState<TriageAnswer>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([emptyComplaint()]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [examMode, setExamMode] = useState<ExamMode>('dtm');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState(session.demo ? 'Modo de demonstração — nenhum dado será enviado' : 'Alterações ainda não enviadas');
  const [busy, setBusy] = useState(false);
  const [lockedBy, setLockedBy] = useState('');
  const [finalFiles, setFinalFiles] = useState<SaveResult['files']>([]);

  const destination = triageDestination(painAnswer, jointAnswer, bruxismAnswer);
  const triageComplete = painAnswer !== null && jointAnswer !== null && bruxismAnswer !== null;
  const age = calculateAge(dateOfBirth);
  const cpi = calculateCpi(answers);
  const hasPainComplaint = complaints.some((complaint) => complaint.painful);
  const currentStep = workflow.findIndex((step) => step.id === screen);
  const authorizedStudents = session.bootstrap.users.filter((user) => user.role === 'aluno');

  useEffect(() => {
    if (!attendanceId || session.demo) return;
    const renew = () => callBackend<{ acquired: boolean; lockedBy?: string }>('acquireLock', session.idToken, { attendanceId }).then((result) => setLockedBy(result.acquired ? '' : result.lockedBy || 'outro usuário')).catch(() => undefined);
    void renew();
    const interval = window.setInterval(renew, 60000);
    return () => window.clearInterval(interval);
  }, [attendanceId, session.demo, session.idToken]);

  const updateAnswer = (id: string, value: string | number | string[]) => {
    setAnswers((current) => {
      const next = { ...current, [id]: value };
      Object.entries(conditionalQuestions).forEach(([childId, condition]) => { if (condition.dependsOn === id && value !== condition.value) delete next[childId]; });
      if (id === 'followUp' && value !== 'Retorno agendado') delete next.followUpDate;
      return next;
    });
    setStatus('Alterações ainda não enviadas');
  };
  const goTo = (next: Screen) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setScreen(next); };
  const reset = () => {
    setPatientCode(''); setPatientName(''); setDateOfBirth(''); setAttendanceId(''); setAttendanceDate(today());
    setStudents(session.bootstrap.user.role === 'aluno' ? [{ name: session.bootstrap.user.name, email: session.bootstrap.user.email }, emptyMember()] : [emptyMember(), emptyMember()]); setPainAnswer(null); setJointAnswer(null); setBruxismAnswer(null); setComplaints([emptyComplaint()]);
    setPainPoints([]); setAnswers({}); setConsent(false); setLockedBy(''); setFinalFiles([]);
  };
  const startNew = () => { reset(); goTo('triage'); };

  const selectPatient = (patient: PatientSummary) => {
    reset(); setPatientCode(patient.code); setPatientName(patient.name); setDateOfBirth(patient.dateOfBirth || '');
    const team = (patient.teamEmails || []).map((email) => ({ email, name: session.bootstrap.users.find((user) => user.email === email)?.name || email }));
    if (team.length >= 2) setStudents(team.slice(0, 3));
    setAnswers({ returnDate: today() });
    goTo('retorno');
  };

  const next = () => {
    if (screen === 'triage' && destination) { setExamMode(destination); goTo('anamnese'); }
    else if (screen === 'anamnese') goTo('exame'); else if (screen === 'exame') goTo('plano'); else if (screen === 'plano') goTo('revisao');
  };
  const back = () => {
    if (screen === 'anamnese') goTo('triage'); else if (screen === 'exame') goTo('anamnese'); else if (screen === 'plano') goTo('exame'); else if (screen === 'revisao') goTo('plano');
  };

  const buildPayload = async (type: 'INICIAL' | 'RETORNO') => {
    const team = students.filter((student) => student.name.trim() && student.email.trim());
    const painMapImage = type === 'INICIAL' && hasPainComplaint ? await renderPainMapImage(painPoints) : '';
    return {
      attendanceId, type, destination: type === 'RETORNO' ? 'retorno' : destination,
      attendanceDate: type === 'RETORNO' ? String(answers.returnDate || attendanceDate) : attendanceDate,
      patient: { code: patientCode, name: patientName, dateOfBirth, teamEmails: team.map((student) => student.email.trim().toLowerCase()) },
      studentNames: team.map((student) => student.name.trim()), triage: { painLast30Days: painAnswer, jointLast30Days: jointAnswer, bruxismLast30Days: bruxismAnswer },
      complaints, painPoints: hasPainComplaint ? painPoints : [], painMapImage, answers, examMode,
      results: { cpi, stabDomains: destination === 'bruxismo' || destination === 'combinado' ? (destination === 'combinado' ? combinedStabSections : stabSections).map((section) => ({ domain: section.title, findings: section.questions.filter((question) => answers[question.id] !== undefined && answers[question.id] !== '').map((question) => ({ label: question.label, value: answers[question.id] })) })) : [] },
      consentConfirmed: consent,
      documents: buildDocuments({ type, destination, examMode, complaints, painPoints: hasPainComplaint ? painPoints : [], answers }),
    };
  };

  const validate = (type: 'INICIAL' | 'RETORNO', finalize: boolean) => {
    if (!patientName.trim()) return 'Informe o paciente.';
    if (!dateOfBirth) return 'A data de nascimento é necessária para calcular a idade.';
    if (type === 'INICIAL' && !triageComplete) return 'Responda às três perguntas de direcionamento.';
    if (type === 'INICIAL' && !destination) return 'As respostas não indicaram ficha de DTM nem preenchimento do STAB.';
    if (students.filter((student) => student.name.trim() && /@/.test(student.email)).length < 2) return 'Vincule pelo menos dois alunos autorizados.';
    if (finalize && !consent) return 'Confirme que a autorização necessária foi obtida.';
    return '';
  };

  const save = async (finalize: boolean, type: 'INICIAL' | 'RETORNO') => {
    const issue = validate(type, finalize); if (issue) { setStatus(issue); return; }
    setBusy(true); setStatus(finalize ? 'Finalizando e gerando PDFs…' : 'Salvando rascunho…');
    try {
      const payload = await buildPayload(type);
      if (session.demo) {
        localStorage.setItem('ortogotardo_demo_draft', JSON.stringify(payload));
        setStatus(finalize ? 'Demonstração concluída — nenhum dado clínico foi enviado' : 'Rascunho salvo somente neste navegador'); return;
      }
      const result = await callBackend<SaveResult>(finalize ? 'finalize' : 'saveDraft', session.idToken, payload);
      setPatientCode(result.patientCode); setAttendanceId(result.attendanceId); setFinalFiles(result.files || []);
      setStatus(finalize ? `Prontuário finalizado — versão ${result.version}` : `Rascunho salvo no Drive — versão ${result.version}`);
      if (!finalize) await callBackend('acquireLock', session.idToken, { attendanceId: result.attendanceId });
      await session.refresh();
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  };

  const loadAttendance = async (id: string, correction = false) => {
    if (session.demo) return; setBusy(true); setStatus('Abrindo atendimento…');
    try {
      let result: { attendance: Record<string, unknown>; payload: StoredPayload };
      if (correction) result = await callBackend('startCorrection', session.idToken, { attendanceId: id });
      else {
        const lock = await callBackend<{ acquired: boolean; lockedBy?: string }>('acquireLock', session.idToken, { attendanceId: id });
        if (!lock.acquired) { setLockedBy(lock.lockedBy || 'outro usuário'); setStatus(`Somente leitura: edição em uso por ${lock.lockedBy || 'outro usuário'}.`); return; }
        result = await callBackend('getAttendance', session.idToken, { attendanceId: id });
      }
      const payload = result.payload; setAttendanceId(id); setPatientCode(payload.patient.code); setPatientName(payload.patient.name); setDateOfBirth(payload.patient.dateOfBirth); setAttendanceDate(payload.attendanceDate || today());
      setStudents((payload.studentNames || []).map((name: string, index: number) => ({ name, email: payload.patient.teamEmails[index] || '' })));
      setPainAnswer(payload.triage?.painLast30Days || null); setJointAnswer(payload.triage?.jointLast30Days || null); setBruxismAnswer(payload.triage?.bruxismLast30Days || null); setComplaints(payload.complaints || [emptyComplaint()]); setPainPoints(payload.painPoints || []); setAnswers(payload.answers || {}); setExamMode(payload.examMode || 'dtm'); setConsent(correction ? false : Boolean(payload.consentConfirmed)); setLockedBy('');
      goTo(payload.type === 'RETORNO' ? 'retorno' : 'triage'); setStatus('Atendimento aberto para edição');
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  };

  const title = useMemo(() => {
    if (screen === 'patients') return 'Pacientes'; if (screen === 'drafts') return 'Atendimentos'; if (screen === 'triage') return 'Triagem clínica';
    if (screen === 'anamnese') return destination === 'dtm' ? 'Anamnese de DTM' : destination === 'bruxismo' ? 'Avaliação de bruxismo — STAB' : 'Anamnese de DTM + STAB'; if (screen === 'exame') return 'Exame físico';
    if (screen === 'plano') return destination === 'dtm' ? 'Diagnóstico e plano' : destination === 'bruxismo' ? 'Avaliação e plano' : 'Diagnóstico, avaliação e plano'; if (screen === 'retorno') return 'Ficha de retorno'; return 'Revisão e finalização';
  }, [destination, screen]);
  const clinical = !['patients', 'drafts'].includes(screen);

  return <div className="min-h-screen bg-[var(--page)] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur"><div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-5"><img src={`${import.meta.env.BASE_URL}brand/ortogotardo.png`} alt="Ortogotardo" className="h-10 w-auto sm:h-11" /><div className="hidden h-9 w-px bg-slate-200 md:block" /><div className="hidden md:block"><p className="text-sm font-semibold text-slate-800">Prontuário clínico</p><p className="text-xs text-slate-500">DTM e avaliação de bruxismo</p></div></div><div className="flex items-center gap-3">{session.demo ? <Badge variant="outline" className="hidden border-amber-200 bg-amber-50 text-amber-800 sm:inline-flex">Demonstração local</Badge> : null}<div className="hidden text-right sm:block"><p className="text-xs font-medium text-slate-700">{session.bootstrap.user.name}</p><p className="text-xs text-slate-500">{session.bootstrap.user.email}</p></div>{!session.demo ? <Button size="icon-sm" variant="ghost" aria-label="Sair" onClick={session.signOut}><LogOut className="size-4" /></Button> : <span className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-blue)] text-sm font-bold text-white">SO</span>}</div></div></header>
    <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[244px_minmax(0,1fr)]"><Sidebar screen={screen} onNavigate={(id) => id === 'triage' ? startNew() : id === 'retorno' ? (reset(), goTo('retorno')) : goTo(id)} /><main className="min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-9"><div className="mx-auto max-w-5xl">{clinical && screen !== 'retorno' ? <Workflow current={currentStep} /> : null}<PageHeading title={title} screen={screen} lockedBy={lockedBy} />
      {screen === 'patients' ? <PatientsScreen patients={session.bootstrap.patients} onNew={startNew} onReturn={selectPatient} /> : null}
      {screen === 'drafts' ? <AttendancesScreen attendances={session.bootstrap.attendances} onOpen={loadAttendance} busy={busy} /> : null}
      {screen === 'triage' ? <TriageScreen patientName={patientName} dateOfBirth={dateOfBirth} age={age} attendanceDate={attendanceDate} students={students} users={authorizedStudents} painAnswer={painAnswer} jointAnswer={jointAnswer} bruxismAnswer={bruxismAnswer} triageComplete={triageComplete} destination={destination} onPatientName={setPatientName} onDateOfBirth={setDateOfBirth} onAttendanceDate={setAttendanceDate} onStudents={setStudents} onPainAnswer={setPainAnswer} onJointAnswer={setJointAnswer} onBruxismAnswer={setBruxismAnswer} /> : null}
      {screen === 'anamnese' && destination ? <div className="space-y-6"><ComplaintForm complaints={complaints} onChange={setComplaints} />{hasPainComplaint ? <PainMap points={painPoints} onChange={setPainPoints} /> : null}<InstrumentForm sections={destination === 'dtm' ? [...dctmdSymptomSections, gcpsSection, ...anamnesisSections] : destination === 'bruxismo' ? [...stabSections, ...anamnesisSections] : [...dctmdSymptomSections, gcpsSection, ...combinedStabSections, ...combinedAnamnesisSections]} answers={answers} onChange={updateAnswer} />{destination !== 'bruxismo' && cpi !== null ? <div className="rounded-2xl bg-[var(--brand-blue)] p-5 text-white"><p className="text-xs uppercase tracking-[0.1em] text-blue-100">Resultado calculado</p><p className="mt-1 text-2xl font-bold">Intensidade característica da dor: {cpi}/100</p><p className="mt-1 text-xs text-blue-100">Itens 2, 3 e 4; não representa o grau completo de incapacidade.</p></div> : null}</div> : null}
      {screen === 'exame' ? <PhysicalExamForm mode={examMode} onModeChange={setExamMode} answers={answers} onChange={updateAnswer} /> : null}
      {screen === 'plano' && destination ? <PlanForm destination={destination} values={answers} onChange={updateAnswer} /> : null}
      {screen === 'retorno' ? <div className="space-y-5"><PatientPicker patients={session.bootstrap.patients} selectedCode={patientCode} onSelect={selectPatient} />{patientCode ? <><ReturnForm values={answers} onChange={updateAnswer} /><ConsentBox value={consent} onChange={setConsent} /></> : null}</div> : null}
      {screen === 'revisao' && destination ? <ReviewForm patientName={patientName} age={age} destination={destination} complaints={complaints} painPoints={painPoints} values={answers} consent={consent} onConsentChange={setConsent} /> : null}
      {finalFiles?.length ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">PDFs gerados no Drive</p><div className="mt-3 flex flex-wrap gap-2">{finalFiles.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">{file.name}</a>)}</div></div> : null}
      {clinical ? <ActionBar screen={screen as ClinicalScreen} destination={destination} patientReady={Boolean(patientName && dateOfBirth)} consent={consent} busy={busy} locked={Boolean(lockedBy)} status={status} onBack={back} onSave={() => save(false, screen === 'retorno' ? 'RETORNO' : 'INICIAL')} onNext={next} onFinalize={() => save(true, screen === 'retorno' ? 'RETORNO' : 'INICIAL')} /> : <p className="mt-7 text-xs text-slate-500"><Save className="mr-1 inline size-4" /> {status}</p>}
    </div></main></div>
  </div>;
}

function Sidebar({ screen, onNavigate }: { screen: Screen; onNavigate: (id: Screen) => void }) {
  return <aside className="hidden min-h-[calc(100vh-5rem)] border-r border-slate-200 bg-white px-4 py-7 lg:block"><nav className="space-y-1">{navigation.map(({ id, label, icon: Icon }) => { const active = id === screen || (id === 'triage' && workflow.some((step) => step.id === screen)); return <button key={id} type="button" onClick={() => onNavigate(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${active ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="size-[18px]" />{label}</button>; })}</nav><div className="mt-9 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-[var(--brand-blue)]"><ShieldCheck className="size-4" /><p className="text-xs font-bold uppercase tracking-[0.08em]">Acesso protegido</p></div><p className="mt-2 text-xs leading-5 text-slate-600">A edição simultânea é bloqueada somente para o mesmo atendimento.</p></div><img src={`${import.meta.env.BASE_URL}brand/juliana-stuginski-barbosa.png`} alt="Juliana Stuginski Barbosa Dor Orofacial" className="mx-auto mt-9 h-auto w-40 opacity-90" /></aside>;
}
function Workflow({ current }: { current: number }) { return <ol className="mb-7 grid grid-cols-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">{workflow.map((step, index) => <li key={step.id} className={`border-r px-2 py-3 text-center text-[10px] font-semibold last:border-r-0 sm:text-xs ${index === current ? 'bg-[var(--brand-blue)] text-white' : index < current ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]' : 'text-slate-400'}`}><span className="hidden sm:inline">{index + 1}. </span>{step.label}</li>)}</ol>; }
function PageHeading({ title, screen, lockedBy }: { title: string; screen: Screen; lockedBy: string }) { const clinical = !['patients', 'drafts'].includes(screen); return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-orange)]"><Stethoscope className="size-4" />Sistema clínico</div><h1 className="font-heading text-3xl font-semibold tracking-[-0.025em] text-[var(--brand-navy)] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{screen === 'triage' ? 'As respostas dos últimos 30 dias definem o caminho inicial.' : screen === 'retorno' ? 'Novo registro longitudinal com todo o conteúdo deste retorno.' : clinical ? 'Preencha apenas o que foi avaliado.' : 'A lista respeita os vínculos de acesso de cada usuário.'}</p></div>{clinical ? <div className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="size-4 text-[var(--brand-blue)]" />{lockedBy ? `Somente leitura: ${lockedBy}` : 'Atendimento reservado para edição'}</div> : null}</div>; }

function PatientsScreen({ patients, onNew, onReturn }: { patients: PatientSummary[]; onNew: () => void; onReturn: (patient: PatientSummary) => void }) { return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><button type="button" onClick={onNew} className="rounded-2xl border border-[var(--brand-blue)]/20 bg-[var(--brand-blue-soft)] p-5 text-left"><ClipboardPlus className="size-5 text-[var(--brand-blue)]" /><p className="mt-3 text-sm font-semibold text-[var(--brand-navy)]">Novo atendimento inicial</p></button><div className="rounded-2xl border border-slate-200 bg-white p-5"><Users className="size-5 text-[var(--brand-orange)]" /><p className="mt-3 text-sm font-semibold text-[var(--brand-navy)]">{patients.length} paciente(s) disponível(is)</p></div></div>{patients.length ? <div className="grid gap-3">{patients.map((patient) => <div key={patient.code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><p className="text-sm font-semibold">{patient.name}</p><p className="mt-1 text-xs text-slate-500">{patient.code} · {patient.age ?? '—'} anos</p></div><Button variant="outline" onClick={() => onReturn(patient)}><RotateCcw className="size-4" />Novo retorno</Button></div>)}</div> : <Empty text="Nenhum paciente vinculado a este usuário." />}</div>; }
function AttendancesScreen({ attendances, onOpen, busy }: { attendances: AttendanceSummary[]; onOpen: (id: string, correction?: boolean) => void; busy: boolean }) { return attendances.length ? <div className="grid gap-3">{attendances.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><div className="flex items-center gap-2"><p className="text-sm font-semibold">{item.patientName}</p><Badge variant="outline">{item.status}</Badge></div><p className="mt-1 text-xs text-slate-500">{item.date} · {item.type} · versão {item.version}</p></div><Button variant="outline" disabled={busy} onClick={() => onOpen(item.id, item.status === 'FINALIZADO')}>{item.status === 'FINALIZADO' ? 'Iniciar correção' : 'Retomar'}</Button></div>)}</div> : <Empty text="Nenhum atendimento disponível." />; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">{text}</div>; }
function PatientPicker({ patients, selectedCode, onSelect }: { patients: PatientSummary[]; selectedCode: string; onSelect: (patient: PatientSummary) => void }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-semibold text-[var(--brand-navy)]">Paciente do retorno</h3><select value={selectedCode} onChange={(event) => { const patient = patients.find((item) => item.code === event.target.value); if (patient) onSelect(patient); }} className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="">Selecione um paciente vinculado</option>{patients.map((patient) => <option key={patient.code} value={patient.code}>{patient.name} — {patient.code}</option>)}</select></section>; }
function ConsentBox({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) { return <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-5 ${value ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-emerald-700" /><span className="text-xs leading-5 text-slate-700"><strong className="block text-sm">Confirmação obrigatória</strong>Declaro que a autorização necessária para o registro deste atendimento foi obtida.</span></label>; }

function ActionBar({ screen, destination, patientReady, consent, busy, locked, status, onBack, onSave, onNext, onFinalize }: { screen: ClinicalScreen; destination: TriageDestination | null; patientReady: boolean; consent: boolean; busy: boolean; locked: boolean; status: string; onBack: () => void; onSave: () => void; onNext: () => void; onFinalize: () => void }) { return <div className="sticky bottom-0 z-20 mt-7 border-t border-slate-200 bg-[var(--page)]/95 py-4 backdrop-blur"><div className="flex flex-wrap items-center justify-between gap-3"><output className="flex max-w-xl items-center gap-2 text-xs text-slate-500"><Save className="size-4 shrink-0" />{status}</output><div className="flex flex-wrap gap-2">{!['triage', 'retorno'].includes(screen) ? <Button variant="outline" className="h-11" onClick={onBack}><ArrowLeft className="size-4" />Voltar</Button> : null}<Button variant="outline" className="h-11" disabled={busy || locked} onClick={onSave}><Save className="size-4" />Salvar rascunho</Button>{screen === 'retorno' ? <Button disabled={busy || locked || !patientReady || !consent} className="h-11 bg-emerald-700 text-white hover:bg-emerald-800" onClick={onFinalize}><ClipboardCheck className="size-4" />Finalizar retorno</Button> : null}{!['revisao', 'retorno'].includes(screen) ? <Button disabled={busy || locked || (screen === 'triage' && (!destination || !patientReady))} className="h-11 bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-dark)]" onClick={onNext}>Continuar <ArrowRight className="size-4" /></Button> : null}{screen === 'revisao' ? <Button disabled={busy || locked || !consent} className="h-11 bg-emerald-700 text-white hover:bg-emerald-800" onClick={onFinalize}><ClipboardCheck className="size-4" />Finalizar e gerar PDFs</Button> : null}</div></div></div>; }

function TriageScreen({ patientName, dateOfBirth, age, attendanceDate, students, users, painAnswer, jointAnswer, bruxismAnswer, triageComplete, destination, onPatientName, onDateOfBirth, onAttendanceDate, onStudents, onPainAnswer, onJointAnswer, onBruxismAnswer }: { patientName: string; dateOfBirth: string; age: number | null; attendanceDate: string; students: TeamMember[]; users: AppSession['bootstrap']['users']; painAnswer: TriageAnswer; jointAnswer: TriageAnswer; bruxismAnswer: TriageAnswer; triageComplete: boolean; destination: TriageDestination | null; onPatientName: (value: string) => void; onDateOfBirth: (value: string) => void; onAttendanceDate: (value: string) => void; onStudents: (value: TeamMember[]) => void; onPainAnswer: (value: TriageAnswer) => void; onJointAnswer: (value: TriageAnswer) => void; onBruxismAnswer: (value: TriageAnswer) => void }) {
  const updateStudent = (index: number, email: string) => { const user = users.find((candidate) => candidate.email === email); onStudents(students.map((student, current) => current === index ? { email, name: user?.name || student.name } : student)); };
  return <div className="space-y-6"><Card className="border-0 shadow-[0_16px_45px_rgba(15,44,69,0.07)] ring-1 ring-slate-200"><CardHeader className="border-b"><CardTitle className="text-lg text-[var(--brand-navy)]">Identificação do paciente</CardTitle><CardDescription>A data de nascimento permanece apenas no banco; o PDF mostra a idade.</CardDescription></CardHeader><CardContent className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_190px_120px_170px]"><Field label="Nome completo *"><Input className="h-11" value={patientName} onChange={(event) => onPatientName(event.target.value)} /></Field><Field label="Data de nascimento *"><Input className="h-11" type="date" value={dateOfBirth} onInput={(event) => onDateOfBirth(event.currentTarget.value)} /></Field><Field label="Idade"><Input className="h-11 bg-slate-50" value={age === null ? '' : `${age} anos`} readOnly /></Field><Field label="Data do atendimento *"><Input className="h-11" type="date" value={attendanceDate} onInput={(event) => onAttendanceDate(event.currentTarget.value)} /></Field></CardContent></Card><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><div><h2 className="text-base font-semibold text-[var(--brand-navy)]">Alunos responsáveis</h2><p className="mt-1 text-xs text-slate-500">Vincule dois ou três alunos autorizados.</p></div><Users className="size-5 text-[var(--brand-blue)]" /></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{students.map((student, index) => <Field key={index} label={`Aluno ${index + 1}`}><select value={student.email} onChange={(event) => updateStudent(index, event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"><option value="">Selecione</option>{users.map((user) => <option key={user.email} value={user.email}>{user.name} — {user.email}</option>)}</select></Field>)}{students.length < 3 ? <Button variant="outline" className="self-end" onClick={() => onStudents([...students, emptyMember()])}>Adicionar terceiro aluno</Button> : null}</div></section><section><div className="mb-4"><h2 className="text-lg font-semibold text-[var(--brand-navy)]">Perguntas de direcionamento</h2><p className="mt-1 text-xs text-slate-500">Período considerado: últimos 30 dias</p></div><div className="grid gap-4"><TriageQuestion number={1} value={painAnswer} onChange={onPainAnswer}>Você teve dor na região da face, mandíbula, cabeça ou têmporas, ouvido ou na frente do ouvido?</TriageQuestion><TriageQuestion number={2} value={jointAnswer} onChange={onJointAnswer}>Você apresentou algum ruído na articulação do rosto, travamento ou limitação de abertura da boca?</TriageQuestion><TriageQuestion number={3} value={bruxismAnswer} onChange={onBruxismAnswer}>Você ou outra pessoa percebeu ranger ou apertar os dentes durante o sono, ou você percebeu apertar ou manter os dentes encostados, ou movimentar a mandíbula repetidamente enquanto estava acordado?</TriageQuestion></div></section><div className={`rounded-2xl border p-5 ${destination ? 'border-[var(--brand-blue)]/20 bg-[var(--brand-blue-soft)]' : 'border-dashed border-slate-300 bg-white/60'}`}><p className="text-sm font-semibold text-[var(--brand-navy)]">{destination === 'dtm' ? 'Ficha de DTM selecionada' : destination === 'bruxismo' ? 'STAB selecionado' : destination === 'combinado' ? 'Ficha de DTM + STAB selecionados' : triageComplete ? 'Nenhuma ficha selecionada' : 'Responda às três perguntas'}</p><p className="mt-1 text-xs text-slate-600">{destination === 'dtm' ? 'As respostas direcionam à anamnese de DTM.' : destination === 'bruxismo' ? 'O relato de bruxismo abre o preenchimento do STAB.' : destination === 'combinado' ? 'Há indicação para a ficha de DTM e para o preenchimento do STAB.' : triageComplete ? 'As respostas não indicaram ficha de DTM nem preenchimento do STAB.' : 'O caminho será definido automaticamente.'}</p></div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-xs font-semibold text-slate-700">{label}</span>{children}</label>; }
function TriageQuestion({ number, children, value, onChange }: { number: number; children: React.ReactNode; value: TriageAnswer; onChange: (value: TriageAnswer) => void }) { return <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><legend className="sr-only">Pergunta {number}</legend><div className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-sm font-bold text-[var(--brand-blue)]">{number}</span><div className="flex-1"><p className="text-sm font-medium leading-6">{children}</p><div className="mt-4 flex gap-2">{(['sim', 'nao'] as const).map((option) => <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={`flex min-h-10 min-w-24 items-center justify-center gap-2 rounded-xl border px-5 text-xs font-semibold ${value === option ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white' : 'border-slate-200 bg-white'}`}>{value === option ? <CheckCircle2 className="size-4" /> : null}{option === 'sim' ? 'Sim' : 'Não'}</button>)}</div></div></div></fieldset>; }
