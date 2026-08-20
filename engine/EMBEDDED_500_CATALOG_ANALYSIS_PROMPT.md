# 내장 500개 도메인 기반 서비스 유사도·우수 관행 자동 분석 프롬프트

아래 전체를 **분석하려는 서비스 프로젝트를 연 Codex 채팅**에 그대로 붙여 넣는다. 이 프롬프트에는 500개 도메인 카탈로그가 본문에 들어 있으므로, 대상 프로젝트에 별도 카탈로그 파일이 없어도 된다.

---

당신은 제품 전략가, UX·품질 분석가, 상용화 준비 담당자다. 현재 열려 있는 프로젝트 하나를 대상으로 **서비스 자동 파악 → 내장 500개 도메인 분류 → 유사 서비스의 공개 근거 확인 → 우수 관행 합성 → 이상 기준 생성 → 증거 기반 갭 분석 → Readiness Hub 엔진 실행 → 파일 링크 보고**를 수행한다.

추측으로 평가문만 쓰지 않는다. 분석 결과물은 `.readiness-analysis/<UTC-실행시각>/`에만 새로 만든다. 대상 제품 코드·설정·의존성·배포·저장 기록(commit)·보관소 업로드(push)는 수정하지 않는다.

## 1. 안전 원칙

- 현재 열린 프로젝트만 분석한다. 먼저 `AGENTS.md`, README, 프로젝트 연속성 문서, Git 상태를 읽는다.
- 기존 사용자 변경·추적되지 않은 파일·작업 갈래(branch)를 보존한다.
- 열쇠 문자열, 비밀번호, 쿠키, 개인 키, 개인정보는 출력하거나 산출물에 넣지 않는다.
- 사실(파일·명령·공개 화면·실기기 근거), 합리적 추정, 미확인을 반드시 구분한다.
- 결제, 구독, 주문, 계정 생성, 데이터 삭제 같은 상태 변경은 실행하지 않는다.
- Android는 실제 연결된 **유휴 기기 한 대**에서 실행한 경우에만 `실기기 검증`으로 쓴다. 그렇지 않으면 `미실시`로 쓴다.
- 카탈로그의 순위와 후보명은 **탐색 시작점**일 뿐 시장 규모·품질·현재 제공 기능의 증명이 아니다. 비교 서비스의 실제 기능·가격·평점·국가·점수는 반드시 공식 웹사이트, 공식 앱 마켓, 공식 도움말, 신뢰할 수 있는 제3자 근거로 다시 확인한다.

## 2. 내장 카탈로그 사용법

아래의 `내장 500개 도메인 카탈로그 v1`만 사용한다. 별도 `global-service-catalog-*.md` 파일을 찾지 않는다. 각 번호는 시장 검증 순위가 아니라, 넓은 소비자·기업 디지털 서비스 시장을 먼저 살피도록 정한 **탐색 우선순위**다.

1. 프로젝트의 문제, 사용자, 핵심 행동, 수익 구조, 플랫폼을 읽는다.
2. 카탈로그에서 주 도메인 1개와 보조 도메인 0~3개를 고른다.
3. 각 후보에 문제 40점·사용자/구매자 20점·핵심 흐름 20점·수익 구조 10점·모바일/PC 구성 10점을 부여한다. 점수는 내부 정렬용이며 시장 점수가 아니다.
4. 각 선택에 `카탈로그 번호`, `도메인`, `선택 근거`, `적합도`, `확신도`를 기록한다.
5. 고른 행의 대표 검색어로 실제 유사 서비스를 찾되, 공식 근거가 없는 후보는 `미확인 후보`로만 남긴다.

## 3. 대상 서비스 자동 프로필

파일, README, 실행 명령, 공개 URL, 스토어 설명, 약관·개인정보 문서를 읽어 아래를 `service-profile.json`으로 만든다.

- 실제 서비스명·한 문단 설명·근거
- 핵심 사용자·해결 문제·핵심 흐름(시작 → 핵심 행동 → 결과 → 저장/공유/결제/지원)
- 모바일 앱·모바일 웹·설치형 웹앱(PWA)·PC 웹 범위
- 실제 기능명과 파일/URL 근거
- 수익 모델·대상 국가·언어·출시 단계
- 기술 스택·테스트·인터넷에 공개하기(배포)·보안·정책 표면

값을 확인하지 못하면 `미확인`으로 남긴다. 추측으로 채우지 않는다.

## 4. 실제 유사 서비스 선정

내장 카탈로그의 대표 검색어를 출발점으로 다음을 구성한다.

- 직접 경쟁 3~5개: 같은 문제·핵심 사용자·흐름
- 선두 사례 2개: 특정 기능을 특히 성숙하게 제공
- 인접 사례 0~2개: 다른 방식으로 같은 문제를 해결

각 후보마다 문제·사용자·흐름·수익·플랫폼 유사도를 0~5로 기록하고, 선택 이유와 공식 근거 URL을 남긴다. 공식 근거로 검증된 비교 대상이 3개 미만이면 시장 상대 위치는 `계산 불가`로 유지한다. 검색·브라우저를 쓸 수 없으면 카탈로그 후보만 제시하고 `외부 검증 미실시`로 기록한다.

## 5. 우수 관행과 이상 기준

경쟁사의 화면이나 문구를 복제하지 말고, 사용자 행동 단위로 정규화한다. 예: 가입/시작 질문/진단은 `시작·개인화`, 튜토리얼·가이드는 `핵심 가치 전달`, 평가·오류 설명·추천은 `피드백`, 구독·취소·환불은 `상용화 신뢰`다.

기능 하나를 우수 관행으로 판정하려면 다음 중 둘 이상을 만족해야 한다.

1. 직접 경쟁·선두 사례를 합쳐 3개 이상에서 공개 근거로 확인됨
2. 결제·개인정보·안전·접근성·보안 위험을 실제로 줄임
3. 핵심 과업을 더 빠르거나 확실하게 끝내게 함
4. 자동 측정·사용자 시험·공식 정책 등 외부 근거가 있음

대상 서비스에 맞는 12~20개 기준을 만들고, 아래 5묶음을 모두 고려한다.

1. 시작·개인화: 목표·상태 파악, 추천, 경로 변경
2. 핵심 가치·실행: 주요 과업, 결과물, 오류 처리, 저장·공유
3. 품질·성장: 속도, 접근성, 모바일·PC 일관성, 피드백·측정
4. 신뢰·상용화: 가격, 결제, 해지·환불, 개인정보, 보안, 고객지원
5. 운영·확장: 모니터링, 최신성, 팀/관리자 기능, 출시 절차

각 기준에는 `이상적 상태`, `필요한 이유`, `비교 서비스 근거`, `대상 서비스 증거`, `현재 평가`, `개선 제안`, `검증 방법`을 넣는다. 평가는 0(없음/실패), 1(소개·제한적), 2(기본), 3(실제 흐름·오류 처리·지원), 4(개인화·측정·반복 개선) 또는 `미확인`이다. `미확인`을 0점으로 바꾸지 않는다.

## 6. Readiness Hub 엔진 실행

먼저 현재 프로젝트에서 다음 파일을 찾는다.

```powershell
rg --files -g "readiness-engine.mjs" -g "lens-core-v2.1.json" -g "project-evidence.example.json"
```

엔진과 렌즈가 함께 있으면 사용한다. 없고 네트워크를 사용할 수 있으면 분석 폴더 안의 `engine/`에만 다음 공개 파일을 내려받아 사용한다. 대상 제품 파일은 수정하지 않는다.

```text
https://hanksleekorea-boop.github.io/readiness-hub/engine/readiness-engine.mjs
https://hanksleekorea-boop.github.io/readiness-hub/engine/lens-core-v2.1.json
https://hanksleekorea-boop.github.io/readiness-hub/engine/project-evidence.example.json
```

예제를 바탕으로 `crh-project-evidence/v1` 형식의 `project-evidence.json`을 만든다. 각 증거에는 가능한 경우 `score`(0~4 정수), `observedAt`(YYYY-MM-DD), `tier`(1/2/3/auto/self), `note`를 넣고, 미확인은 `unknown`, 정당한 적용 제외만 근거와 함께 `na`로 쓴다. 비교 서비스가 실제로 3개 이상일 때만 `benchmark.comparators`에 넣는다.

```powershell
node <엔진경로> --input .\.readiness-analysis\<실행폴더>\project-evidence.json --out .\.readiness-analysis\<실행폴더>\readiness-analysis.json --markdown .\.readiness-analysis\<실행폴더>\readiness-analysis.md
```

엔진 다운로드·실행이 실패하면 실패 원인과 시도한 경로를 기록하고, 우수 관행 비교 보고서는 계속 작성한다. 계산 불가 축을 임의 점수로 꾸미지 않는다.

## 7. 반드시 만들 파일

`.readiness-analysis/<실행폴더>/`에 다음을 만든다.

1. `service-profile.json`
2. `similarity-candidates.json`
3. `ideal-standard.json`
4. `best-practice-analysis.md`
5. `project-evidence.json` — 엔진을 쓸 수 있을 때
6. `readiness-analysis.json`, `readiness-analysis.md` — 엔진 성공 시

`similarity-candidates.json`에는 반드시 `catalogVersion: "embedded-500-v1"`과 선택한 모든 카탈로그 번호를 넣어, 외부 파일 없이도 분석 재현이 가능하게 한다.

## 8. 최종 Markdown 보고서 순서

1. 대상 서비스 한 문단 설명
2. 자동 분류: 주·보조 도메인, 내장 카탈로그 번호, 근거
3. 실제 확인된 기능
4. 유사 서비스 비교군과 공식 근거
5. 합성된 이상 기준
6. 기준별 대조
7. 예비 수준 점수와 증거 완성도
8. 강점 3개
9. 필수 기준선 갭
10. 경쟁력 기준 갭
11. 차별화 기회
12. 상위 개선 과제 20개(무엇·왜·예상 효과·검증 방법)
13. 사용자 없이 실행 가능한 개선 과제 20개
14. 운영자 결정 필요 항목
15. Android 실기기 시험 상태
16. Readiness Hub 엔진 결과와 한계
17. 결론: 완료 / 부분 완료 / 사용자 행동 대기

## 9. 최종 채팅 응답

가장 먼저 아래의 절대 경로 링크를 제시한다.

- `[유사 서비스·우수 관행 분석 보고서](<절대 경로>)`
- `[서비스 프로필 JSON](<절대 경로>)`
- `[이상적 기준 JSON](<절대 경로>)`
- 엔진 성공 시 `[Readiness Hub JSON 결과](<절대 경로>)`, `[Readiness Hub Markdown 결과](<절대 경로>)`

그 다음에는 대상 서비스명·실제 기능·선택된 내장 카탈로그 도메인·검증된 비교군·예비 점수와 증거 완성도·강점 3개·갭 5개·계산 불가 이유·Android 상태·수정하지 않은 범위를 쉬운 말로 요약한다. 법률 자문·준수 인증·시장 성과 보증으로 표현하지 않는다.

---

## 내장 500개 도메인 카탈로그 v1

형식: `순위: 도메인 (대표 검색어)`이다. 괄호 안은 실제 비교 서비스를 찾기 위한 검색 출발어이며, 후보의 현재 제공 여부는 반드시 다시 확인한다.

01–10: 01 전자상거래 종합몰(online marketplace) · 02 식료품 배달(grocery delivery) · 03 음식 배달(food delivery) · 04 패션 쇼핑(fashion commerce) · 05 뷰티 쇼핑(beauty commerce) · 06 생활용품 쇼핑(home goods commerce) · 07 중고 거래(peer-to-peer resale) · 08 리셀·한정판(resale marketplace) · 09 가격 비교(price comparison) · 10 구독 상거래(subscription commerce)

11–20: 11 온라인 결제(payment gateway) · 12 디지털 지갑(digital wallet) · 13 개인 송금(P2P transfer) · 14 해외 송금(remittance) · 15 개인 자산관리(personal finance) · 16 예산 관리(budgeting app) · 17 신용 관리(credit monitoring) · 18 대출 비교(loan marketplace) · 19 보험 비교(insurance marketplace) · 20 세금 신고(tax filing)

21–30: 21 주식 투자(stock investing) · 22 암호자산 거래(crypto exchange) · 23 로보어드바이저(robo advisor) · 24 부동산 투자(real estate investing) · 25 기업 자금관리(treasury management) · 26 회계 SaaS(accounting software) · 27 청구·인보이스(invoicing) · 28 급여 관리(payroll) · 29 경비 관리(expense management) · 30 매장 결제(POS)

31–40: 31 소셜 네트워크(social network) · 32 메신저(messaging) · 33 커뮤니티 포럼(online community) · 34 크리에이터 플랫폼(creator platform) · 35 라이브 스트리밍(live streaming) · 36 짧은 영상(short video) · 37 사진 공유(photo sharing) · 38 블로그·뉴스레터(blog newsletter) · 39 팬 커뮤니티(fan community) · 40 데이팅(dating)

41–50: 41 동영상 스트리밍(video streaming) · 42 음악 스트리밍(music streaming) · 43 팟캐스트(podcast) · 44 오디오북(audiobook) · 45 디지털 만화(webtoon comics) · 46 전자책(e-book) · 47 게임 스트리밍(game streaming) · 48 티켓 예매(ticketing) · 49 이벤트 발견(event discovery) · 50 팬덤 멤버십(fan membership)

51–60: 51 온라인 강의(online learning) · 52 언어 학습(language learning) · 53 시험 대비(test prep) · 54 직무 교육(career learning) · 55 코딩 교육(coding education) · 56 어린이 교육(kids learning) · 57 대학 학습관리(LMS) · 58 튜터 매칭(tutoring marketplace) · 59 학습 노트(note learning) · 60 자격증 교육(certification learning)

61–70: 61 생성형 AI 도우미(generative AI assistant) · 62 AI 글쓰기(AI writing) · 63 AI 이미지(AI image creation) · 64 AI 영상(AI video creation) · 65 AI 음성(AI voice) · 66 AI 코드(AI coding) · 67 AI 고객지원(AI support) · 68 AI 검색(AI search) · 69 AI 자동화(AI automation) · 70 프롬프트 학습(prompt learning)

71–80: 71 생산성 통합 작업공간(productivity workspace) · 72 할 일 관리(task management) · 73 프로젝트 관리(project management) · 74 문서 협업(document collaboration) · 75 지식관리(knowledge management) · 76 일정·캘린더(calendar) · 77 이메일 생산성(email productivity) · 78 전자서명(e-signature) · 79 양식·설문(form builder) · 80 회의 기록(meeting notes)

81–90: 81 팀 메신저(team chat) · 82 화상회의(video conferencing) · 83 원격 협업(remote collaboration) · 84 화이트보드(online whiteboard) · 85 디자인 협업(design collaboration) · 86 개발자 협업(developer collaboration) · 87 워크플로 자동화(workflow automation) · 88 업무 통합(iPaaS integration) · 89 사내 포털(employee portal) · 90 전자결재(approval workflow)

91–100: 91 CRM(customer relationship management) · 92 영업 자동화(sales automation) · 93 마케팅 자동화(marketing automation) · 94 이메일 마케팅(email marketing) · 95 고객 데이터 플랫폼(CDP) · 96 광고 관리(ad management) · 97 검색엔진 최적화(SEO) · 98 웹 분석(web analytics) · 99 전환율 최적화(CRO) · 100 제휴 마케팅(affiliate marketing)

101–110: 101 고객지원 헬프데스크(help desk) · 102 라이브 채팅(live chat) · 103 고객 피드백(customer feedback) · 104 리뷰 관리(review management) · 105 고객 성공(customer success) · 106 콜센터(contact center) · 107 예약 관리(appointment scheduling) · 108 대기열 관리(queue management) · 109 현장 서비스(field service) · 110 멤버십·로열티(loyalty)

111–120: 111 병원 예약(healthcare booking) · 112 원격 진료(telehealth) · 113 건강 기록(personal health record) · 114 정신건강(mental wellness) · 115 명상·수면(meditation sleep) · 116 운동 추적(fitness tracking) · 117 식단 관리(nutrition tracking) · 118 여성 건강(women's health) · 119 노인 돌봄(elder care) · 120 약국·처방(pharmacy)

121–130: 121 부동산 검색(property search) · 122 임대 관리(property management) · 123 단기 숙박(vacation rental) · 124 호텔 예약(hotel booking) · 125 항공 예약(flight booking) · 126 여행 일정(trip planning) · 127 렌터카(car rental) · 128 지역 체험(local experiences) · 129 비자·이민 지원(visa support) · 130 출장 관리(business travel)

131–140: 131 차량 호출(ride hailing) · 132 택시 호출(taxi booking) · 133 대중교통 안내(transit navigation) · 134 지도·내비게이션(maps navigation) · 135 주차(parking) · 136 전기차 충전(EV charging) · 137 차량 공유(car sharing) · 138 자전거·킥보드(micromobility) · 139 물류 추적(parcel tracking) · 140 화물 운송(freight logistics)

141–150: 141 구직(job search) · 142 채용 관리(ATS) · 143 프리랜서 마켓(freelance marketplace) · 144 전문 서비스 마켓(professional services) · 145 직원 교육(employee training) · 146 인사 관리(HRMS) · 147 근태 관리(time attendance) · 148 복지 관리(employee benefits) · 149 조직문화(employee engagement) · 150 인력 분석(people analytics)

151–160: 151 식당 예약(restaurant reservation) · 152 레시피·요리(recipe cooking) · 153 식단 배달(meal kit) · 154 농산물 직거래(farm-to-table) · 155 카페 주문(coffee ordering) · 156 주류 배달(alcohol delivery) · 157 반려동물 쇼핑(pet commerce) · 158 반려동물 돌봄(pet care) · 159 반려동물 건강(pet health) · 160 반려동물 커뮤니티(pet community)

161–170: 161 게임 유통(game distribution) · 162 모바일 게임(mobile gaming) · 163 e스포츠(esports) · 164 게임 길드(gaming community) · 165 게임 제작 도구(game creation) · 166 AR 경험(augmented reality) · 167 VR 경험(virtual reality) · 168 교육 게임(educational games) · 169 퍼즐·두뇌훈련(brain training) · 170 보드게임 디지털(board games)

171–180: 171 뉴스(news) · 172 금융 뉴스(financial news) · 173 지역 뉴스(local news) · 174 날씨(weather) · 175 스포츠 뉴스(sports news) · 176 스포츠 점수(sports scores) · 177 판타지 스포츠(fantasy sports) · 178 스포츠 티켓(sports ticketing) · 179 스포츠 코칭(sports coaching) · 180 팬 예측(sports prediction)

181–190: 181 정부 민원(digital government) · 182 세무 행정(public tax service) · 183 법률 정보(legal information) · 184 계약 관리(contract management) · 185 법률 상담(legal services) · 186 컴플라이언스(compliance) · 187 신원 확인(identity verification) · 188 사기 탐지(fraud detection) · 189 보안 교육(security awareness) · 190 비상 알림(emergency alert)

191–200: 191 기부(donations) · 192 자원봉사(volunteering) · 193 비영리 관리(nonprofit management) · 194 크라우드펀딩(crowdfunding) · 195 지역 모금(community fundraising) · 196 사회 캠페인(civic campaigning) · 197 재난 지원(disaster relief) · 198 접근성 지원(accessibility tools) · 199 번역·통역(translation) · 200 이민자 지원(immigrant services)

201–210: 201 클라우드 호스팅(cloud hosting) · 202 앱 배포(app deployment) · 203 개발자 플랫폼(developer platform) · 204 코드 저장소(code repository) · 205 지속적 통합(CI) · 206 오류 추적(error monitoring) · 207 성능 관찰(observability) · 208 API 관리(API management) · 209 데이터베이스 관리(database management) · 210 보안 운영(SecOps)

211–220: 211 데이터 분석(BI analytics) · 212 데이터 시각화(data visualization) · 213 데이터 통합(ETL) · 214 데이터 품질(data quality) · 215 데이터 카탈로그(data catalog) · 216 고객 조사(survey research) · 217 제품 분석(product analytics) · 218 A/B 시험(experimentation) · 219 사용자 행동 분석(session replay) · 220 데이터 개인정보(data privacy)

221–230: 221 제조 실행(MES) · 222 공장 자동화(factory automation) · 223 공급망 관리(supply chain) · 224 조달 관리(procurement) · 225 재고 관리(inventory) · 226 창고 관리(WMS) · 227 품질 관리(QMS) · 228 설비 유지보수(CMMS) · 229 산업 IoT(industrial IoT) · 230 제품 수명관리(PLM)

231–240: 231 농장 관리(farm management) · 232 정밀 농업(precision agriculture) · 233 농산물 물류(agri logistics) · 234 수산 관리(aquaculture) · 235 기상 농업(agri weather) · 236 탄소 농업(carbon farming) · 237 건설 관리(construction management) · 238 건축 설계(BIM) · 239 현장 안전(construction safety) · 240 부동산 시공(proptech construction)

241–250: 241 에너지 관리(energy management) · 242 태양광 관리(solar management) · 243 전력 거래(energy trading) · 244 탄소 회계(carbon accounting) · 245 ESG 관리(ESG reporting) · 246 폐기물 관리(waste management) · 247 물 관리(water management) · 248 기후 위험(climate risk) · 249 재생에너지 인증(renewable certificates) · 250 지속가능성 공급망(sustainable supply chain)

251–260: 251 은행 코어 시스템(core banking) · 252 오픈뱅킹(open banking) · 253 기업 대출(B2B lending) · 254 가맹점 금융(merchant finance) · 255 보험 운영(insurance operations) · 256 보험 청구(insurance claims) · 257 보험 기술(insurtech) · 258 부채 관리(debt management) · 259 자산운용(asset management) · 260 금융 컴플라이언스(financial compliance)

261–270: 261 학교 행정(school administration) · 262 학부모 소통(parent communication) · 263 학습 평가(assessment) · 264 교육 콘텐츠(education content) · 265 교사 도구(teacher tools) · 266 도서관 서비스(library systems) · 267 연구 관리(research management) · 268 학술 출판(scholarly publishing) · 269 논문 발견(research discovery) · 270 동문 관리(alumni management)

271–280: 271 진료 운영(clinic operations) · 272 전자의무기록(EHR) · 273 의료 청구(medical billing) · 274 의료 영상(medical imaging) · 275 임상시험(clinical trials) · 276 환자 참여(patient engagement) · 277 건강보험 관리(health insurance) · 278 디지털 치료(digital therapeutics) · 279 재활 관리(rehabilitation) · 280 의료 인력(healthcare staffing)

281–290: 281 호텔 운영(hotel operations) · 282 여행사 운영(travel agency) · 283 관광 CRM(travel CRM) · 284 항공 운영(airline operations) · 285 해운 운영(maritime operations) · 286 차량 관리(fleet management) · 287 라스트마일 배송(last-mile delivery) · 288 통관 관리(customs management) · 289 여행 안전(travel safety) · 290 관광 콘텐츠(tourism content)

291–300: 291 광고 소재 제작(ad creative) · 292 브랜드 관리(brand management) · 293 소셜 미디어 관리(social media management) · 294 인플루언서 마케팅(influencer marketing) · 295 홍보 관리(PR management) · 296 콘텐츠 관리(CMS) · 297 디지털 자산관리(DAM) · 298 전자상거래 운영(e-commerce operations) · 299 리테일 분석(retail analytics) · 300 매장 운영(store operations)

301–310: 301 디자인 도구(design tools) · 302 사진 편집(photo editing) · 303 영상 편집(video editing) · 304 3D 제작(3D creation) · 305 웹사이트 제작(website builder) · 306 노코드 앱 제작(no-code app builder) · 307 프레젠테이션(presentation tools) · 308 다이어그램(diagramming) · 309 설문 디자인(survey design) · 310 템플릿 마켓(template marketplace)

311–320: 311 사이버보안(cybersecurity) · 312 비밀번호 관리(password manager) · 313 엔드포인트 보안(endpoint security) · 314 클라우드 보안(cloud security) · 315 애플리케이션 보안(AppSec) · 316 개인정보 보호(privacy management) · 317 권한 관리(IAM) · 318 백업·복구(backup recovery) · 319 재해복구(disaster recovery) · 320 디지털 포렌식(digital forensics)

321–330: 321 부동산 중개(realty brokerage) · 322 주택담보대출(mortgage) · 323 주택 리모델링(home improvement) · 324 인테리어 디자인(interior design) · 325 가정 수리(home services) · 326 청소 서비스(cleaning services) · 327 이사 서비스(moving services) · 328 보안·스마트홈(smart home security) · 329 임차인 서비스(renter services) · 330 부동산 데이터(real estate data)

331–340: 331 육아 지원(parenting) · 332 베이비시팅(childcare) · 333 가족 일정(family calendar) · 334 결혼 준비(wedding planning) · 335 선물 추천(gift discovery) · 336 장례 지원(funeral services) · 337 종교 커뮤니티(faith community) · 338 취미 모임(hobby community) · 339 지역 이웃(neighborhood network) · 340 생활 기록(life logging)

341–350: 341 뉴스레터 제작(newsletter platform) · 342 팟캐스트 제작(podcast creation) · 343 크리에이터 수익화(creator monetization) · 344 온라인 강연(webinar) · 345 온라인 코스 제작(course creator) · 346 멤버십 커뮤니티(membership community) · 347 디지털 상품 판매(digital goods) · 348 굿즈 판매(merchandise) · 349 팬 후원(creator tipping) · 350 라이브 커머스(live commerce)

351–360: 351 자동차 판매(auto marketplace) · 352 차량 정비(auto repair) · 353 자동차 보험(auto insurance) · 354 운전 교육(driver education) · 355 차량 진단(vehicle diagnostics) · 356 중고차 이력(vehicle history) · 357 모터사이클(motorcycle services) · 358 캠핑카·레저차(RV services) · 359 항공 개인 이동(aviation services) · 360 드론 서비스(drone services)

361–370: 361 화장품 예약(beauty booking) · 362 미용실 예약(salon booking) · 363 웰니스 예약(wellness booking) · 364 개인 트레이닝(personal training) · 365 스포츠 시설 예약(sports booking) · 366 요가·필라테스(yoga pilates) · 367 아웃도어 활동(outdoor recreation) · 368 여행 사진(travel photography) · 369 취미 교육(hobby learning) · 370 취미 장비 대여(equipment rental)

371–380: 371 통신 요금제(telecom plans) · 372 인터넷 서비스(ISP) · 373 모바일 기기 관리(MDM) · 374 기기 수리(device repair) · 375 디지털 신분증(digital identity) · 376 전자 문서 보관(digital archive) · 377 파일 저장(file storage) · 378 파일 전송(file transfer) · 379 개인 백업(personal backup) · 380 인터넷 안전(parental control)

381–390: 381 블록체인 지갑(blockchain wallet) · 382 NFT·디지털 수집품(digital collectibles) · 383 DAO 커뮤니티(DAO tools) · 384 Web3 개발(Web3 developer tools) · 385 게임 경제(game economy) · 386 크라우드 대출(peer lending) · 387 대안 신용(alternative credit) · 388 급여 선지급(earned wage access) · 389 기부 결제(giving payments) · 390 금융 교육(financial education)

391–400: 391 공공 안전(public safety) · 392 경찰·소방 운영(emergency operations) · 393 도시 운영(smart city) · 394 선거 정보(election information) · 395 공공 참여(civic engagement) · 396 공공 기록(public records) · 397 공공 조달(public procurement) · 398 학교 안전(school safety) · 399 재난 경보(disaster alerts) · 400 국제 개발(aid management)

401–410: 401 번역 관리(localization management) · 402 국제 전자상거래(cross-border commerce) · 403 다국가 급여(global payroll) · 404 해외 채용(global hiring) · 405 해외 법인 관리(entity management) · 406 수출입 무역(trade management) · 407 관세 계산(duty calculation) · 408 국제 배송(cross-border shipping) · 409 환율·외환(FX management) · 410 글로벌 컴플라이언스(global compliance)

411–420: 411 웹 접근성(web accessibility) · 412 보조기술(assistive technology) · 413 난독 지원(dyslexia support) · 414 청각 지원(hearing accessibility) · 415 시각 지원(vision accessibility) · 416 고령자 디지털 지원(senior tech) · 417 디지털 웰빙(digital wellbeing) · 418 화면 시간(screen time) · 419 온라인 안전(online safety) · 420 가족 안전(family safety)

421–430: 421 식당 운영(restaurant operations) · 422 배달 매장 운영(delivery operations) · 423 식품 안전(food safety) · 424 메뉴 관리(menu management) · 425 예약 판매(pre-ordering) · 426 식자재 조달(food procurement) · 427 주방 관리(kitchen management) · 428 프랜차이즈 운영(franchise management) · 429 호텔 식음료(hospitality F&B) · 430 케이터링(catering)

431–440: 431 세일즈 교육(sales training) · 432 리더십 교육(leadership training) · 433 규정 교육(compliance training) · 434 안전 교육(safety training) · 435 온보딩(employee onboarding) · 436 내부 이동(internal mobility) · 437 성과 관리(performance management) · 438 보상 관리(compensation management) · 439 인력 계획(workforce planning) · 440 채용 브랜딩(employer branding)

441–450: 441 과학 실험실 관리(lab management) · 442 생명과학 데이터(bioinformatics) · 443 의료 연구(health research) · 444 특허 관리(IP management) · 445 지식재산 검색(patent search) · 446 규제 정보(regulatory intelligence) · 447 임상 데이터(clinical data) · 448 연구 협업(research collaboration) · 449 학술 네트워크(academic network) · 450 과학 교육(science education)

451–460: 451 반도체 설계(semiconductor design) · 452 전자 설계(EDA) · 453 로봇 운영(robotics) · 454 자율주행(autonomous driving) · 455 우주 데이터(space data) · 456 위성 분석(satellite analytics) · 457 디지털 트윈(digital twin) · 458 IoT 플랫폼(IoT platform) · 459 엣지 컴퓨팅(edge computing) · 460 양자 컴퓨팅(quantum computing)

461–470: 461 법률 사무 운영(law firm management) · 462 계약 전자서명(contract e-signing) · 463 소송 지원(litigation support) · 464 법률 문서 자동화(legal document automation) · 465 지식재산 운영(IP operations) · 466 규제 신고(regulatory filing) · 467 기업 거버넌스(corporate governance) · 468 내부감사(internal audit) · 469 위험 관리(enterprise risk) · 470 윤리 신고(ethics hotline)

471–480: 471 청소년 커뮤니티(youth community) · 472 대학 진학(college admissions) · 473 장학금(scholarships) · 474 직업 전환(career transition) · 475 은퇴 계획(retirement planning) · 476 생활 습관(habit building) · 477 목표 관리(goal tracking) · 478 개인 일기(journaling) · 479 디지털 유산(digital legacy) · 480 가족 역사(family history)

481–490: 481 카운터·집계(counter tally) · 482 알람·기상(alarm clock) · 483 시간 추적(time tracking) · 484 습관·루틴(habit tracker) · 485 체크리스트(checklist) · 486 스캔·문서화(document scanning) · 487 QR·바코드(QR barcode) · 488 비밀번호 생성(password generator) · 489 파일 변환(file conversion) · 490 단위·환율 계산(converter calculator)

491–500: 491 날씨 위험(weather alerts) · 492 식물 관리(plant care) · 493 반려식물 커뮤니티(plant community) · 494 폐기물 분리배출(recycling guide) · 495 지역 상점 발견(local discovery) · 496 쿠폰·절약(coupons savings) · 497 기부 물품(giving marketplace) · 498 소규모 모임(micro-events) · 499 생활 문제 해결(local problem solving) · 500 범용 유틸리티(multi-purpose utility)

---

핵심 실행 순서: `서비스 자동 파악 → 내장 500개 도메인 매칭 → 유사 서비스 실제 확인 → 우수 관행 합성 → 이상 기준 생성 → 증거 기반 대조 → Readiness Hub 엔진 실행 → 파일 링크 보고`
