#!/usr/bin/env node
const clean = value => String(value ?? '').toLowerCase().normalize('NFKC').replace(/[^0-9a-z가-힣]+/g, ' ').trim();
const words = value => [...new Set(clean(value).split(/\s+/).filter(word => word.length > 1))];

export function classifyDomain(input, catalog) {
  if (!catalog || catalog.schema !== 'crh-domain-catalog/v1' || !Array.isArray(catalog.entries) || catalog.entries.length !== 500) throw new Error('CRH domain classifier: 500개 카탈로그가 필요합니다.');
  input = input || {};
  const source = [input.name, input.description, ...(input.features || []), ...(input.users || []), input.revenueModel, ...(input.platforms || [])].map(clean).filter(Boolean).join(' ');
  if (source.length < 12) return { schema: 'crh-domain-classification/v1', status: 'unavailable', primary: null, secondary: [], unknownReasons: ['제품 설명과 기능 근거가 부족합니다.'] };
  const tokens = words(source);
  const ranked = catalog.entries.map(entry => {
    const domain = clean(entry.domain), search = clean(entry.searchTerm), hay = domain + ' ' + search;
    const matchedTerms = tokens.filter(token => hay.includes(token) || token.includes(domain));
    const exact = source.includes(domain) || source.includes(search);
    const score = matchedTerms.length || exact ? Math.min(100, (exact ? 58 : 0) + matchedTerms.length * 12) : 0;
    return { id: 'domain-' + String(entry.rank).padStart(3, '0'), rank: entry.rank, name: entry.domain, searchTerm: entry.searchTerm, confidence: score, matchedTerms };
  }).filter(row => row.confidence > 0).sort((a, b) => b.confidence - a.confidence || a.rank - b.rank);
  if (!ranked.length) return { schema: 'crh-domain-classification/v1', status: 'unavailable', primary: null, secondary: [], unknownReasons: ['500개 카탈로그에서 설명과 일치하는 단서를 찾지 못했습니다.'] };
  return { schema: 'crh-domain-classification/v1', status: 'candidate', primary: ranked[0], secondary: ranked.slice(1, 3), unknownReasons: ranked[0].confidence < 45 ? ['주 후보의 신뢰도가 낮아 사람 확인이 필요합니다.'] : [] };
}

if (typeof process !== 'undefined' && process.versions?.node) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const HERE = path.dirname(fileURLToPath(import.meta.url));
  if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inputPath = process.argv[2];
  if (!inputPath) { console.error('사용법: node domain-classifier.mjs <project.json> [catalog.json]'); process.exit(1); }
  const input = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  const catalogPath = path.resolve(process.argv[3] || path.join(HERE, '..', 'content', 'domain-catalog-v1.json'));
  console.log(JSON.stringify(classifyDomain(input, JSON.parse(fs.readFileSync(catalogPath, 'utf8'))), null, 2));
  }
}
