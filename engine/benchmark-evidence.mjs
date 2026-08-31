const DIMENSIONS = ['features', 'ux', 'performance', 'trust', 'reach', 'price', 'monetization', 'localization'];
const day = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
const text = value => String(value ?? '').trim();

function normalize(row, index) {
  const errors = [];
  if (!text(row?.name)) errors.push('name');
  if (!['direct', 'adjacent', 'reference'].includes(row?.type)) errors.push('type');
  if (!/^https:\/\//.test(text(row?.observedUrl))) errors.push('observedUrl');
  if (!day(row?.observedAt)) errors.push('observedAt');
  const scores = {};
  for (const key of DIMENSIONS) {
    const value = Number(row?.scores?.[key]);
    if (Number.isFinite(value) && value >= 0 && value <= 5) scores[key] = value;
  }
  if (!Object.keys(scores).length) errors.push('scores');
  return { index, name: text(row?.name), type: row?.type, observedUrl: text(row?.observedUrl), observedAt: day(row?.observedAt), confidence: ['high', 'medium', 'low'].includes(row?.confidence) ? row.confidence : 'low', scores, errors };
}

export function compareEvidence(ours, comparators) {
  const rows = (Array.isArray(comparators) ? comparators : []).map(normalize);
  const invalid = rows.filter(row => row.errors.length);
  if (invalid.length) return { schema: 'crh-benchmark-evidence-result/v1', status: 'unavailable', reason: '필수 비교 근거가 빠진 서비스가 있습니다.', invalid, researchGaps: invalid.map(row => `${row.name || row.index + 1}: ${row.errors.join(', ')}`) };
  if (rows.length < 3) return { schema: 'crh-benchmark-evidence-result/v1', status: 'unavailable', reason: '비교 서비스가 3개 미만입니다.', comparators: rows.length, researchGaps: ['같은 평가 축과 공개 근거를 가진 비교 서비스 ' + (3 - rows.length) + '개를 더 조사하세요.'] };
  const dimensions = [];
  for (const key of DIMENSIONS) {
    const own = Number(ours?.[key]);
    const values = rows.map(row => row.scores[key]).filter(Number.isFinite);
    if (!Number.isFinite(own) || own < 0 || own > 5 || values.length < 3) continue;
    const below = values.filter(value => value < own).length;
    const equal = values.filter(value => value === own).length;
    dimensions.push({ key, ours: own, comparisonCount: values.length, average: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100, percentile: Math.round((below + equal * 0.5) / values.length * 1000) / 10 });
  }
  if (!dimensions.length) return { schema: 'crh-benchmark-evidence-result/v1', status: 'unavailable', reason: '세 서비스에서 공통으로 확인된 평가 축이 없습니다.', comparators: rows.length, researchGaps: ['동일한 축으로 다시 관찰하세요.'] };
  return { schema: 'crh-benchmark-evidence-result/v1', status: 'calculated', comparators: rows.length, dimensions, overallPercentile: Math.round(dimensions.reduce((sum, row) => sum + row.percentile, 0) / dimensions.length * 10) / 10, caution: '입력한 비교 집단 안의 상대 위치이며 시장 전체 순위가 아닙니다.' };
}

export { DIMENSIONS };
