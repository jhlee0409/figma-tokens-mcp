# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-01-02

### Performance Improvements

- **배치 병렬 처리**: Promise.all()을 사용한 병렬 배치 처리로 3-5배 속도 향상
- **색상 변환 메모이제이션**: Map 기반 캐시로 중복 색상 변환 20-30% 개선
- **JSON.stringify 최적화**: 불필요한 JSON.stringify 호출 제거로 100-200ms 절약
- **API 호출 최적화**: 5분 TTL 캐시로 반복 요청 최적화

### Added

- 진행률 표시 기능 추가 (배치 처리 진행 상황 실시간 표시)
- 성능 측정 및 모니터링 개선

### Technical Details

- `fetchStyleNodes()`: 순차 처리 → 병렬 처리 전환
- `rgbaToHex()`: 메모이제이션 캐시 추가
- `getFileForStyles()`: JSON.stringify 제거, 스타일 카운트로 대체

## [0.1.2] - 2025-01-01

### Fixed

- ESM 모듈 감지 버그 수정 (realpathSync 사용)
- MCP 서버 연결 안정성 개선

### Changed

- Figma API 클라이언트 로깅 개선

## [0.1.1] - 2024-12-31

### Added

- Styles 기반 디자인 토큰 추출 (Variables API 없이 동작)
- Color tokens 및 Typography tokens 지원
- Tailwind CSS 설정 생성
- 네이밍 패턴 자동 감지 및 정규화

### Features

- Figma Styles API 통합
- 배치 처리 (기본 100개 단위)
- 캐싱 시스템 (5분 TTL)
- 상세한 로깅 및 에러 처리

## [0.1.0] - 2024-12-30

### Initial Release

- MCP (Model Context Protocol) 서버 초기 구현
- Figma REST API 통합
- 기본 디자인 토큰 추출 기능
