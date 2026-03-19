# CLAUDE.md — JavaScript Engine Simulator

## Project Overview

JavaScript 엔진 내부 동작을 시각화하는 교육용 시뮬레이터.
Tokenizer → Parser → Interpreter 파이프라인을 단계별로 실행하고, 콜스택·클로저·이벤트루프 등을 시각적으로 보여준다.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Compiler enabled, Turbopack)
- **Language**: TypeScript 5.9 (strict, `isolatedModules: true`)
- **Styling**: Tailwind CSS v4
- **State**: Zustand 5 (vanilla store + `useStore` hook)
- **Animation**: Motion 12 (`import from 'motion/react'`)
- **i18n**: next-intl 4 (path-based, `localePrefix: 'as-needed'`, ko/en)
- **Editor**: Monaco Editor (`@monaco-editor/react`, dynamic import, `ssr: false`)
- **Package Manager**: pnpm 9
- **Node**: >=20.9.0

## Commands

```bash
pnpm dev              # 개발 서버 (PORT=3000)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
pnpm lint:fix         # ESLint 자동 수정
pnpm format           # Prettier 포맷
pnpm type-check       # tsc --noEmit
pnpm fsd              # Steiger FSD 아키텍처 검증
pnpm test             # Vitest 단위 테스트 실행
pnpm test:watch       # Vitest watch 모드
pnpm test:coverage    # 커버리지 리포트 (90% threshold)
pnpm test:e2e         # Playwright E2E 테스트
```

## Architecture: Feature-Sliced Design (FSD)

```
app/[locale]/              ← Next.js App Router (라우트 정의만)
src/
  app/                     ← FSD app layer (providers, config)
  views/                   ← 페이지 컴포넌트 (조합만, 로직 없음)
  widgets/                 ← 독립 UI 블록 (대시보드, 패널 조합)
  features/                ← 사용자 인터랙션 단위 (에디터, 디버거 등)
  entities/                ← 도메인 모델 UI (토큰, AST, 콜스택 등)
  shared/                  ← 공용 코드
    lib/engine/            ← 핵심 엔진 (pure TS, React 의존 없음)
      tokenizer/           ← char-by-char 스캐너
      parser/              ← recursive descent + Pratt parsing
      interpreter/         ← Generator 기반 (function* → StepResult)
    lib/i18n/              ← next-intl 서버 설정
    config/                ← i18n routing, snippets, test setup
    model/                 ← Zustand store (engine-store.ts)
    ui/                    ← 공용 UI 컴포넌트
    api/                   ← API 유틸리티
```

### FSD 규칙 (반드시 준수)

- **같은 레이어의 슬라이스 간 cross-import 금지** (예: widgets/A → widgets/B 불가)
- shared config 하위 디렉토리는 반드시 부모 `index.ts`를 통해 export
- i18n navigation은 항상 `@/shared/config`에서 import (하위 경로 직접 접근 금지)
- `pnpm fsd`로 검증 (pre-commit hook에 포함)

## TypeScript Constraints

- **`const enum` 사용 금지** — `isolatedModules: true` 이므로 string union type 사용
- Path aliases: `@/*` → `./src/*`, `@app/*` → `./app/*`
- `consistent-type-imports` 적용: `import { type Foo }` 형식 사용

## Commit Convention

Conventional Commits (`commitlint` 강제):

- 허용 타입: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `build`, `ci`
- subject: 소문자 시작, 마침표 없음, 최대 100자

## Pre-commit Hook

lint-staged → type-check → steiger FSD 검증 → 관련 테스트 자동 실행

## Testing

- **단위 테스트**: Vitest + happy-dom (globals 모드)
- **E2E 테스트**: Playwright
- 테스트 파일: `src/**/*.test.{ts,tsx}`
- 커버리지 threshold: statements/branches/functions/lines 모두 90%
- 엔진 핵심 로직(tokenizer, parser, interpreter, environment)에 집중 테스트

## Engine Architecture

- **Tokenizer**: `tokenize(source)` → `Token[]`
- **Parser**: `parse(tokens)` → `Program` (AST)
- **Interpreter**: Generator 패턴 — `function*`이 매 실행 단계마다 `StepResult`를 yield
- **Environment**: 스코프 체인 + 클로저, `getParent()`, `getBindingsMap()`
- **AsyncRuntime**: interpret()를 래핑하여 이벤트루프(Web API, Task Queue, Microtask Queue) 시뮬레이션
- **Store** (`engine-store.ts`): `parse`, `stepForward`, `stepBack`, `run`, `pause`, `reset` 액션 제공

## Simulators (Pages)

| Route                | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `/`                  | 랜딩 페이지                                           |
| `/engine-simulator`  | JS 엔진 시뮬레이터 (토큰 → AST → 실행)                |
| `/closure-simulator` | 클로저 & 힙 메모리 시각화                             |
| `/event-simulator`   | 이벤트루프 시뮬레이터 (Web API, Task/Microtask Queue) |
| `/this-simulator`    | this 바인딩 시뮬레이터                                |

## i18n

- 메시지 파일: `messages/en.json`, `messages/ko.json`
- 미들웨어: `proxy.ts` (루트 레벨, middleware.ts 아님)
- 클라이언트: `useTranslations` 훅 사용 (`'use client'` 필수)
- 라우팅: `@/shared/config`에서 `Link`, `redirect`, `usePathname`, `useRouter` import

## Key Packages

| Package                   | Usage                                    |
| ------------------------- | ---------------------------------------- |
| `zustand@5`               | Vanilla store + React useStore           |
| `@monaco-editor/react@4`  | 코드 에디터 (dynamic import, ssr: false) |
| `motion@12`               | 애니메이션 (`motion/react`에서 import)   |
| `next-intl@4`             | i18n (path-based routing)                |
| `@tanstack/react-query@5` | 서버 상태 관리                           |
| `zod@4`                   | 스키마 검증                              |

## CLI Tool

`cli/` 디렉토리에 별도 패키지로 존재. 메인 프로젝트와 독립적으로 빌드/배포.

```bash
pnpm cli:dev         # CLI 개발
pnpm cli:build       # CLI 빌드
pnpm cli:publish     # npm 배포
```
