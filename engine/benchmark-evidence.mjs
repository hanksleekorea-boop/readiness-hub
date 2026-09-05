const DIMENSIONS = ['features', 'ux', 'performance', 'trust', 'reach', 'price', 'monetization', 'localization'];
const day = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10) ? value : null;
};
const score = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
const text = value => String(value ?? '').trim();

function normalize(row, index) {
  const errors = [];
  if (!text(row?.name)) errors.push('name');
  if (!['direct', 'adjacent', 'reference'].includes(row?.type)) errors.push('type');
  try { const url = new URL(row?.observedUrl); if (url.protocol !== 'https:' || url.username || url.password) errors.push('observedUrl'); } catch { errors.push('observedUrl'); }
  if (!day(row?.observedAt)) errors.push('observedAt');
  const scores = {};
  for (const key of DIMENSIONS) {
    const value = score(row?.scores?.[key]);
    if (value !== null) scores[key] = value;
  }
  if (!Object.keys(scores).length) errors.push('scores');
  return { index, name: text(row?.name), type: row?.type, observedUrl: text(row?.observedUrl), observedAt: day(row?.observedAt), confidence: ['high', 'medium', 'low'].includes(row?.confidence) ? row.confidence : 'low', scores, errors };
}

export function compareEvidence(ours, comparators) {
  const rows = (Array.isArray(comparators) ? comparators : []).map(normalize);
  const invalid = rows.filter(row => row.errors.length);
  if (invalid.length) return { schema: 'crh-benchmark-evidence-result/v1', status: 'unavailable', reason: '필수 비교 근거가 빠진 서비스가 있습니다.', invalid, researchGaps: invalid.map(row => `${row.name || row.index + 1}: ${row.errors.join(', ')}`) };
  const identities = rows.map(row => row.name.toLocaleLowerCase().replace(/\s+/g, ''));
  const urls = rows.map(row => { const url = new URL(row.observedUrl); return url.origin + url.pathname.replace(/\/$/, ''); });
  if (new Set(identities).size !== rows.length || new Set(urls).size !== rows.length) return { status:'unavailable', reason:'같은 서비스 또는 같은 근거 주소가 중복되었습니다.', researchGaps:['서로 다른 서비스 3개 이상을 확인하세요.'] };
  const stale = rows.filter(row => Date.now() - new Date(row.observedAt + 'T00:00:00Z').getTime() > 180 * 86400000);
  if (stale.length) return { status:'unavailable', reason:'180일이 지난 비교 근거를 다시 확인해야 합니다.', researchGaps:stale.map(row => row.name + ': 관찰일 갱신 필요') };
  if (rows.length < 3) return { schema: 'crh-benchmark-evidence-result/v1', status: 'unavailable', reason: '비교 서비스가 3개 미만입니다.', comparators: rows.length, researchGaps: ['같은 평가 축과 공개 근거를 가진 비교 서비스 ' + (3 - rows.length) + '개를 더 조사하세요.'] };
  const dimensions = [];
  for (const key of DIMENSIONS) {
    const own = score(ours?.[key]);
    const values = rows.map(row => row.scores[key]).filter(Number.isFinite);
    if (own === null || values.length < 3) continue;
    const below = values.filter(value => value < own).length;
    const equal = values.filter(value => value === own).length;
    dimensions.push({ key, ours: own, comparisonCount: values.length, average: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100, percentile: Math.round((below + equal * 0.5) / values.length * 1000) / 10 });
  }
  if (!dimensions.length) return { schema: 'crh-benchmark-evidence-result/v1', status: 'unavailable', reason: '세 서비스에서 공통으로 확인된 평가 축이 없습니다.', comparators: rows.length, researchGaps: ['동일한 축으로 다시 관찰하세요.'] };
  return { schema: 'crh-benchmark-evidence-result/v1', status: 'calculated', comparators: rows.length, dimensions, overallPercentile: Math.round(dimensions.reduce((sum, row) => sum + row.percentile, 0) / dimensions.length * 10) / 10, caution: '입력한 비교 집단 안의 상대 위치이며 시장 전체 순위가 아닙니다.' };
}

export { DIMENSIONS };
