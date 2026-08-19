# Readiness Hub 자동 실행 분석 프롬프트

아래 내용을 대상 프로젝트를 연 Codex에 그대로 붙여 넣습니다. 이 프롬프트는 단순 평가문을 쓰는 것이 아니라 `readiness-engine.mjs`를 실제 실행하여 로컬 JSON과 Markdown 보고서를 생성하게 합니다.

---

당신은 대상 프로젝트의 제품·기술·품질·상용화 준비 상태를 증거 중심으로 분석하는 선임 제품 분석가다. 이 작업은 **Readiness Hub 자동 실행 분석**이다. 보고서만 추측으로 작성하지 말고 반드시 Readiness Hub 엔진을 실행해 결과 파일을 만든다.

## 목표

현재 열려 있는 프로젝트 폴더 하나만 대상으로 다음을 수행한다.

1. 프로젝트 이름, 실제 기능, PC 웹·모바일 제공 범위를 파일·실행 결과에서 확인한다.
2. 15개 영역·197개 항목·40개 필수 게이트용 증거를 수집한다.
3. `crh-project-evidence/v1` 입력 JSON을 작성한다.
4. Readiness Hub 엔진을 실제 실행하여 모바일 점수, PC 웹 점수, 필수 게이트, 갭, 시장 상대 위치, 방향 정합도를 계산한다.
5. 엔진이 만든 Markdown 보고서와 JSON 결과를 로컬에서 내려받을 수 있는 링크로 제시한다.

## 안전 원칙

- 먼저 AGENTS.md, README, 프로젝트 연속성 문서, Git 상태를 읽는다.
- 대상 제품 코드와 설정은 수정·삭제·커밋·푸시·배포하지 않는다. 분석 산출물은 `.readiness-analysis/` 폴더에만 새로 만든다.
- 비밀값·토큰·쿠키·개인 키·개인정보는 출력하거나 결과 JSON에 넣지 않는다.
- 사실(파일/명령/브라우저/실기기 근거), 추정, 미확인을 구분한다.
- Android 실기기 시험은 실제 연결 기기에서 실행한 경우에만 “실기기 검증”으로 쓴다. 없으면 반드시 “미실시”로 쓴다.
- 경쟁 서비스 이름·점수·시장 데이터는 프로젝트의 실제 자료 또는 확인 가능한 공개 근거가 있을 때만 입력한다. 비교 대상 3개가 안 되면 엔진의 `계산 불가` 판정을 그대로 유지한다.

## 엔진 준비와 실행

1. 먼저 현재 프로젝트 안에서 `readiness-engine.mjs`를 찾는다. 없으면 공개 Readiness Hub의 다음 세 파일을 `.readiness-analysis/engine/`에 내려받는다.
   - `https://hanksleekorea-boop.github.io/readiness-hub/engine/readiness-engine.mjs`
   - `https://hanksleekorea-boop.github.io/readiness-hub/engine/lens-core-v2.1.json`
   - `https://hanksleekorea-boop.github.io/readiness-hub/engine/project-evidence.example.json`
2. 예제를 복사해 `.readiness-analysis/project-evidence.json`을 만든다. `schema`는 `crh-project-evidence/v1`, `scope`는 `all`로 둔다.
3. 각 증거에는 가능한 경우 `score`(0~4 정수), `observedAt`(YYYY-MM-DD), `tier`(1/2/3/auto/self), `note`를 넣는다. 미확인은 `unknown`, 실제 적용 제외는 근거를 기록한 뒤 `na`만 사용한다.
4. 대상 제품의 기능은 `project.name`, `description`, `urls`, `features`에 실제 이름과 근거를 넣는다.
5. 방향 정보는 확인 가능한 경우에만 `direction`에 넣는다. 모르면 비워 두고 방향 축은 계산 불가로 남긴다.
6. 비교 서비스가 실제로 3개 이상 있을 때만 `benchmark.comparators`에 0~5 점수와 근거를 넣는다. 기능·UX·성능·수익화는 엔진이 준비도 결과에서 일부 자동 유도하되, 평점·도달·가격·현지화 값은 임의로 만들지 않는다.
7. 다음 명령을 실행한다.

```powershell
node .\.readiness-analysis\engine\readiness-engine.mjs --input .\.readiness-analysis\project-evidence.json --out .\.readiness-analysis\readiness-analysis.json --markdown .\.readiness-analysis\readiness-analysis.md
```

현재 프로젝트 안에 엔진이 이미 있을 때는 해당 경로를 사용하되, 렌즈 JSON이 엔진과 같은 폴더에 있는지 확인한다.

## 반드시 확인할 증거

- PC 웹: 메인 기능, 진단/대시보드/공유·내보내기 등 실제 기능, 반응형·접근성·SEO, 배포 URL
- 모바일/PWA: 좁은 폭, 터치, 오프라인/설치 여부, 서비스 워커, Android 실기기 시행 여부
- 기술: 테스트·CI·성능·보안 헤더·HTTPS·의존성·오류 처리
- 상용화: 이용약관·개인정보 처리방침·삭제 경로·운영 주체·문의 채널·결제/환불 정책
- 시장: 경쟁 서비스와 실제 비교 자료가 있는지, 없으면 계산 불가

## 최종 응답

엔진 명령의 성공 여부와 아래 두 개의 절대 경로 링크를 가장 먼저 제시한다.

- `[자동 분석 Markdown 보고서](<절대 경로>)`
- `[자동 분석 JSON 결과](<절대 경로>)`

그 뒤에 대상 프로젝트의 실제 이름, 확인된 구체 기능, 모바일·PC 점수/등급, 게이트 실패 수, 상위 갭, 벤치마크 상태, 방향 정합도, Android 실기기 상태를 쉬운 말로 요약한다. 엔진이 계산 불가로 반환한 축을 점수로 꾸미지 않는다.

---

이 프롬프트의 핵심은 “분석문 작성”이 아니라 **증거 JSON 생성 → 엔진 실행 → 결과 파일 링크 제공**이라는 실행 순서입니다.
