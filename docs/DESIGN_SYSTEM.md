# DICE 디자인 시스템

앱 전반에서 일관된 UI를 유지하기 위한 색·타이포·간격 사용 원칙입니다.

## 색 (시맨틱 토큰)

- **주요 액션·강조**: `primary` — 버튼, 링크, 활성 탭, CTA
- **제목·본문**: `foreground` — 제목, 본문 텍스트
- **보조·비활성**: `muted-foreground` — 캡션, 플레이스홀더, 비활성 텍스트
- **배경**: `background` (페이지), `card` (카드/패널), `muted` (구분 영역·스켈레톤)
- **테두리**: `border` — 카드, 인풋, 구분선
- **포커스 링**: `ring` — focus-visible 시 링
- **에러/삭제**: `destructive` — 에러 메시지, 삭제 버튼

`gray-*`, `blue-*`, `neutral-*` 등 원시 색은 사용하지 않고, 위 시맨틱 토큰만 사용합니다.

## 타이포

- **페이지 제목**: `text-2xl font-semibold` (일관된 스케일)
- **섹션 제목**: 그보다 한 단계 작게 (`text-lg font-semibold` 등)
- **본문**: `text-sm` / `text-base`, `leading-relaxed`
- **캡션**: `text-xs text-muted-foreground`

## 간격·radius

- **radius**: `--radius` (0.625rem) 및 `radius-sm`, `radius-md`, `radius-lg` 사용
- **카드/모달**: 동일한 padding·border-radius 유지

## 그림자

- **카드·패널**: `--shadow-sm`, `--shadow-md`
- **모달·드롭다운**: `--shadow-lg`
