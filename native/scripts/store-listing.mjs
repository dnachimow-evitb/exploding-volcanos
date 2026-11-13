// Fills in the App Store listing through the App Store Connect API, so Derek does not have to type it in.
// Run by .github/workflows/store-listing.yml (Actions > Store listing > Run workflow). It never submits the app
// for review: that button stays with Derek.
//
// What it enters comes from native/STORE-LISTING.md (the fenced blocks under "Promotional text", "Description",
// "Keywords" and "Notes for the App Review team") and native/screenshots/*.png, plus the constants below.
// Each step is tried on its own; a failed step is reported and the rest still run. Safe to run again.
// Needs ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 in the environment.  `node store-listing.mjs --check` only parses
// the listing file and tests the signing code, without contacting Apple.
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), native = join(here, '..');
const SITE = 'https://dnachimow-evitb.github.io/exploding-volcanos/';
const CFG = {
  bundleId: 'com.explodingvolcanoes.app',
  locale: 'en-US',
  subtitle: 'In The Bathtub',
  privacyPolicyUrl: SITE + 'privacy.html',
  supportUrl: SITE + 'support.html',
  marketingUrl: SITE + 'story.html',
  copyright: '2026 Derek Nachimow',
  categories: { primaryCategory: 'GAMES', primarySubcategoryOne: 'GAMES_FAMILY', primarySubcategoryTwo: 'GAMES_CASUAL' },
  screenshotType: 'APP_IPHONE_67',   // the 6.7 / 6.9-inch iPhone slot (1320 x 2868)
  review: { contactFirstName: 'Derek', contactLastName: 'Nachimow', contactEmail: 'dnachimow@gmail.com', demoAccountRequired: false },
};

// ── the listing text ──
function listing() {
  const md = readFileSync(join(native, 'STORE-LISTING.md'), 'utf8');
  const block = (heading) => {
    const i = md.indexOf('## ' + heading);
    if (i < 0) throw new Error(`STORE-LISTING.md has no "## ${heading}" section`);
    const m = md.slice(i).match(/```\n([\s\S]*?)\n```/);
    if (!m) throw new Error(`no text block under "## ${heading}"`);
    return m[1].trim();
  };
  const L = { promotionalText: block('Promotional text'), description: block('Description'), keywords: block('Keywords'), notes: block('Notes for the App Review team') };
  const max = { promotionalText: 170, description: 4000, keywords: 100, notes: 4000 };
  for (const k in max) if (L[k].length > max[k]) throw new Error(`${k} is ${L[k].length} characters; Apple allows ${max[k]}`);
  return L;
}

// ── signing ──
function pemFromSecret(raw) {   // tolerant of how the key was pasted (same rules as the upload job)
  const body = raw.replace(/[-‐-―]+\s*(BEGIN|END)[A-Z ]*PRIVATE KEY\s*[-‐-―]+/g, '').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]{120,400}={0,2}$/.test(body)) throw new Error(`ASC_KEY_P8 does not look like a .p8 key (${body.length} characters after removing spaces)`);
  return '-----BEGIN PRIVATE KEY-----\n' + body.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n';
}
const b64u = (x) => Buffer.from(x).toString('base64url');
function jwt(key, keyId, issuer) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: issuer, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' }));
  const sig = sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return head + '.' + body + '.' + b64u(sig);
}

if (process.argv.includes('--check')) {
  const L = listing();
  console.log('listing ok:', Object.entries(L).map(([k, v]) => `${k} ${v.length}`).join(', '));
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const t = jwt(createPrivateKey(pemFromSecret(pem.split('\n').slice(1, -2).join(' '))), 'KID', 'ISS').split('.');
  const ok = verify('sha256', Buffer.from(t[0] + '.' + t[1]), { key: createPublicKey(privateKey), dsaEncoding: 'ieee-p1363' }, Buffer.from(t[2], 'base64url'));
  console.log('signing ok:', ok);
  console.log('screenshots:', readdirSync(join(native, 'screenshots')).filter(f => f.endsWith('.png')).sort().join(', '));
  process.exit(ok ? 0 : 1);
}

// ── talking to Apple ──
for (const v of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) if (!process.env[v]) { console.error(`::error::secret ${v} is missing`); process.exit(1); }
const KEY = createPrivateKey(pemFromSecret(process.env.ASC_KEY_P8));
let token = '', tokenAt = 0;
async function api(method, path, body) {
  if (Date.now() - tokenAt > 10 * 60e3) { token = jwt(KEY, process.env.ASC_KEY_ID, process.env.ASC_ISSUER_ID); tokenAt = Date.now(); }
  const res = await fetch(path.startsWith('http') ? path : 'https://api.appstoreconnect.apple.com' + path, {
    method, headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch (e) {}
  if (!res.ok) {
    const why = json && json.errors ? json.errors.map(e => `${e.code || ''}: ${e.detail || e.title || ''}`).join(' | ') : text.slice(0, 300);
    const err = new Error(`${method} ${path.split('?')[0]} -> ${res.status} ${why}`); err.status = res.status; throw err;
  }
  return json;
}
const rel = (type, id) => ({ data: { type, id } });
const results = [];
async function step(name, fn) {
  try { const note = await fn(); results.push(['done', name, note || '']); console.log(`OK    ${name}${note ? ' (' + note + ')' : ''}`); }
  catch (e) { results.push(['FAILED', name, e.message]); console.log(`FAIL  ${name}: ${e.message}`); }
}

const L = listing();
const apps = await api('GET', `/v1/apps?filter[bundleId]=${CFG.bundleId}`);
if (!apps.data.length) { console.error(`::error::No app with bundle ID ${CFG.bundleId} in App Store Connect`); process.exit(1); }
const app = apps.data[0];
console.log(`App: ${app.attributes.name} (${app.id})`);

const versions = (await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=10`)).data;
const editable = (v) => ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY'].includes(v.attributes.appStoreState || v.attributes.appVersionState);
const version = versions.find(editable);
if (!version) { console.error('::error::No editable App Store version (already submitted or live?). States: ' + versions.map(v => v.attributes.appStoreState).join(', ')); process.exit(1); }
console.log(`Version: ${version.attributes.versionString} (${version.attributes.appStoreState || version.attributes.appVersionState})`);
const infos = (await api('GET', `/v1/apps/${app.id}/appInfos`)).data;
const info = infos.find(i => !['READY_FOR_SALE', 'READY_FOR_DISTRIBUTION'].includes(i.attributes.appStoreState || i.attributes.state)) || infos[0];

await step('Subtitle and privacy policy link', async () => {
  const locs = (await api('GET', `/v1/appInfos/${info.id}/appInfoLocalizations`)).data;
  const loc = locs.find(l => l.attributes.locale === CFG.locale) || locs[0];
  await api('PATCH', `/v1/appInfoLocalizations/${loc.id}`, { data: { type: 'appInfoLocalizations', id: loc.id, attributes: { subtitle: CFG.subtitle, privacyPolicyUrl: CFG.privacyPolicyUrl } } });
  return loc.attributes.locale;
});

await step('Category: Games (Family, Casual)', async () => {
  const relationships = {}; for (const k in CFG.categories) relationships[k] = rel('appCategories', CFG.categories[k]);
  await api('PATCH', `/v1/appInfos/${info.id}`, { data: { type: 'appInfos', id: info.id, relationships } });
});

await step('Age rating answers (all None / No)', async () => {
  const decl = (await api('GET', `/v1/appInfos/${info.id}/ageRatingDeclaration`)).data;
  const skip = /Override$|^kidsAgeBand$|^seventeenPlus$|^ageRatingOverride/;
  const set = [], left = [];
  for (const k of Object.keys(decl.attributes)) {
    if (skip.test(k)) continue;
    const cur = decl.attributes[k];
    const tries = typeof cur === 'boolean' ? [false] : typeof cur === 'string' ? ['NONE'] : [false, 'NONE'];
    if (cur === false || cur === 'NONE') { set.push(k); continue; }
    let ok = false;
    for (const v of tries) {
      try { await api('PATCH', `/v1/ageRatingDeclarations/${decl.id}`, { data: { type: 'ageRatingDeclarations', id: decl.id, attributes: { [k]: v } } }); ok = true; break; } catch (e) { if (e.status !== 409 && e.status !== 400 && e.status !== 422) throw e; }
    }
    (ok ? set : left).push(k);
  }
  if (left.length) throw new Error(`${set.length} answered; could not answer: ${left.join(', ')} (answer these on Apple's site)`);
  return `${set.length} questions`;
});

await step('Content rights: no third-party content', async () => {
  await api('PATCH', `/v1/apps/${app.id}`, { data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT' } } });
});

await step('Copyright', async () => {
  await api('PATCH', `/v1/appStoreVersions/${version.id}`, { data: { type: 'appStoreVersions', id: version.id, attributes: { copyright: CFG.copyright } } });
  return CFG.copyright;
});

let vloc = null;
await step('Description, keywords, promotional text, links', async () => {
  const locs = (await api('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).data;
  vloc = locs.find(l => l.attributes.locale === CFG.locale) || locs[0];
  await api('PATCH', `/v1/appStoreVersionLocalizations/${vloc.id}`, { data: { type: 'appStoreVersionLocalizations', id: vloc.id,
    attributes: { description: L.description, keywords: L.keywords, promotionalText: L.promotionalText, supportUrl: CFG.supportUrl, marketingUrl: CFG.marketingUrl } } });
});

await step('Screenshots', async () => {
  if (!vloc) throw new Error('no version localization');
  const files = readdirSync(join(native, 'screenshots')).filter(f => f.endsWith('.png')).sort();
  const sets = (await api('GET', `/v1/appStoreVersionLocalizations/${vloc.id}/appScreenshotSets`)).data;
  let set = sets.find(s => s.attributes.screenshotDisplayType === CFG.screenshotType);
  if (!set) set = (await api('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: CFG.screenshotType }, relationships: { appStoreVersionLocalization: rel('appStoreVersionLocalizations', vloc.id) } } })).data;
  for (const old of (await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots`)).data) await api('DELETE', `/v1/appScreenshots/${old.id}`);
  for (const f of files) {
    const bytes = readFileSync(join(native, 'screenshots', f));
    const shot = (await api('POST', '/v1/appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName: f, fileSize: bytes.length }, relationships: { appScreenshotSet: rel('appScreenshotSets', set.id) } } })).data;
    for (const op of shot.attributes.uploadOperations) {
      const headers = {}; for (const h of op.requestHeaders || []) headers[h.name] = h.value;
      const r = await fetch(op.url, { method: op.method, headers, body: bytes.subarray(op.offset, op.offset + op.length) });
      if (!r.ok) throw new Error(`uploading ${f}: ${r.status}`);
    }
    await api('PATCH', `/v1/appScreenshots/${shot.id}`, { data: { type: 'appScreenshots', id: shot.id, attributes: { uploaded: true, sourceFileChecksum: createHash('md5').update(bytes).digest('hex') } } });
  }
  return `${files.length} uploaded; Apple checks them over the next few minutes`;
});

await step('Attach the newest build', async () => {
  const builds = (await api('GET', `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=10`)).data;
  const build = builds.find(b => b.attributes.processingState === 'VALID' && !b.attributes.expired);
  if (!build) throw new Error('no processed build found');
  await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, rel('builds', build.id));
  return `build ${build.attributes.version}`;
});

await step('Notes and contact for App Review (phone number still needed)', async () => {
  const attributes = { ...CFG.review, notes: L.notes };
  let existing = null;
  try { existing = (await api('GET', `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`)).data; } catch (e) { if (e.status !== 404) throw e; }
  if (existing) await api('PATCH', `/v1/appStoreReviewDetails/${existing.id}`, { data: { type: 'appStoreReviewDetails', id: existing.id, attributes } });
  else await api('POST', '/v1/appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes, relationships: { appStoreVersion: rel('appStoreVersions', version.id) } } });
});

await step('Price: free', async () => {
  const points = (await api('GET', `/v1/apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`)).data;
  const free = points.find(p => Number(p.attributes.customerPrice) === 0);
  if (!free) throw new Error('no free price point found');
  await api('POST', '/v1/appPriceSchedules', { data: { type: 'appPriceSchedules', relationships: { app: rel('apps', app.id), baseTerritory: rel('territories', 'USA'), manualPrices: { data: [{ type: 'appPrices', id: '${price1}' }] } } },
    included: [{ type: 'appPrices', id: '${price1}', attributes: { startDate: null }, relationships: { appPricePoint: rel('appPricePoints', free.id) } }] });
});

// ── summary ──
const failed = results.filter(r => r[0] === 'FAILED');
const lines = ['## Store listing', '', '| | Step | Note |', '|---|---|---|', ...results.map(r => `| ${r[0] === 'done' ? 'done' : '**FAILED**'} | ${r[1]} | ${String(r[2]).replace(/\|/g, '/').slice(0, 400)} |`), '',
  'Still for Derek on appstoreconnect.apple.com: App Privacy ("Data Not Collected"), countries (Pricing and Availability), a phone number under App Review Information, Kids category and EU trader status, then Add for Review / Submit.'];
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
console.log(`\n${results.length - failed.length} of ${results.length} steps done.`);
process.exit(failed.length ? 1 : 0);
