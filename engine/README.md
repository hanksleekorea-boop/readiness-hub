# 자동 실행 분석 엔진

이 폴더는 Continuous Readiness Index의 실제 분석 엔진 v1.0.1입니다. 서버나 npm 설치가 필요 없습니다. Node.js 18 이상에서 대상 프로젝트의 증거 JSON을 넣으면 PC 웹·모바일 점수, 40개 필수 게이트, 우선 갭, 비교 서비스 백분위, 제품 방향 정합도와 Markdown 보고서를 만듭니다.

```powershell
node .\readiness-engine.mjs --input .\project-evidence.json --out .\readiness-analysis.json --markdown .\readiness-analysis.md
```

`project-evidence.example.json`을 복사해 대상 프로젝트에 맞춰 채우면 됩니다. `score`는 0~4 정수이고, `unknown`과 `na`도 쓸 수 있습니다. 점수 객체에는 `observedAt`(YYYY-MM-DD), `tier`(1/2/3/auto/self), `note`를 함께 넣을 수 있습니다. 기준 렌즈와 엔진은 동일 폴더에 있어야 합니다.

공개 파일을 다른 프로젝트로 내려받아 실행할 때는 `engine-manifest.json`의 SHA-256 파일 지문값과 엔진·렌즈·예제 파일을 먼저 대조하십시오. 출력 파일은 기본적으로 기존 파일을 덮어쓰지 않으므로, 자동 실행 프롬프트 2.0처럼 실행 시각별 새 폴더를 사용하는 것이 안전합니다.

비교 서비스가 3개 미만이면 벤치마크 점수는 의도적으로 계산하지 않습니다. 자동으로 얻을 수 없는 평점·도달·가격·현지화 같은 값은 `benchmark.ours`와 `comparators`에 증거 기반으로 넣어야 합니다. 결과는 법률 자문이나 준수 인증이 아닙니다.

다른 Codex 프로젝트에 실제로 적용할 때는 [AUTOMATIC_ANALYSIS_PROMPT.md](AUTOMATIC_ANALYSIS_PROMPT.md)를 그대로 붙여 넣으십시오. 2.0판 프롬프트는 대상 프로젝트 증거 수집, 다운로드 무결성 확인, JSON 작성, 엔진 실행, 결과 자체검사와 로컬 Markdown·JSON 링크 제공까지 지시합니다.
