#!/usr/bin/env python3
"""
STAGEBILL CSV → JSON 변환 스크립트

CSV 파일을 musicals.json 형식으로 변환합니다.
기존 데이터에 추가(append)하거나 전체 교체(replace)할 수 있습니다.

사용법:
  python convert_csv.py input.csv                  # 기존 데이터에 추가
  python convert_csv.py input.csv --replace         # 전체 교체
  python convert_csv.py input.csv -o output.json    # 출력 파일 지정

CSV 형식 (헤더 필수):
  title,category,curator,description,number1_title,number1_desc,number2_title,number2_desc,number3_title,number3_desc,ideaNotes,playlistLink,hashtags,color,year

  - hashtags: 세미콜론(;)으로 구분 (예: #일상;#위로;#소통)
  - color: HEX 색상 코드 (예: #E50914), 생략 시 카테고리별 기본값 적용
  - year: 초연 연도 (숫자)
"""

import csv
import json
import sys
import argparse
from pathlib import Path

DEFAULT_COLORS = {
    "일상": "#1E88E5",
    "컬러": "#E91E63",
    "진로": "#43A047",
}

def parse_hashtags(raw):
    """세미콜론 또는 쉼표로 구분된 해시태그를 파싱합니다."""
    if not raw:
        return []
    separators = [';', ',']
    for sep in separators:
        if sep in raw:
            tags = [t.strip() for t in raw.split(sep) if t.strip()]
            return [t if t.startswith('#') else f'#{t}' for t in tags]
    raw = raw.strip()
    return [raw if raw.startswith('#') else f'#{raw}']

def csv_row_to_musical(row, next_id):
    """CSV 행을 뮤지컬 JSON 객체로 변환합니다."""
    category = row.get('category', '').strip()
    color = row.get('color', '').strip() or DEFAULT_COLORS.get(category, '#E50914')

    numbers = []
    for i in range(1, 4):
        title_key = f'number{i}_title'
        desc_key = f'number{i}_desc'
        title = row.get(title_key, '').strip()
        desc = row.get(desc_key, '').strip()
        if title:
            numbers.append({"title": title, "description": desc})

    year_str = row.get('year', '').strip()
    year = int(year_str) if year_str.isdigit() else 2000

    return {
        "id": next_id,
        "title": row.get('title', '').strip(),
        "category": category,
        "curator": row.get('curator', '').strip(),
        "description": row.get('description', '').strip(),
        "recommendedNumbers": numbers,
        "ideaNotes": row.get('ideaNotes', '').strip(),
        "playlistLink": row.get('playlistLink', '').strip(),
        "hashtags": parse_hashtags(row.get('hashtags', '')),
        "thumbnail": "",
        "color": color,
        "year": year,
    }

def main():
    parser = argparse.ArgumentParser(description='STAGEBILL CSV → JSON 변환')
    parser.add_argument('csv_file', help='입력 CSV 파일 경로')
    parser.add_argument('-o', '--output', default='musicals.json', help='출력 JSON 파일 경로 (기본: musicals.json)')
    parser.add_argument('--replace', action='store_true', help='기존 데이터를 교체 (기본: 추가)')
    args = parser.parse_args()

    csv_path = Path(args.csv_file)
    output_path = Path(__file__).parent / args.output

    if not csv_path.exists():
        print(f"오류: CSV 파일을 찾을 수 없습니다: {csv_path}")
        sys.exit(1)

    # 기존 데이터 로드
    existing = []
    if not args.replace and output_path.exists():
        with open(output_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        print(f"기존 데이터 {len(existing)}건 로드 완료")

    next_id = max((m['id'] for m in existing), default=0) + 1

    # CSV 읽기
    new_items = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            musical = csv_row_to_musical(row, next_id)
            new_items.append(musical)
            next_id += 1

    print(f"CSV에서 {len(new_items)}건 변환 완료")

    # 병합
    if args.replace:
        result = new_items
    else:
        # 제목 기준 중복 체크
        existing_titles = {m['title'] for m in existing}
        added = 0
        for item in new_items:
            if item['title'] not in existing_titles:
                existing.append(item)
                added += 1
            else:
                print(f"  건너뜀 (중복): {item['title']}")
        result = existing
        print(f"신규 {added}건 추가 (중복 {len(new_items) - added}건 제외)")

    # JSON 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"저장 완료: {output_path} (총 {len(result)}건)")

if __name__ == '__main__':
    main()
