const OWNER_EMAIL = 'juliana.dentista@gmail.com';
const ROOT_FOLDER_NAME = 'Sistema Clínico Ortogotardo';
const SPREADSHEET_NAME = 'Base clínica Ortogotardo';
const LOCK_MINUTES = 3;
const RESPONSE_CHUNK_SIZE = 40000;

const SHEETS = {
  patients: ['codigo_paciente', 'nome', 'data_nascimento', 'criado_em', 'criado_por', 'equipe_emails', 'ativo'],
  attendances: ['id_atendimento', 'codigo_paciente', 'tipo', 'caminho', 'data_atendimento', 'status', 'versao_atual', 'criado_em', 'criado_por', 'atualizado_em', 'atualizado_por', 'equipe_emails', 'lock_email', 'lock_nome', 'lock_expira_em', 'pasta_id'],
  responses: ['id_atendimento', 'versao', 'parte', 'total_partes', 'json', 'salvo_em', 'salvo_por'],
  results: ['id_atendimento', 'versao', 'intensidade_caracteristica_dor', 'resultados_json', 'calculado_em'],
  users: ['email', 'nome', 'papel', 'ativo', 'criado_em'],
  audit: ['data_hora', 'email', 'acao', 'entidade', 'entidade_id', 'detalhes'],
};

function doGet() {
  return HtmlService.createHtmlOutput('<!doctype html><html><body>Serviço do Sistema Clínico Ortogotardo.</body></html>');
}

function doPost(e) {
  let request = {};
  let clientOrigin = '';
  let requestId = '';
  try {
    request = JSON.parse((e.parameter && e.parameter.request) || (e.postData && e.postData.contents) || '{}');
    clientOrigin = String(request.clientOrigin || '');
    requestId = String(request.requestId || '');
    assertAllowedOrigin_(clientOrigin);
    const result = dispatch_(request);
    return messageResponse_(clientOrigin, { requestId: requestId, ok: true, result: result });
  } catch (error) {
    return messageResponse_(clientOrigin || '*', {
      requestId: requestId,
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function setupSystem() {
  const properties = PropertiesService.getScriptProperties();
  let rootFolder = getFolderByIdOrCreate_(properties.getProperty('ROOT_FOLDER_ID'), ROOT_FOLDER_NAME);
  let spreadsheet;
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(rootFolder);
    properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  }
  properties.setProperty('ROOT_FOLDER_ID', rootFolder.getId());

  Object.keys(SHEETS).forEach(function (key) {
    ensureSheet_(spreadsheet, sheetName_(key), SHEETS[key]);
  });

  const defaultSheet = spreadsheet.getSheetByName('Sheet1') || spreadsheet.getSheetByName('Página1');
  if (defaultSheet && !Object.keys(SHEETS).some(function (key) { return sheetName_(key) === defaultSheet.getName(); })) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  const usersSheet = spreadsheet.getSheetByName(sheetName_('users'));
  if (findRowByValue_(usersSheet, 1, OWNER_EMAIL) < 0) {
    usersSheet.appendRow([OWNER_EMAIL, 'Juliana Stuginski Barbosa', 'admin', true, new Date()]);
  }

  return {
    rootFolderId: rootFolder.getId(),
    spreadsheetId: spreadsheet.getId(),
    message: 'Estrutura criada. Defina GOOGLE_CLIENT_ID e ALLOWED_ORIGINS nas propriedades do script antes de publicar.',
  };
}

/**
 * Atalho administrativo para cadastrar os participantes antes do uso.
 * Execute no editor do Apps Script como proprietária do projeto.
 * Papéis aceitos: aluno, professora, coordenacao ou admin.
 */
function addAuthorizedUser(email, name, role) {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(sheetName_('users'));
  const normalizedEmail = cleanText_(email).toLowerCase();
  const normalizedRole = cleanText_(role || 'aluno').toLowerCase();
  if (!normalizedEmail || normalizedEmail.indexOf('@') < 1) throw new Error('Informe um e-mail válido.');
  if (['aluno', 'professora', 'coordenacao', 'admin'].indexOf(normalizedRole) < 0) throw new Error('Papel inválido.');
  const row = findRowByValue_(sheet, 1, normalizedEmail);
  if (row < 0) sheet.appendRow([normalizedEmail, cleanText_(name), normalizedRole, true, new Date()]);
  else sheet.getRange(row, 2, 1, 3).setValues([[cleanText_(name), normalizedRole, true]]);
  return { email: normalizedEmail, name: cleanText_(name), role: normalizedRole, active: true };
}

/** Cadastros temporários usados somente durante a validação inicial do sistema. */
function addTestStudents() {
  return [
    addAuthorizedUser('justuba@gmail.com', 'Aluno teste 1', 'aluno'),
    addAuthorizedUser('recestuba@gmail.com', 'Aluno teste 2', 'aluno'),
  ];
}

function dispatch_(request) {
  const action = String(request.action || '');
  const identity = verifyIdentity_(request.idToken);
  const user = requireAuthorizedUser_(identity.email);
  const payload = request.payload || {};

  if (action === 'bootstrap') return bootstrap_(user);
  if (action === 'acquireLock') return acquireAttendanceLock_(user, payload);
  if (action === 'releaseLock') return releaseAttendanceLock_(user, payload);
  if (action === 'saveDraft') return saveAttendance_(user, payload, false);
  if (action === 'finalize') return saveAttendance_(user, payload, true);
  if (action === 'getAttendance') return getAttendance_(user, payload);
  if (action === 'listPatients') return listPatients_(user);
  if (action === 'startCorrection') return startCorrection_(user, payload);
  if (action === 'setUserAccess') return setUserAccess_(user, payload);
  throw new Error('Ação não reconhecida.');
}

function bootstrap_(user) {
  return {
    user: user,
    users: listUsers_(),
    patients: listPatients_(user),
    attendances: listAttendances_(user),
    serverTime: new Date().toISOString(),
  };
}

function listUsers_() {
  const sheet = getSpreadsheet_().getSheetByName(sheetName_('users'));
  return sheet.getDataRange().getValues().slice(1).filter(function (row) { return isTruthy_(row[3]); }).map(function (row) {
    return { email: String(row[0]).toLowerCase(), name: String(row[1] || row[0]), role: String(row[2] || 'aluno') };
  });
}

function setUserAccess_(user, payload) {
  if (user.role !== 'admin') throw new Error('Somente a administração pode alterar usuários.');
  const sheet = getSpreadsheet_().getSheetByName(sheetName_('users'));
  const email = cleanText_(payload.email).toLowerCase();
  const role = cleanText_(payload.role || 'aluno').toLowerCase();
  if (!email || email.indexOf('@') < 1) throw new Error('Informe um e-mail válido.');
  if (['aluno', 'professora', 'coordenacao', 'admin'].indexOf(role) < 0) throw new Error('Papel inválido.');
  const row = findRowByValue_(sheet, 1, email);
  const values = [email, cleanText_(payload.name || email), role, payload.active !== false, new Date()];
  if (row < 0) sheet.appendRow(values);
  else sheet.getRange(row, 1, 1, values.length).setValues([values]);
  audit_(getSpreadsheet_(), user, 'ALTERAR_ACESSO', 'USUARIO', email, { role: role, active: values[3] });
  return { email: email, name: values[1], role: role, active: values[3] };
}

function verifyIdentity_(idToken) {
  if (!idToken) throw new Error('Faça login com uma Conta Google autorizada.');
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID ainda não foi configurado.');

  const cache = CacheService.getScriptCache();
  const cacheKey = 'token:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken)).slice(0, 40);
  const cached = cache.get(cacheKey);
  let tokenInfo = cached ? JSON.parse(cached) : null;
  if (!tokenInfo) {
    const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) throw new Error('A sessão Google não pôde ser validada. Entre novamente.');
    tokenInfo = JSON.parse(response.getContentText());
    cache.put(cacheKey, JSON.stringify(tokenInfo), 240);
  }
  if (tokenInfo.aud !== clientId) throw new Error('O login foi emitido para outro aplicativo.');
  if (String(tokenInfo.email_verified) !== 'true') throw new Error('O e-mail Google não está verificado.');
  if (Number(tokenInfo.exp) * 1000 <= Date.now()) throw new Error('A sessão expirou. Entre novamente.');
  return { email: String(tokenInfo.email).toLowerCase(), name: String(tokenInfo.name || tokenInfo.email) };
}

function requireAuthorizedUser_(email) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName_('users'));
  const values = sheet.getDataRange().getValues();
  for (let row = 1; row < values.length; row += 1) {
    if (String(values[row][0]).toLowerCase() === email && isTruthy_(values[row][3])) {
      return { email: email, name: String(values[row][1] || email), role: String(values[row][2] || 'aluno') };
    }
  }
  throw new Error('Este e-mail não está autorizado a acessar o sistema.');
}

function listPatients_(user) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName_('patients'));
  const values = sheet.getDataRange().getValues();
  return values.slice(1).filter(function (row) {
    const team = parseEmailList_(row[5]);
    return isStaff_(user) || team.indexOf(user.email) >= 0;
  }).map(function (row) {
    return { code: row[0], name: row[1], dateOfBirth: serializeDateValue_(row[2]), age: calculateAge_(row[2]), active: isTruthy_(row[6]), teamEmails: parseEmailList_(row[5]) };
  });
}

function listAttendances_(user) {
  const spreadsheet = getSpreadsheet_();
  const patientRows = spreadsheet.getSheetByName(sheetName_('patients')).getDataRange().getValues().slice(1);
  const patientNames = {};
  patientRows.forEach(function (row) { patientNames[String(row[0])] = String(row[1]); });
  return spreadsheet.getSheetByName(sheetName_('attendances')).getDataRange().getValues().slice(1).filter(function (row) {
    return isStaff_(user) || parseEmailList_(row[11]).indexOf(user.email) >= 0;
  }).map(function (row) {
    return {
      id: String(row[0]), patientCode: String(row[1]), patientName: patientNames[String(row[1])] || String(row[1]),
      type: String(row[2]), destination: String(row[3]), date: serializeDateValue_(row[4]), status: String(row[5]),
      version: Number(row[6] || 1), updatedAt: serializeDateTime_(row[9]),
    };
  }).sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
}

function startCorrection_(user, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(sheetName_('attendances'));
  const attendanceId = String(payload.attendanceId || '');
  const rowNumber = findRowByValue_(sheet, 1, attendanceId);
  if (rowNumber < 0) throw new Error('Atendimento não encontrado.');
  const row = sheet.getRange(rowNumber, 1, 1, SHEETS.attendances.length).getValues()[0];
  assertAttendanceAccess_(user, row);
  if (String(row[5]) !== 'FINALIZADO') throw new Error('Somente um atendimento finalizado pode iniciar correção.');
  const expiresAt = addMinutes_(new Date(), LOCK_MINUTES);
  sheet.getRange(rowNumber, 6).setValue('CORRECAO');
  sheet.getRange(rowNumber, 10, 1, 6).setValues([[new Date(), user.email, row[11], user.email, user.name, expiresAt]]);
  audit_(spreadsheet, user, 'INICIAR_CORRECAO', 'ATENDIMENTO', attendanceId, { fromVersion: Number(row[6]) });
  return getAttendance_(user, { attendanceId: attendanceId });
  } finally {
    lock.releaseLock();
  }
}

function acquireAttendanceLock_(user, payload) {
  const attendanceId = String(payload.attendanceId || '');
  if (!attendanceId) return { acquired: true, draftId: Utilities.getUuid(), expiresAt: addMinutes_(new Date(), LOCK_MINUTES).toISOString() };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSpreadsheet_().getSheetByName(sheetName_('attendances'));
    const rowNumber = findRowByValue_(sheet, 1, attendanceId);
    if (rowNumber < 0) throw new Error('Atendimento não encontrado.');
    const row = sheet.getRange(rowNumber, 1, 1, SHEETS.attendances.length).getValues()[0];
    assertAttendanceAccess_(user, row);
    const lockEmail = String(row[12] || '').toLowerCase();
    const expiresAt = row[14] ? new Date(row[14]) : null;
    if (lockEmail && lockEmail !== user.email && expiresAt && expiresAt > new Date()) {
      return { acquired: false, lockedBy: String(row[13] || lockEmail), expiresAt: expiresAt.toISOString() };
    }
    const nextExpiry = addMinutes_(new Date(), LOCK_MINUTES);
    sheet.getRange(rowNumber, 13, 1, 3).setValues([[user.email, user.name, nextExpiry]]);
    return { acquired: true, expiresAt: nextExpiry.toISOString() };
  } finally {
    lock.releaseLock();
  }
}

function releaseAttendanceLock_(user, payload) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName_('attendances'));
  const rowNumber = findRowByValue_(sheet, 1, String(payload.attendanceId || ''));
  if (rowNumber < 0) return { released: true };
  const lockEmail = String(sheet.getRange(rowNumber, 13).getValue() || '').toLowerCase();
  if (lockEmail === user.email || isStaff_(user)) sheet.getRange(rowNumber, 13, 1, 3).clearContent();
  return { released: true };
}

function saveAttendance_(user, payload, finalize) {
  validatePayload_(payload, finalize);
  const scriptLock = LockService.getScriptLock();
  scriptLock.waitLock(20000);
  let spreadsheet;
  let patient;
  let attendance;
  try {
    spreadsheet = getSpreadsheet_();
    patient = upsertPatient_(spreadsheet, user, payload.patient || {});
    attendance = upsertAttendance_(spreadsheet, user, payload, patient, finalize);
    const version = attendance.version;
    saveResponseChunks_(spreadsheet, attendance.id, version, payload, user.email);
    saveResults_(spreadsheet, attendance.id, version, payload.results || {});
    audit_(spreadsheet, user, finalize ? 'INICIAR_FINALIZACAO' : 'SALVAR_RASCUNHO', 'ATENDIMENTO', attendance.id, { version: version });
  } finally {
    scriptLock.releaseLock();
  }

  if (!finalize) return { patientCode: patient.code, attendanceId: attendance.id, version: attendance.version, status: 'RASCUNHO', files: [] };
  try {
    const files = generateRecordPdfs_(spreadsheet, user, patient, attendance, payload);
    markAttendanceStatus_(spreadsheet, attendance.rowNumber, 'FINALIZADO', user, true);
    audit_(spreadsheet, user, 'FINALIZAR', 'ATENDIMENTO', attendance.id, { version: attendance.version });
    return { patientCode: patient.code, attendanceId: attendance.id, version: attendance.version, status: 'FINALIZADO', files: files };
  } catch (error) {
    markAttendanceStatus_(spreadsheet, attendance.rowNumber, attendance.previousStatus === 'CORRECAO' ? 'CORRECAO' : 'RASCUNHO', user, false);
    audit_(spreadsheet, user, 'ERRO_GERAR_PDF', 'ATENDIMENTO', attendance.id, { version: attendance.version, error: String(error) });
    throw new Error('As respostas foram preservadas, mas os PDFs não foram gerados. O atendimento permaneceu editável para nova tentativa.');
  }
}

function markAttendanceStatus_(spreadsheet, rowNumber, status, user, releaseLock) {
  const sheet = spreadsheet.getSheetByName(sheetName_('attendances'));
  sheet.getRange(rowNumber, 6).setValue(status);
  sheet.getRange(rowNumber, 10, 1, 2).setValues([[new Date(), user.email]]);
  if (releaseLock) sheet.getRange(rowNumber, 13, 1, 3).clearContent();
}

function upsertPatient_(spreadsheet, user, patientPayload) {
  const sheet = spreadsheet.getSheetByName(sheetName_('patients'));
  let code = String(patientPayload.code || '');
  let rowNumber = code ? findRowByValue_(sheet, 1, code) : -1;
  const teamEmails = normalizeTeam_(patientPayload.teamEmails || [], isStaff_(user) ? '' : user.email);
  validateTeam_(teamEmails);
  if (rowNumber < 0) {
    code = nextPatientCode_(sheet);
    sheet.appendRow([code, cleanText_(patientPayload.name), cleanText_(patientPayload.dateOfBirth), new Date(), user.email, teamEmails.join(','), true]);
    rowNumber = sheet.getLastRow();
    audit_(spreadsheet, user, 'CRIAR', 'PACIENTE', code, {});
  } else {
    const currentTeam = parseEmailList_(sheet.getRange(rowNumber, 6).getValue());
    if (!isStaff_(user) && currentTeam.indexOf(user.email) < 0) throw new Error('Você não pode alterar a equipe deste paciente.');
    sheet.getRange(rowNumber, 2, 1, 6).setValues([[cleanText_(patientPayload.name), cleanText_(patientPayload.dateOfBirth), sheet.getRange(rowNumber, 4).getValue(), sheet.getRange(rowNumber, 5).getValue(), teamEmails.join(','), true]]);
  }
  return { code: code, name: cleanText_(patientPayload.name), dateOfBirth: cleanText_(patientPayload.dateOfBirth), age: calculateAge_(patientPayload.dateOfBirth), teamEmails: teamEmails };
}

function upsertAttendance_(spreadsheet, user, payload, patient, finalize) {
  const sheet = spreadsheet.getSheetByName(sheetName_('attendances'));
  let id = String(payload.attendanceId || '');
  let rowNumber = id ? findRowByValue_(sheet, 1, id) : -1;
  const now = new Date();
  if (rowNumber < 0) {
    id = 'ATD-' + Utilities.getUuid();
    sheet.appendRow([id, patient.code, cleanText_(payload.type || 'INICIAL'), cleanText_(payload.destination), cleanText_(payload.attendanceDate || formatDate_(now)), finalize ? 'FINALIZANDO' : 'RASCUNHO', 1, now, user.email, now, user.email, patient.teamEmails.join(','), user.email, user.name, addMinutes_(now, LOCK_MINUTES), '']);
    return { id: id, rowNumber: sheet.getLastRow(), version: 1, previousStatus: 'RASCUNHO' };
  }

  const row = sheet.getRange(rowNumber, 1, 1, SHEETS.attendances.length).getValues()[0];
  assertAttendanceAccess_(user, row);
  if (String(row[5]) === 'FINALIZADO') throw new Error('O original está finalizado. Inicie uma correção para gerar nova versão.');
  const lockEmail = String(row[12] || '').toLowerCase();
  const lockExpires = row[14] ? new Date(row[14]) : null;
  if (lockEmail && lockEmail !== user.email && lockExpires && lockExpires > now) throw new Error('Este atendimento está sendo editado por ' + String(row[13] || lockEmail) + '.');
  const version = Number(row[6] || 0) + 1;
  const previousStatus = String(row[5] || 'RASCUNHO');
  sheet.getRange(rowNumber, 6, 1, 10).setValues([[finalize ? 'FINALIZANDO' : 'RASCUNHO', version, row[7], row[8], now, user.email, patient.teamEmails.join(','), user.email, user.name, addMinutes_(now, LOCK_MINUTES)]]);
  return { id: id, rowNumber: rowNumber, version: version, previousStatus: previousStatus };
}

function saveResponseChunks_(spreadsheet, attendanceId, version, payload, email) {
  const sheet = spreadsheet.getSheetByName(sheetName_('responses'));
  const json = JSON.stringify(payload);
  const chunks = [];
  for (let offset = 0; offset < json.length; offset += RESPONSE_CHUNK_SIZE) chunks.push(json.slice(offset, offset + RESPONSE_CHUNK_SIZE));
  const rows = chunks.map(function (chunk, index) { return [attendanceId, version, index + 1, chunks.length, chunk, new Date(), email]; });
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function saveResults_(spreadsheet, attendanceId, version, results) {
  const sheet = spreadsheet.getSheetByName(sheetName_('results'));
  sheet.appendRow([attendanceId, version, results.cpi === undefined ? '' : results.cpi, JSON.stringify(results), new Date()]);
}

function getAttendance_(user, payload) {
  const spreadsheet = getSpreadsheet_();
  const attendanceSheet = spreadsheet.getSheetByName(sheetName_('attendances'));
  const rowNumber = findRowByValue_(attendanceSheet, 1, String(payload.attendanceId || ''));
  if (rowNumber < 0) throw new Error('Atendimento não encontrado.');
  const attendanceRow = attendanceSheet.getRange(rowNumber, 1, 1, SHEETS.attendances.length).getValues()[0];
  assertAttendanceAccess_(user, attendanceRow);
  const version = Number(attendanceRow[6]);
  const responseRows = spreadsheet.getSheetByName(sheetName_('responses')).getDataRange().getValues().slice(1).filter(function (row) { return row[0] === attendanceRow[0] && Number(row[1]) === version; });
  responseRows.sort(function (a, b) { return Number(a[2]) - Number(b[2]); });
  return { attendance: rowToObject_(SHEETS.attendances, attendanceRow), payload: JSON.parse(responseRows.map(function (row) { return row[4]; }).join('')) };
}

function generateRecordPdfs_(spreadsheet, user, patient, attendance, payload) {
  const folder = ensureAttendanceFolder_(patient, attendance, payload);
  const documents = payload.documents || defaultDocuments_(payload);
  const files = documents.map(function (documentData) {
    return createPdf_(folder, documentData.name, patient, attendance, payload, documentData.sections || []);
  });
  sharePatientFolder_(folder.getParents().next(), patient.teamEmails);
  const attendanceSheet = spreadsheet.getSheetByName(sheetName_('attendances'));
  attendanceSheet.getRange(attendance.rowNumber, 16).setValue(folder.getId());
  audit_(spreadsheet, user, 'GERAR_PDF', 'ATENDIMENTO', attendance.id, { files: files });
  return files;
}

function createPdf_(folder, fileName, patient, attendance, payload, sections) {
  const document = DocumentApp.create('TEMP-' + attendance.id);
  const body = document.getBody();
  body.clear();
  appendBrandLogos_(body);
  const title = body.appendParagraph(fileName.replace(/\.pdf$/i, ''));
  title.setHeading(DocumentApp.ParagraphHeading.TITLE).setForegroundColor('#102f49');
  body.appendParagraph('Paciente: ' + patient.name + ' | Código: ' + patient.code + ' | Idade: ' + patient.age + ' anos');
  body.appendParagraph('Data: ' + cleanText_(payload.attendanceDate || formatDate_(new Date())) + ' | Alunos: ' + (payload.studentNames || []).join(', '));
  body.appendHorizontalRule();
  if (/^01 /.test(fileName) && payload.painMapImage) {
    body.appendParagraph('Mapa da dor').setHeading(DocumentApp.ParagraphHeading.HEADING2).setForegroundColor('#102f49');
    try {
      const imageBytes = Utilities.base64Decode(String(payload.painMapImage).split(',').pop());
      body.appendImage(Utilities.newBlob(imageBytes, 'image/jpeg', 'mapa-da-dor.jpg')).setWidth(420);
    } catch (error) { body.appendParagraph('O mapa visual não pôde ser inserido; os pontos permanecem descritos abaixo.'); }
  }
  sections.forEach(function (section) {
    if (!section || !section.items || !section.items.length) return;
    body.appendParagraph(cleanText_(section.title)).setHeading(DocumentApp.ParagraphHeading.HEADING2).setForegroundColor('#102f49');
    const rows = section.items.filter(function (item) { return item && item.value !== '' && item.value !== null && item.value !== undefined && !(Array.isArray(item.value) && !item.value.length); }).map(function (item) {
      return [cleanText_(item.label), Array.isArray(item.value) ? item.value.join('; ') : cleanText_(item.value)];
    });
    if (rows.length) {
      const table = body.appendTable(rows);
      for (let rowIndex = 0; rowIndex < table.getNumRows(); rowIndex += 1) {
        table.getRow(rowIndex).getCell(0).setBackgroundColor('#edf6fb').editAsText().setBold(true).setForegroundColor('#102f49');
        table.getRow(rowIndex).getCell(1).editAsText().setForegroundColor('#17202a');
      }
    }
  });
  body.appendParagraph('Versão ' + attendance.version + ' — registro finalizado e preservado no histórico.').setForegroundColor('#687784');
  document.saveAndClose();
  const documentFile = DriveApp.getFileById(document.getId());
  const pdf = folder.createFile(documentFile.getAs(MimeType.PDF).setName(fileName));
  documentFile.setTrashed(true);
  return { id: pdf.getId(), name: pdf.getName(), url: pdf.getUrl() };
}

function appendBrandLogos_(body) {
  const properties = PropertiesService.getScriptProperties();
  const ids = [properties.getProperty('ORTOGOTARDO_LOGO_FILE_ID'), properties.getProperty('JULIANA_LOGO_FILE_ID')].filter(Boolean);
  ids.forEach(function (id) {
    try { body.appendImage(DriveApp.getFileById(id).getBlob()).setWidth(145); } catch (error) { console.warn('Logotipo não inserido: ' + error); }
  });
}

function defaultDocuments_(payload) {
  if (String(payload.type).toUpperCase() === 'RETORNO') return [{ name: 'Retorno clínico.pdf', sections: payload.reportSections || [] }];
  return [
    { name: '01 Anamnese e resumo clínico.pdf', sections: payload.anamnesisSections || [] },
    { name: '02 Exame físico.pdf', sections: payload.examSections || [] },
    { name: '03 Diagnóstico avaliação e plano.pdf', sections: payload.planSections || [] },
  ];
}

function ensureAttendanceFolder_(patient, attendance, payload) {
  const root = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID'));
  const appointments = getOrCreateChildFolder_(root, 'Atendimentos');
  const year = String(new Date(payload.attendanceDate || new Date()).getFullYear());
  const yearFolder = getOrCreateChildFolder_(appointments, year);
  const patientFolder = getOrCreateChildFolder_(yearFolder, safeFileName_(patient.code + ' ' + patient.name));
  return getOrCreateChildFolder_(patientFolder, safeFileName_((payload.attendanceDate || formatDate_(new Date())) + ' ' + (payload.type || 'Atendimento') + ' v' + attendance.version));
}

function sharePatientFolder_(patientFolder, teamEmails) {
  const staffEmails = listUsers_().filter(function (user) { return isStaff_(user); }).map(function (user) { return user.email; });
  Array.from(new Set(teamEmails.concat(staffEmails))).forEach(function (email) {
    try { patientFolder.addViewer(email); } catch (error) { console.warn('Não foi possível compartilhar com ' + email + ': ' + error); }
  });
}

function validatePayload_(payload, finalize) {
  if (!payload.patient || !cleanText_(payload.patient.name)) throw new Error('Informe o nome do paciente.');
  if (!cleanText_(payload.patient.dateOfBirth)) throw new Error('Informe a data de nascimento.');
  if (!payload.destination && String(payload.type).toUpperCase() !== 'RETORNO') throw new Error('O caminho clínico não foi definido.');
  if (finalize && !payload.consentConfirmed) throw new Error('Confirme que a autorização necessária foi obtida.');
}

function assertAttendanceAccess_(user, attendanceRow) {
  if (isStaff_(user)) return;
  if (parseEmailList_(attendanceRow[11]).indexOf(user.email) < 0) throw new Error('Você não tem acesso a este atendimento.');
}

function validateTeam_(teamEmails) {
  if (teamEmails.length < 2 || teamEmails.length > 3) throw new Error('Vincule de dois a três alunos autorizados.');
  const students = listUsers_().filter(function (user) { return user.role === 'aluno'; }).map(function (user) { return user.email; });
  teamEmails.forEach(function (email) { if (students.indexOf(email) < 0) throw new Error('O e-mail ' + email + ' não está cadastrado como aluno ativo.'); });
}

function isStaff_(user) { return user.role === 'admin' || user.role === 'professora' || user.role === 'coordenacao'; }
function normalizeTeam_(emails, creatorEmail) { const normalized = (emails || []).map(function (email) { return String(email).trim().toLowerCase(); }).filter(Boolean); if (creatorEmail && normalized.indexOf(creatorEmail) < 0) normalized.unshift(creatorEmail); return Array.from(new Set(normalized)).slice(0, 3); }
function parseEmailList_(value) { return String(value || '').split(',').map(function (email) { return email.trim().toLowerCase(); }).filter(Boolean); }
function isTruthy_(value) { return value === true || String(value).toLowerCase() === 'true' || String(value) === '1' || String(value).toLowerCase() === 'sim'; }
function cleanText_(value) { return String(value === undefined || value === null ? '' : value).trim(); }
function addMinutes_(date, minutes) { return new Date(date.getTime() + minutes * 60000); }
function formatDate_(date) { return Utilities.formatDate(new Date(date), 'America/Sao_Paulo', 'yyyy-MM-dd'); }
function safeFileName_(value) { return cleanText_(value).replace(/[\\/:*?"<>|]/g, '-').slice(0, 180); }
function rowToObject_(headers, row) { const result = {}; headers.forEach(function (header, index) { result[header] = row[index]; }); return result; }
function calculateAge_(birthValue) { const birth = new Date(birthValue); if (isNaN(birth.getTime())) return ''; const now = new Date(); let age = now.getFullYear() - birth.getFullYear(); if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1; return age; }
function nextPatientCode_(sheet) { const properties = PropertiesService.getScriptProperties(); const year = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy'); const key = 'PATIENT_COUNTER_' + year; const current = Math.max(Number(properties.getProperty(key) || 0), Math.max(0, sheet.getLastRow() - 1)); const next = current + 1; properties.setProperty(key, String(next)); return 'PAC-' + year + '-' + String(next).padStart(4, '0'); }
function serializeDateValue_(value) { if (!value) return ''; if (Object.prototype.toString.call(value) === '[object Date]') return Utilities.formatDate(new Date(value), 'America/Sao_Paulo', 'yyyy-MM-dd'); return String(value).slice(0, 10); }
function serializeDateTime_(value) { if (!value) return ''; try { return new Date(value).toISOString(); } catch (error) { return String(value); } }
function sheetName_(key) { const names = { patients: 'Pacientes', attendances: 'Atendimentos', responses: 'Respostas', results: 'Resultados', users: 'Usuários', audit: 'Auditoria' }; return names[key]; }
function getSpreadsheet_() { const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); if (!id) throw new Error('Execute setupSystem() antes de usar o web app.'); return SpreadsheetApp.openById(id); }
function ensureSheet_(spreadsheet, name, headers) { let sheet = spreadsheet.getSheetByName(name); if (!sheet) sheet = spreadsheet.insertSheet(name); if (sheet.getLastRow() === 0) { sheet.getRange(1, 1, 1, headers.length).setValues([headers]); sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, headers.length).setBackground('#075184').setFontColor('#ffffff').setFontWeight('bold'); } return sheet; }
function findRowByValue_(sheet, column, value) { if (!value || sheet.getLastRow() < 2) return -1; const finder = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).createTextFinder(String(value)).matchEntireCell(true).findNext(); return finder ? finder.getRow() : -1; }
function getFolderByIdOrCreate_(id, name) { if (id) { try { return DriveApp.getFolderById(id); } catch (error) {} } const folders = DriveApp.getFoldersByName(name); return folders.hasNext() ? folders.next() : DriveApp.createFolder(name); }
function getOrCreateChildFolder_(parent, name) { const folders = parent.getFoldersByName(name); return folders.hasNext() ? folders.next() : parent.createFolder(name); }
function audit_(spreadsheet, user, action, entity, entityId, details) { spreadsheet.getSheetByName(sheetName_('audit')).appendRow([new Date(), user.email, action, entity, entityId, JSON.stringify(details || {})]); }
function assertAllowedOrigin_(origin) { const allowed = String(PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGINS') || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean); if (!origin || allowed.indexOf(origin) < 0) throw new Error('Origem do site não autorizada.'); }
function messageResponse_(origin, payload) { const safeOrigin = JSON.stringify(origin || '*'); const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c'); return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.top.postMessage(' + safePayload + ',' + safeOrigin + ');<\/script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); }
