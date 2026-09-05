import './style.css';
import { decryptBundle, encryptBundle, type EncryptedBundle } from './crypto';
import { blankPacket, type Medication, type Packet, type Question, type SourceItem } from './types';

const REAL_DB = 'health-visit-packet';
const DEMO_DB = 'demo:health-visit-packet';
const STORE = 'packet';
const KEY = 'current';
const LICENSE_KEY = 'sb_license:health-visit-packet';
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const isDemo = location.pathname === '/demo' || location.pathname === '/demo/' || new URLSearchParams(location.search).get('demo') === '1';
const activeDatabase = isDemo ? DEMO_DB : REAL_DB;

type ListKind = 'observations' | 'medications' | 'questions';
type DeletedEntry = { kind: ListKind; index: number; item: SourceItem | Medication | Question };
type Notice = { message: string; offerUndo: boolean };

let packet = isDemo ? samplePacket() : blankPacket();
let plus = false;
let saveTimer = 0;
let noticeTimer = 0;
let reloadForUpdate = false;
let deletedEntry: DeletedEntry | undefined;
let pendingNotice: Notice | undefined;

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const uid = () => crypto.randomUUID();
const esc = (value: string) => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]!));

function samplePacket(): Packet {
  return {
    version: 1,
    updatedAt: '2026-09-05T12:00:00.000Z',
    profile: {
      name: 'Maya Patel',
      appointmentDate: '2026-09-18',
      clinician: 'Dr. Elena Ruiz, Lakeside Family Practice',
      reason: 'Review my blood sugar trend and recurring afternoon dizziness.',
      coverNote: '',
    },
    observations: [
      { id: 'sample-hba1c', label: 'HbA1c', value: '6.1', unit: '%', source: 'Northside Lab portal', date: '2026-08-28', note: 'Ordered during annual blood work.' },
      { id: 'sample-blood-pressure', label: 'Blood pressure', value: '138/86', unit: 'mmHg', source: 'Home cuff log', date: '2026-09-02', note: 'Average of three morning readings.' },
    ],
    medications: [
      { id: 'sample-metformin', name: 'Metformin', dose: '500 mg', schedule: 'With breakfast and dinner', source: 'Prescription bottle' },
      { id: 'sample-vitamin-d', name: 'Vitamin D3', dose: '1,000 IU', schedule: 'Each morning', source: 'Bottle' },
    ],
    questions: [
      { id: 'sample-question-dizziness', question: 'Could any medicine contribute to the afternoon dizziness?', note: 'It often starts around 3 p.m.' },
      { id: 'sample-question-repeat', question: 'Which result should I repeat before the next visit?', note: '' },
    ],
  };
}

function openDB(databaseName = activeDatabase): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readPacket(): Promise<Packet | undefined> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE);
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writePacket(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(packet, KEY);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

async function loadPacket() {
  try {
    const saved = await readPacket();
    if (saved?.version === 1) {
      packet = saved;
      packet.profile.coverNote ??= '';
    } else if (isDemo) {
      await writePacket();
    }
  } catch {
    announce('This browser could not open local storage. Keep this tab open and download a backup.');
  }
}

function queueSave() {
  packet.updatedAt = new Date().toISOString();
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      await writePacket();
      setSave(isDemo ? 'Saved only in this demo' : 'Saved on this device');
    } catch {
      setSave('Could not save in this browser');
    }
  }, 250);
}

function setSave(message: string) {
  const element = document.querySelector('#save-state');
  if (element) element.textContent = message;
}

function announce(message: string, offerUndo = false) {
  const notice = document.querySelector<HTMLElement>('#notice');
  const text = document.querySelector('#notice-text');
  const undo = document.querySelector<HTMLButtonElement>('#undo-delete');
  if (!notice || !text || !undo) {
    pendingNotice = { message, offerUndo };
    return;
  }
  window.clearTimeout(noticeTimer);
  text.textContent = message;
  undo.hidden = !offerUndo;
  notice.hidden = false;
  noticeTimer = window.setTimeout(() => {
    notice.hidden = true;
    deletedEntry = undefined;
  }, 8000);
}

function download(name: string, body: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const input = (label: string, name: string, value = '', type = 'text', required = false) => `
  <label>${label}${required ? ' <span aria-hidden="true">*</span>' : ''}
    <input ${required ? 'required aria-required="true"' : ''} type="${type}" name="${name}" value="${esc(value)}">
  </label>`;

function sourceHtml(observation: SourceItem) {
  return `<li class="paper-item">
    <div><strong>${esc(observation.label)}</strong><span class="value">${esc(observation.value)} ${esc(observation.unit)}</span></div>
    <div class="meta">${esc(observation.source)} · ${esc(observation.date || 'date not recorded')}${observation.note ? ` · ${esc(observation.note)}` : ''}</div>
    <button class="quiet delete" data-kind="observations" data-id="${observation.id}" aria-label="Remove ${esc(observation.label)}">Remove</button>
  </li>`;
}

function sectionPreview(title: string, items: string, empty: string) {
  return `<section class="print-section"><h3>${title}</h3>${items ? `<ul>${items}</ul>` : `<p class="empty-inline">${empty}</p>`}</section>`;
}

function renderPacket() {
  const profile = packet.profile;
  $('#packet-sheet').innerHTML = `
    <div class="packet-cap"><span>Prepared visit packet</span><span>${profile.appointmentDate ? esc(profile.appointmentDate) : 'date not set'}</span></div>
    <h2>${profile.name ? `${esc(profile.name)}’s packet` : 'Your visit packet'}</h2>
    <p class="packet-reason">${profile.reason ? esc(profile.reason) : 'Add what you want to cover at this visit.'}${profile.clinician ? ` <span>For ${esc(profile.clinician)}</span>` : ''}</p>
    ${plus && profile.coverNote ? `<aside class="cover-note"><b>Personal cover note</b><br>${esc(profile.coverNote)}</aside>` : ''}
    ${sectionPreview('Selected results and observations', packet.observations.map(sourceHtml).join(''), 'No source-labelled results yet.')}
    ${sectionPreview('Medicines', packet.medications.map(medicine => `<li class="paper-item"><strong>${esc(medicine.name)}</strong><span>${esc(medicine.dose)}${medicine.schedule ? ` · ${esc(medicine.schedule)}` : ''}</span><small>Source: ${esc(medicine.source)}</small><button class="quiet delete" data-kind="medications" data-id="${medicine.id}" aria-label="Remove ${esc(medicine.name)}">Remove</button></li>`).join(''), 'No medicines added.')}
    ${sectionPreview('Questions for this visit', packet.questions.map((question, index) => `<li class="question"><b>${index + 1}.</b> ${esc(question.question)}${question.note ? `<small>${esc(question.note)}</small>` : ''}<button class="quiet delete" data-kind="questions" data-id="${question.id}" aria-label="Remove question ${index + 1}">Remove</button></li>`).join(''), 'No questions added.')}
    <p class="packet-foot">Personal record prepared by you. Values are copied as entered. This is not medical advice.</p>`;
  bindDeletes();
}

function headerHtml() {
  return `<header class="site-header">
    <a class="wordmark" href="/" ${isDemo ? 'data-exit-demo' : ''} aria-label="Health Visit Packet home"><span class="mark" aria-hidden="true"></span>Health Visit Packet</a>
    <nav aria-label="Main navigation"><a href="/demo">Demo</a><a href="#how-it-works">How it works</a><a href="/privacy/" ${isDemo ? 'data-exit-demo' : ''}>Privacy</a></nav>
    <span id="save-state" role="status">${isDemo ? 'Demo changes stay separate' : 'Stored only on this device'}</span>
  </header>`;
}

function firstScreenHtml() {
  if (isDemo) {
    return `<section class="intro demo-intro" aria-labelledby="page-title">
      <div><p class="eyebrow">Sample packet</p><h1 id="page-title" tabindex="-1">Review a filled visit packet</h1><p class="lede">For patients preparing for an appointment, this sample shows the printable packet before any setup.</p><a class="primary hero-action" href="#packet-sheet">Review the sample packet</a></div>
      <aside class="sample-glance" aria-label="Sample packet summary"><strong>Maya Patel · September 18 visit</strong><span>2 results · 2 medicines · 2 questions</span><span>Every value includes its source.</span></aside>
    </section>`;
  }
  return `<section class="intro" aria-labelledby="page-title">
    <div><p class="eyebrow">Prepare for an appointment</p><h1 id="page-title" tabindex="-1">Bring one clear page to your appointment</h1><p class="lede">For patients preparing for an appointment, turn selected records into one packet to print or keep.</p>
      <div class="hero-actions"><a class="primary hero-action" href="/demo#packet-sheet">Try it with sample data</a><span>See a filled packet. Sample changes never touch your packet.</span><a class="secondary hero-action" href="#editor">Start your packet</a></div>
      <ul class="hero-facts" aria-label="Product facts"><li><strong>Private:</strong> Packet details stay in this browser unless you export.</li><li><strong>Offline:</strong> Use the packet after your first visit to this site.</li><li><strong>Price:</strong> Builder and exports are free. Plus costs $9 once.</li></ul>
    </div>
    <figure><img src="/packet-diorama.webp" width="768" height="512" fetchpriority="high" decoding="async" alt="Paper-cut illustration of a visit packet with blank lab slips, a medicine bottle, pencil, and question card."><figcaption>Original generated illustration of the paper packet.</figcaption></figure>
  </section>`;
}

function workspaceHtml() {
  return `<section id="editor" class="workspace" aria-label="Packet editor">
    <aside class="editor">
      <div class="editor-head"><h2>Build your packet</h2><p id="required-help">Required fields are marked with an asterisk.</p></div>
      <details open><summary>Visit details</summary><form id="profile-form" class="field-grid">${input('Your name', 'name', packet.profile.name)}${input('Appointment date', 'appointmentDate', packet.profile.appointmentDate, 'date')}${input('Clinician or clinic', 'clinician', packet.profile.clinician)}<label>What do you want to cover?<textarea name="reason" rows="3">${esc(packet.profile.reason)}</textarea></label>${plus ? `<label>Personal cover note<textarea name="coverNote" rows="3">${esc(packet.profile.coverNote || '')}</textarea></label>` : ''}</form></details>
      <details open><summary>Results and observations <span class="count">${packet.observations.length}</span></summary><form id="observation-form" class="entry-form">${input('Result or observation', 'label', '', 'text', true)}<div class="two-up">${input('Value', 'value', '', 'text', true)}${input('Unit (optional)', 'unit')}</div>${input('Where did this come from?', 'source', '', 'text', true)}${input('Date from source', 'date', '', 'date')}<label>Context or note (optional)<textarea name="note" rows="2"></textarea></label><button class="secondary" type="submit" aria-label="Add result">Add result</button></form></details>
      <details><summary>Medicines <span class="count">${packet.medications.length}</span></summary><form id="medication-form" class="entry-form">${input('Medicine name', 'name', '', 'text', true)}<div class="two-up">${input('Dose', 'dose', '', 'text', true)}${input('Schedule', 'schedule')}</div>${input('Source: label, bottle, or portal', 'source', '', 'text', true)}<button class="secondary" type="submit" aria-label="Add medicine">Add medicine</button></form></details>
      <details><summary>Questions <span class="count">${packet.questions.length}</span></summary><form id="question-form" class="entry-form"><label>Question for the clinician<textarea required aria-required="true" name="question" rows="3"></textarea></label><label>Why it matters (optional)<input name="note"></label><button class="secondary" type="submit" aria-label="Add question">Add question</button></form></details>
      <section class="export-panel" aria-labelledby="export-title"><h2 id="export-title">Export your packet</h2><p>Before printing, remove anything you do not want to share. Your browser can save the printout as a PDF.</p><button id="print" class="primary">Print or save as PDF</button><button id="encrypted-export" class="secondary">Download encrypted bundle</button><button id="json-export" class="text-button">Download plain JSON</button><label class="import-label">Restore encrypted bundle<input id="import-file" type="file" accept="application/json"></label></section>
    </aside>
    <section class="preview-area" aria-label="Packet preview"><div class="preview-label"><span>Live packet preview</span><span>Review before printing</span></div><article id="packet-sheet" tabindex="-1"></article></section>
  </section>`;
}

function informationHtml() {
  return `<section id="how-it-works" class="how-it-works" aria-labelledby="how-title"><h2 id="how-title">How it works</h2><ol><li><strong>Select details.</strong><span>Copy only the results, medicines, and questions needed for this visit.</span></li><li><strong>Keep sources.</strong><span>Add the source and date beside each selected result.</span></li><li><strong>Review and export.</strong><span>Print the visible packet or download a local backup.</span></li></ol></section>
  <section class="trust" aria-labelledby="privacy-limits-title"><h2 id="privacy-limits-title">Privacy and product limits</h2><div><p><b>Browser storage.</b> Packet details use this browser’s database. License details use browser settings.</p><p><b>No record retrieval.</b> You choose and copy each value. The product does not open patient portals.</p><p><b>No medical advice.</b> The packet preserves your words and values without interpreting them.</p></div></section>
  <section class="plus-panel" aria-labelledby="plus-title"><div><p class="eyebrow">Optional one-time purchase</p><h2 id="plus-title">${plus ? 'Plus is active' : 'Add a personal cover note'}</h2><p>${plus ? 'Your personal cover note stays in this browser and can appear at the top of the printable packet.' : 'Plus costs $9 once and adds a personal cover note. The builder, accessibility features, safety steps, backups, and exports stay free.'}</p></div>${plus ? '<span class="plus-active">License active</span>' : '<div class="plus-actions"><a class="primary" href="https://api.sociobot.in/api/v1/products/health-visit-packet/checkout">Buy Plus — $9 once</a><button id="restore-license" class="text-button">Restore a license</button></div>'}</section>`;
}

function dialogsHtml() {
  return `<dialog id="bundle-dialog" aria-labelledby="bundle-title"><form method="dialog" id="bundle-form"><button class="close" type="button" data-close-dialog aria-label="Close encrypted backup">×</button><p class="eyebrow">Encrypted backup</p><h2 id="bundle-title">Choose a passphrase</h2><p>This encrypts a copy before download. We cannot recover a forgotten passphrase.</p><label>Passphrase<input name="passphrase" type="password" minlength="8" autocomplete="new-password" required></label><p id="dialog-error" class="error" role="alert"></p><button class="primary" value="default">Encrypt and download</button></form></dialog>
  <dialog id="restore-dialog" aria-labelledby="restore-title"><form method="dialog" id="restore-form"><button class="close" type="button" data-close-dialog aria-label="Close packet restore">×</button><p class="eyebrow">Restore packet</p><h2 id="restore-title">Open your encrypted bundle</h2><label>Passphrase<input name="passphrase" type="password" required></label><p id="restore-error" class="error" role="alert"></p><button class="primary" value="default">Restore and replace this packet</button></form></dialog>
  <dialog id="license-dialog" aria-labelledby="license-title"><form method="dialog" id="license-form"><button class="close" type="button" data-close-dialog aria-label="Close license restore">×</button><p class="eyebrow">Restore Plus</p><h2 id="license-title">Paste your license</h2><label>License token<input name="license" autocomplete="off" required></label><p id="license-error" class="error" role="alert"></p><button class="primary" value="default">Restore license</button></form></dialog>`;
}

function render() {
  $('#app').innerHTML = `${headerHtml()}${isDemo ? '<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" class="text-button">Reset demo</button><button id="start-real" class="primary">Start for real</button></div></aside>' : ''}
    <main id="main" tabindex="-1">${firstScreenHtml()}<div class="offline" id="offline" hidden role="status">You are offline. This packet is still available.</div><div id="notice" class="notice" hidden role="status" aria-live="polite"><span id="notice-text"></span><button id="undo-delete" class="notice-action" type="button" aria-label="Undo removal" hidden>Undo removal</button><button id="dismiss-notice" class="notice-dismiss" type="button" aria-label="Dismiss message">×</button></div><div id="update-notice" class="update-notice" hidden role="status"><span>A new version is ready.</span><button id="apply-update" type="button">Refresh to update</button></div>${workspaceHtml()}${informationHtml()}</main>
    <footer><span>Build a private packet for one health visit.</span><span><a href="/privacy/" ${isDemo ? 'data-exit-demo' : ''}>Privacy</a> · <a href="/terms/" ${isDemo ? 'data-exit-demo' : ''}>Terms</a> · Built by Param Factory · Version 1.1.0</span></footer>${dialogsHtml()}`;
  renderPacket();
  bind();
  const notice = pendingNotice;
  pendingNotice = undefined;
  if (notice) announce(notice.message, notice.offerUndo);
}

function bindDeletes() {
  document.querySelectorAll<HTMLButtonElement>('.delete').forEach(button => {
    button.onclick = () => {
      const kind = button.dataset.kind as ListKind;
      const id = button.dataset.id;
      const entries = packet[kind] as Array<SourceItem | Medication | Question>;
      const index = entries.findIndex(entry => entry.id === id);
      if (index < 0) return;
      deletedEntry = { kind, index, item: entries[index] };
      entries.splice(index, 1);
      queueSave();
      render();
      announce('Entry removed from your packet.', true);
    };
  });
}

function undoRemoval() {
  if (!deletedEntry) return;
  const { kind, index, item } = deletedEntry;
  if (kind === 'observations') packet.observations.splice(index, 0, item as SourceItem);
  if (kind === 'medications') packet.medications.splice(index, 0, item as Medication);
  if (kind === 'questions') packet.questions.splice(index, 0, item as Question);
  deletedEntry = undefined;
  queueSave();
  render();
  announce('Entry restored.');
}

async function deleteDemoDatabase() {
  window.clearTimeout(saveTimer);
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DEMO_DB);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Demo storage is busy.'));
  });
}

async function resetDemo() {
  packet = samplePacket();
  await writePacket();
  render();
  announce('Demo reset to the original sample.');
}

async function leaveDemo(target = '/') {
  try {
    await deleteDemoDatabase();
    location.assign(target);
  } catch {
    announce('The demo could not be cleared. Close this tab before starting your packet.');
  }
}

function bind() {
  $('#undo-delete').addEventListener('click', undoRemoval);
  $('#dismiss-notice').addEventListener('click', () => { $<HTMLElement>('#notice').hidden = true; deletedEntry = undefined; });
  document.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
  document.querySelectorAll<HTMLAnchorElement>('[data-exit-demo]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); void leaveDemo(link.href); }));
  if (isDemo) {
    $('#reset-demo').addEventListener('click', () => void resetDemo());
    $('#start-real').addEventListener('click', () => void leaveDemo('/'));
  }

  $('#profile-form').addEventListener('input', event => {
    const target = event.target as HTMLInputElement;
    if (target.name in packet.profile) {
      (packet.profile as Record<string, string>)[target.name] = target.value;
      queueSave();
      renderPacket();
    }
  });
  const add = (id: string, create: (data: FormData) => SourceItem | Medication | Question) => $<HTMLFormElement>(id).addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const item = create(new FormData(form));
    if (id === '#observation-form') packet.observations.push(item as SourceItem);
    if (id === '#medication-form') packet.medications.push(item as Medication);
    if (id === '#question-form') packet.questions.push(item as Question);
    form.reset();
    queueSave();
    render();
    announce('Added to your packet.');
  });
  add('#observation-form', data => ({ id: uid(), label: String(data.get('label')), value: String(data.get('value')), unit: String(data.get('unit')), source: String(data.get('source')), date: String(data.get('date')), note: String(data.get('note')) }));
  add('#medication-form', data => ({ id: uid(), name: String(data.get('name')), dose: String(data.get('dose')), schedule: String(data.get('schedule')), source: String(data.get('source')) }));
  add('#question-form', data => ({ id: uid(), question: String(data.get('question')), note: String(data.get('note')) }));

  $('#print').addEventListener('click', () => { announce('Opening print settings. Review the packet before saving a PDF.'); window.print(); });
  $('#json-export').addEventListener('click', () => {
    if (!confirm('Plain JSON can be read by anyone with the file. Download it?')) return;
    download('health-visit-packet.json', JSON.stringify(packet, null, 2));
    announce('Plain JSON downloaded.');
  });

  const bundleDialog = $<HTMLDialogElement>('#bundle-dialog');
  $('#encrypted-export').addEventListener('click', () => bundleDialog.showModal());
  $('#bundle-form').addEventListener('submit', async event => {
    event.preventDefault();
    const passphrase = String(new FormData(event.currentTarget as HTMLFormElement).get('passphrase'));
    try {
      const bundle = await encryptBundle(packet, passphrase);
      download('health-visit-packet.encrypted.json', JSON.stringify(bundle));
      bundleDialog.close();
      announce('Encrypted bundle downloaded. Keep the passphrase separately.');
    } catch (error) {
      $('#dialog-error').textContent = error instanceof Error ? error.message : 'Could not encrypt the bundle.';
    }
  });

  let selectedBundle: EncryptedBundle | undefined;
  const restoreDialog = $<HTMLDialogElement>('#restore-dialog');
  $('#import-file').addEventListener('change', async event => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<EncryptedBundle>;
      if (parsed.format !== 'health-visit-packet.encrypted.v1' || typeof parsed.salt !== 'string' || typeof parsed.iv !== 'string' || typeof parsed.ciphertext !== 'string') throw new Error('invalid bundle');
      selectedBundle = parsed as EncryptedBundle;
      restoreDialog.showModal();
    } catch {
      announce('That file is not a valid encrypted packet. Choose a Health Visit Packet encrypted JSON file and try again.');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  });
  $('#restore-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const data = await decryptBundle(selectedBundle!, String(new FormData(event.currentTarget as HTMLFormElement).get('passphrase')));
      if (!data || typeof data !== 'object' || (data as Packet).version !== 1) throw new Error('This bundle does not contain a valid packet.');
      packet = data as Packet;
      queueSave();
      restoreDialog.close();
      render();
      announce('Packet restored in this browser.');
    } catch (error) {
      $('#restore-error').textContent = error instanceof Error ? error.message : 'Could not restore that bundle.';
    }
  });

  const licenseDialog = $<HTMLDialogElement>('#license-dialog');
  document.querySelector('#restore-license')?.addEventListener('click', () => licenseDialog.showModal());
  $('#license-form').addEventListener('submit', async event => {
    event.preventDefault();
    const token = String(new FormData(event.currentTarget as HTMLFormElement).get('license')).trim();
    if (!token) return;
    localStorage.setItem(LICENSE_KEY, token);
    localStorage.removeItem(VERDICT_KEY);
    plus = true;
    licenseDialog.close();
    render();
    announce('License saved. Checking it in the background.');
    void verifyLicense();
  });
}

function readCachedVerdict(): { checkedAt?: number; valid?: boolean } {
  try { return JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as { checkedAt?: number; valid?: boolean }; } catch { return {}; }
}

async function verifyLicense() {
  if (isDemo) return;
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token || !navigator.onLine) return;
  try {
    const old = readCachedVerdict();
    if (old.checkedAt && Date.now() - old.checkedAt < 86400000) return;
    const response = await fetch(`https://api.sociobot.in/api/v1/products/health-visit-packet/verify?license=${encodeURIComponent(token)}`);
    const verdict = await response.json() as { valid?: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ checkedAt: Date.now(), valid: verdict.valid === true }));
    if (!verdict.valid) {
      plus = false;
      render();
      announce('This license is no longer active. Your packet and free tools are still available.');
    }
  } catch {
    // Offline and transient failures keep the cached local state.
  }
}

function showServiceWorkerUpdate(worker: ServiceWorker) {
  const notice = $<HTMLElement>('#update-notice');
  notice.hidden = false;
  $('#apply-update').addEventListener('click', () => { reloadForUpdate = true; worker.postMessage({ type: 'SKIP_WAITING' }); }, { once: true });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (registration.waiting && navigator.serviceWorker.controller) showServiceWorkerUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showServiceWorkerUpdate(worker); });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloadForUpdate) location.reload(); });
    await navigator.serviceWorker.ready;
  } catch {
    // The local app still works if service-worker registration is unavailable.
  }
}

function setRouteMetadata() {
  if (!isDemo) return;
  document.title = 'Demo — Health Visit Packet';
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', 'https://health-visit-packet.sociobot.in/demo');
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', 'Demo — Health Visit Packet');
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', 'https://health-visit-packet.sociobot.in/demo');
}

async function init() {
  setRouteMetadata();
  if (!isDemo) {
    const query = new URLSearchParams(location.search);
    const returnedLicense = query.get('license');
    if (returnedLicense) {
      localStorage.setItem(LICENSE_KEY, returnedLicense);
      localStorage.removeItem(VERDICT_KEY);
      history.replaceState({}, '', `${location.pathname}${location.hash}`);
    }
    const cached = readCachedVerdict();
    plus = Boolean(localStorage.getItem(LICENSE_KEY)) && cached.valid !== false;
  }
  await loadPacket();
  render();
  const updateConnectionState = () => { $<HTMLElement>('#offline').hidden = navigator.onLine; };
  addEventListener('online', updateConnectionState);
  addEventListener('offline', updateConnectionState);
  updateConnectionState();
  void verifyLicense();
  void registerServiceWorker();
}

void init();
