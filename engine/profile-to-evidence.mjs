#!/usr/bin/env node
/*
 * Converts a Readiness Hub service profile into CRH engine evidence.
 * The bridge accepts both the newer evidenceV1 object and legacy scores/when/ev/notes fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const day = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
const text = value => String(value ?? '').replace(/[\r\n]/g, ' ').trim();
const fail = message => { throw new Error(`CRH profile bridge: ${message}`); };
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));

function latestTarget(profile) {
  const rows = Array.isArray(profile.autoLog) ? profile.autoLog : [];
  return [...rows].reverse().map(row => text(row?.target)).find(Boolean) || null;
}

function legacyTier(profile, platform, id) {
  const note = text(profile.notes?.[platform]?.[id]);
  if (/^\[자동 측정\]/.test(note)) return 'auto';
  const value = profile.ev?.[platform]?.[id];
  return [1, 2, 3].includes(value) ? String(value) : 'self';
}

function normaliseValue(value, fallback = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return { ...value };
  if (value === 'unknown' || value === 'unk') return { score: 'unknown', ...fallback };
  if (value === 'na') return { score: 'na', ...fallback };
  if (Number.isInteger(value) && value >= 0 && value <= 4) return { score: value, ...fallback };
  return null;
}

function bridgePlatform(profile, platform) {
  const result = {};
  const modern = profile.evidenceV1?.[platform] || {};
  const ids = new Set([...Object.keys(profile.scores?.[platform] || {}), ...Object.keys(modern)]);
  for (const id of ids) {
    const raw = modern[id] ?? profile.scores?.[platform]?.[id];
    const fallback = {
      observedAt: day(profile.when?.[platform]?.[id]) || day(profile.date) || undefined,
      tier: legacyTier(profile, platform, id),
      note: text(profile.notes?.[platform]?.[id]) || undefined,
    };
    const entry = normaliseValue(raw, fallback);
    if (!entry) continue;
    entry.observedAt = day(entry.observedAt) || fallback.observedAt;
    entry.tier = text(entry.tier) || fallback.tier;
    entry.note = text(entry.note) || fallback.note;
    if (entry.sourceUrl) entry.sourceUrl = text(entry.sourceUrl);
    if (entry.target) entry.target = text(entry.target);
    if (entry.score === 'na' && !text(entry.naReason) && entry.note) entry.naReason = entry.note;
    Object.keys(entry).forEach(key => entry[key] === undefined || entry[key] === '' ? delete entry[key] : null);
    result[id] = entry;
  }
  return result;
}

function comparators(profile) {
  const rows = profile.bench?.comps || profile.benchmark?.comparators || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    name: text(row.name || row.n || `비교 서비스 ${index + 1}`),
    scores: row.scores || row.s || {},
  })).filter(row => row.name && row.scores && typeof row.scores === 'object');
}

export function profileToEvidence(profile, options = {}) {
  if (!profile || typeof profile !== 'object') fail('프로필 JSON 객체가 필요합니다.');
  const target = text(options.target || latestTarget(profile)) || null;
  const name = text(options.name || profile.svc || profile.project?.name || '이름 미입력');
  const evidence = { mobile: bridgePlatform(profile, 'mobile'), web: bridgePlatform(profile, 'web') };
  const direction = profile.dir || profile.direction || {};
  const ours = profile.bench?.ours || profile.benchmark?.ours || {};
  return {
    schema: 'crh-project-evidence/v1',
    assessedAt: day(options.assessedAt || profile.date) || new Date().toISOString().slice(0, 10),
    scope: options.scope || profile.scope || 'all',
    project: {
      name,
      repository: text(options.repository || profile.repository) || undefined,
      description: text(options.description || profile.description || `${name} Readiness Hub 프로필에서 자동 변환한 증거입니다.`),
      urls: { web: target || undefined, mobile: text(options.mobileUrl || profile.mobileUrl) || undefined },
      features: Array.isArray(profile.features) ? profile.features : [],
    },
    direction,
    axisWeights: profile.axisW || profile.axisWeights || undefined,
    evidence,
    benchmark: { ours, comparators: comparators(profile) },
    conversion: {
      source: 'readiness-hub-profile/v1',
      convertedAt: new Date().toISOString(),
      sourceProfileDate: day(profile.date),
      target,
      automaticGaps: Array.isArray(profile.automaticGaps) ? profile.automaticGaps : [],
    },
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (['--profile', '--out', '--name', '--target', '--mobile-url', '--repository', '--description', '--scope', '--assessed-at'].includes(arg)) args[arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = argv[++i];
    else fail(`알 수 없는 인수: ${arg}`);
  }
  return args;
}

function usage() {
  return '사용법: node profile-to-evidence.mjs --profile <profiles/service.json> [--out <project-evidence.json>] [--name <제품명>] [--target <PC URL>] [--mobile-url <모바일 URL>]';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) { console.log(usage()); process.exit(0); }
    if (!args.profile) fail('--profile이 필요합니다.');
    const result = profileToEvidence(readJson(path.resolve(args.profile)), args);
    if (args.out) {
      const target = path.resolve(args.out);
      if (fs.existsSync(target)) fail(`${target} 파일이 이미 있습니다.`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      console.log(JSON.stringify({ ok: true, out: target, mobile: Object.keys(result.evidence.mobile).length, web: Object.keys(result.evidence.web).length }, null, 2));
    } else console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
