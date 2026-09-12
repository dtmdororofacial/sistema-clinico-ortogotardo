export type TriageDestination = 'dtm' | 'bruxismo' | 'combinado';

export function calculateAge(dateOfBirth: string, onDate = new Date()): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > onDate) return null;
  let age = onDate.getFullYear() - birth.getFullYear();
  const monthDifference = onDate.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && onDate.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function calculateCpi(answers: Record<string, unknown>): number | null {
  const values = ['gcps2', 'gcps3', 'gcps4'].map((key) => Number(answers[key]));
  if (values.some((value) => !Number.isFinite(value))) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / 3) * 10);
}

export function triageDestination(pain: string | null, joint: string | null, bruxism: string | null): TriageDestination | null {
  if (!pain || !joint || !bruxism) return null;
  const hasDtmIndication = pain === 'sim' || joint === 'sim';
  const hasBruxismIndication = bruxism === 'sim';
  if (hasDtmIndication && hasBruxismIndication) return 'combinado';
  if (hasDtmIndication) return 'dtm';
  if (hasBruxismIndication) return 'bruxismo';
  return null;
}

export function isMeaningful(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0 && !value.every((item) => /nenhum|não/i.test(String(item)));
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (typeof value === 'string') return value.trim() !== '' && !/^(não|não sei|nenhum|nenhuma|nenhuma vez|nunca|ausente|sem dor|não avaliado|não ocorre|0 dias|não usa|não consome)$/i.test(value.trim());
  return Boolean(value);
}
