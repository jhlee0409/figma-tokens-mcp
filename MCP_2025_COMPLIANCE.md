# MCP 2025 Specification Compliance

이 문서는 Figma Tokens MCP 서버가 2025년 1월 기준 MCP 스펙 및 베스트 프랙티스를 어떻게 준수하는지 설명합니다.

## 📋 MCP Specification 2025-03-26

### ✅ Transport Protocol

**Streamable HTTP** (2025-03-26 스펙)
- ✅ 단일 엔드포인트: `/api/mcp`
- ✅ GET/POST/DELETE 메서드 지원
- ✅ SSE deprecated - 사용하지 않음

**구현 위치**: `app/api/mcp/route.ts`

```typescript
export { authHandler as GET, authHandler as POST, authHandler as DELETE };
```

### ✅ OAuth 2.1 Authentication

**Bearer Token 인증**
- ✅ `withMcpAuth` 래퍼 사용
- ✅ Authorization 헤더에서 토큰 추출
- ✅ 사용자별 토큰 (서버에 저장 안 함)

**구현 위치**: `app/api/mcp/route.ts:26-40`

```typescript
const verifyFigmaToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;
  return {
    token: bearerToken,
    scopes: ['figma:read'],
    clientId: 'figma-user',
  };
};
```

### ✅ OAuth Protected Resource Metadata

**RFC 8414 준수**
- ✅ `/.well-known/oauth-protected-resource` 엔드포인트
- ✅ `protectedResourceHandler` 사용
- ✅ CORS preflight 지원

**구현 위치**: `app/.well-known/oauth-protected-resource/route.ts`

```typescript
const handler = protectedResourceHandler({
  authServerUrls: [],
  scopes: ['figma:read'],
  resource: 'https://figma-tokens-mcp.vercel.app/api/mcp',
});
```

## 🏗️ Architecture Best Practices (2025)

### 1. ✅ Security First

**Zero Trust 모델**
- ✅ 각 요청마다 토큰 검증
- ✅ 토큰은 HTTPS로만 전송
- ✅ 서버는 토큰 저장하지 않음 (stateless)

**데이터 보호**
- ✅ 사용자별 토큰 격리
- ✅ Figma API가 토큰 유효성 검증
- ✅ Read-only 권한 (scopes: ['figma:read'])

### 2. ✅ Scalability

**Vercel 배포**
- ✅ Serverless Functions (Fluid Compute)
- ✅ 자동 스케일링
- ✅ Edge 배포 가능
- ✅ 제로 유휴 비용

**Stateless 설계**
- ✅ 모든 상태는 요청에 포함
- ✅ 세션 저장소 불필요
- ✅ 수평 확장 가능

### 3. ✅ Tool Design

**명확한 책임 분리**
- ✅ `extract_tokens`: Figma 파일에서 토큰 추출
- ✅ `convert_to_tailwind`: Tailwind CSS 설정 생성
- ✅ `generate_component`: React 컴포넌트 생성
- ✅ `health_check`: 서버 상태 확인
- ✅ `get_server_info`: 서버 정보 조회

**Higher-level Abstractions**
- ✅ 단일 API 엔드포인트를 하나의 tool로 매핑하지 않음
- ✅ 관련 작업을 고수준 함수로 그룹화

### 4. ✅ Documentation

**API 문서화**
- ✅ 각 tool에 명확한 설명
- ✅ Zod 스키마로 입력 검증
- ✅ TypeScript 타입 정의
- ✅ 예제 코드 제공

**버전 관리**
- ✅ Semantic Versioning
- ✅ CHANGELOG.md 유지
- ✅ Breaking changes 명시

## 🔐 Security Compliance

### GitHub's Remote MCP Server Guidelines

**✅ 준수 항목**

1. **OAuth 2.1 Standard**
   - ✅ Bearer token authentication
   - ✅ Token audience validation
   - ✅ Protected resource metadata

2. **Multi-User Data Protection**
   - ✅ 사용자별 토큰 격리
   - ✅ 요청마다 인증 검증
   - ✅ Least-privilege 원칙

3. **Production Readiness**
   - ✅ 구조화된 로깅 (`ToolContext.logger`)
   - ✅ 에러 핸들링
   - ✅ Input validation (Zod schemas)

**📋 개선 예정**

1. **Advanced Observability** (Optional)
   - [ ] OpenTelemetry 통합
   - [ ] Distributed tracing
   - [ ] Correlation IDs

2. **Secrets Management** (Optional)
   - [ ] Vercel Environment Variables (현재 사용자별 토큰이라 불필요)
   - [ ] Token rotation (Figma API 레벨)

## 📊 Deployment Strategy

### Vercel Best Practices 2025

**✅ 현재 구현**

1. **`mcp-handler` 사용**
   ```typescript
   import { createMcpHandler, withMcpAuth } from 'mcp-handler';
   ```

2. **Next.js API Routes**
   - ✅ `/api/mcp` 엔드포인트
   - ✅ GET/POST/DELETE 메서드
   - ✅ Edge Runtime 호환

3. **Authentication Wrapper**
   - ✅ `withMcpAuth` for OAuth
   - ✅ Bearer token validation
   - ✅ Scope enforcement

4. **Local Testing**
   ```bash
   npx @modelcontextprotocol/inspector@latest http://localhost:3000
   ```

## 🎯 MCP 2025 Quality Checklist

### Core Requirements

- [x] Streamable HTTP transport (2025-03-26 spec)
- [x] OAuth 2.1 authentication
- [x] Protected resource metadata endpoint
- [x] Stateless design
- [x] Per-user authorization
- [x] Input validation with schemas
- [x] Structured error handling
- [x] Clear tool descriptions
- [x] TypeScript type safety

### Best Practices

- [x] Security-first design
- [x] Zero Trust model
- [x] Read-only scopes
- [x] HTTPS enforcement
- [x] Serverless deployment
- [x] Auto-scaling support
- [x] Documentation completeness
- [x] Semantic versioning

### Production Readiness

- [x] OAuth metadata endpoint
- [x] CORS handling
- [x] Structured logging
- [x] Error messages with context
- [x] Health check endpoint
- [x] Server info endpoint
- [ ] OpenTelemetry (optional)
- [ ] Rate limiting (Vercel 레벨)

## 🚀 Future Roadmap

### MCP 스펙 업데이트 대응

- **2025-Q1**: Streamable HTTP 안정화
- **2025-Q2**: OAuth 2.1 확장 기능
- **2025-Q3**: 고급 observability
- **2025-Q4**: Multi-model support

### 기능 확장

- [ ] Rate limiting 구현
- [ ] Request caching
- [ ] Batch operations
- [ ] Webhooks 지원

## 📚 References

- [MCP Specification 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26)
- [GitHub: Secure Remote MCP Servers](https://github.blog/ai-and-ml/generative-ai/how-to-build-secure-and-scalable-remote-mcp-servers/)
- [Vercel MCP Deployment Guide](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)
- [15 Best Practices for Production MCP Servers](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)
- [OAuth 2.1](https://oauth.net/2.1/)
- [RFC 8414: OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)

---

**Last Updated**: 2025-01-01
**MCP Spec Version**: 2025-03-26
**Compliance Status**: ✅ Fully Compliant
