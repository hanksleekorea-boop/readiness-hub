# 상업화 준비도 허브 β (Continuous Readiness Index)

모바일앱과 PC웹의 **상업화 준비도**를 세 축으로 재고, 세계 상위 20개 서비스 실측 기준선과 비교하는 도구입니다.
서버가 필요 없습니다 — 정적 파일만 올리면 동작합니다.

## 세 축

| 축 | 무엇을 재는가 |
|---|---|
| ① 일반 기준 | 15개 영역 197개 기준 (외부 검증 109 · 자가진단 88), 필수 게이트 40개 |
| ② 시장 상대위치 | 유사 서비스 10개 대비 8개 차원 백분위 |
| ③ 방향 정합 | 우리가 가려는 방향의 핵심 항목 달성률 |

## v4/v5의 핵심 설계

- **증거 신선도** — 점수마다 확인일이 붙고, 근거등급별 유효기간(1차 180일·2차 120일·3차 60일·자가 365일)이 지나면 점수가 ×0.5로 감쇠합니다. *마지막 확인 시각이 없는 점수는 존재하지 않는 점수입니다.*
- **자가 신고와 외부 검증의 분리** — 점수를 두 갈래로 나눠 병기하고, "이 점수의 몇 %가 자기 신고인가"를 상시 표시합니다.
- **목표 대비 점수** — 만점이 아니라 스스로 고른 출시 목표(베타 60 / 오픈 70 / 정식 75 / 확장 85) 대비 도달률을 함께 봅니다.
- **단계별 범위** — ⓪ 3분 최소(8개) → ① 핵심 게이트(20) → ② 전체 게이트+방향 핵심(56) → ③ 전체(197). 어느 단계에서 멈춰도 점수·게이트 판정·갭 순위가 나옵니다. 가상 사용자 1000명 시험에서 이 설계로 결과 획득률이 20.3% → 73.1%로 올랐습니다.
- **게이트 승인 서명** — 게이트마다 승인자·승인일을 기록하고 90일 후 만료됩니다.

## 파일 구조

```
index.html              PC 웹판
m/index.html            모바일 앱판 (안드로이드 설치 가능)
dashboard.html          개발 진척 대시보드
terms/index.html        무료 베타 이용약관
privacy/index.html      실제 데이터 흐름 기준 개인정보 처리방침
account/delete/index.html  계정 없음 안내 + 브라우저 로컬 데이터 삭제
lens/lens-core-v2.1.json  한국 기준 포함 기본 렌즈 197개
lens/lens-eu-v1.0.json    EU/EEA 관할 호환 렌즈 197개
lens/lens-us-v1.0.json    미국 연방+캘리포니아 조건부 호환 렌즈 197개
profiles/*.json         서비스별 진단 상태 (자동 러너가 갱신)
progress.json           대시보드가 읽는 진척 데이터
persona-report.json     가상 사용자 1000명 시험 결과
assets/qr.js            QR 부호기 (자체 구현, 외부 의존 없음)
assets/shell.js         공개 주소 자동 인식 + 정책·삭제 링크
assets/legal.css        정책 페이지 공통 스타일
engine/readiness-engine.mjs  대상 프로젝트 증거 JSON을 실제 점수·갭·벤치마크 보고서로 계산하는 Node 엔진
engine/project-evidence.example.json  엔진 입력 예제
robots.txt, sitemap.xml 검색 로봇·정본 URL 안내
.github/workflows/readiness.yml   자동 측정 러너
sw.js, manifest.webmanifest       오프라인·설치 지원
```

## 인터넷에 공개하기 (약 3분)

1. GitHub에서 새 저장소를 만듭니다 (비공개도 가능하지만, Pages를 쓰려면 공개이거나 유료 요금제여야 합니다).
2. 이 폴더의 **내용물 전체**를 저장소 최상위에 올립니다.
3. `Settings → Pages → Source: Deploy from a branch → main / (root) → Save`
4. 1~2분 뒤 `https://<계정>.github.io/<저장소>/` 로 열립니다.
5. 열면 QR과 링크가 **자동으로 실제 주소로 바뀝니다** (별도 설정 불필요).

## 서비스 등록

진단 상태를 `JSON 저장`으로 내려받아 `profiles/서비스명.json` 으로 커밋한 뒤,
`.../index.html?profile=profiles/서비스명.json` 으로 접속하면 그 상태가 자동으로 열립니다.

## 자동 측정 러너

`Actions → 준비도 자동 측정 → Run workflow` 에서 대상 주소와 프로파일 이름을 넣으면
Lighthouse(성능·접근성·SEO)와 보안 헤더·정책 페이지를 자동으로 재서 `profiles/`에 기록합니다.
자동 측정된 항목은 근거등급 1차, 메모에 `[자동 측정]`이 붙어 자가 신고와 구분됩니다.

## 대상 프로젝트를 자동 분석하기

`engine/` 폴더는 화면을 수동으로 조작하지 않고 Readiness Hub의 산식으로 분석하는 실제 실행 엔진입니다. 대상 프로젝트에서 수집한 증거 JSON을 넣으면 모바일·PC 웹 점수, 40개 필수 게이트, 우선 갭, 비교 서비스 백분위와 방향 정합도를 JSON·Markdown 파일로 반환합니다.

```powershell
node .\engine\readiness-engine.mjs --input .\project-evidence.json --out .\readiness-analysis.json --markdown .\readiness-analysis.md
```

입력 예제와 형식은 [engine/README.md](engine/README.md)에 있습니다. 비교 대상이 세 개 미만이거나 자동화할 수 없는 시장 증거가 없을 때는 벤치마크를 계산 불가로 명확히 표시합니다.

## 기준을 바꾸려면

기본 렌즈는 `lens/lens-core-v2.1.json` 입니다. EU/EEA 또는 미국 기준을 쓰려면 해당 JSON을 내려받아 PC판 헤더의 `렌즈 ↑` 로 올리면 즉시 반영됩니다. 세 렌즈는 197개 ID와 가중치가 같아 기존 진단 상태를 보존합니다. 관할 렌즈의 `appliesWhen`은 적용성 확인 조건이며 법률 자문·준수 인증이 아닙니다.
장애나 스토어 반려를 겪을 때마다 "이걸 미리 물었어야 했나?"를 검토해 기준에 추가하십시오 — 이 파일이 조직의 학습 저장소입니다.

## 라이선스

MIT. 기준·산식·렌즈는 공개해 표준화를 노리고, 축적되는 벤치마크 분포 데이터는 별도 자산으로 둡니다.
