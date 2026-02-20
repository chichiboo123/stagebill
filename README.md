# STAGEBILL - 뮤지컬 수업 자료 큐레이션 플랫폼

Netflix 스타일의 OTT형 웹사이트로, 뮤지컬 수업 자료를 큐레이션합니다.

## 실행 방법

정적 웹사이트이므로 로컬 웹서버로 실행합니다.

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

브라우저에서 `http://localhost:8000` 접속.

## 데이터 구조

모든 콘텐츠는 `data/musicals.json`에서 관리됩니다.

### JSON 필드

| 필드 | 설명 |
|------|------|
| `id` | 고유 ID (정수) |
| `title` | 작품명 |
| `category` | 카테고리 (일상, 컬러, 진로 등) |
| `curator` | 큐레이터 |
| `description` | 작품 소개 |
| `recommendedNumbers` | 추천 넘버 배열 `[{title, description}]` |
| `ideaNotes` | 수업 아이디어 노트 |
| `playlistLink` | YouTube 플레이리스트 링크 |
| `hashtags` | 해시태그 배열 `["#일상", "#위로"]` |
| `thumbnail` | 썸네일 이미지 경로 (선택) |
| `color` | 카드 대표 색상 HEX |
| `year` | 초연 연도 |

## 데이터 업데이트

### CSV로 추가

```bash
# 기존 데이터에 추가
python data/convert_csv.py new_data.csv

# 전체 교체
python data/convert_csv.py new_data.csv --replace
```

CSV 템플릿: `data/sample_template.csv`

### JSON 직접 편집

`data/musicals.json`에 새 항목을 추가하면 됩니다. `id`는 기존 최대값 + 1로 지정합니다.
