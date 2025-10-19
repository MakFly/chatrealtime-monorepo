# Fix JWT Security Gaps - Design

## Architecture Overview

### Security Layer Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Backend API   │
│   (Next.js)     │    │   (Rate Limiter) │    │   (Symfony)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   JWT Storage   │    │   Redis Cache    │    │   PostgreSQL    │
│   (Memory)      │    │   (Blacklist)    │    │   (Users/Tokens)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Security Components

#### 1. Rate Limiting Layer
- **Symfony Rate Limiter** for endpoint protection
- **IP-based limiting** for brute force prevention
- **User-based limiting** for refresh token abuse
- **Progressive penalties** for repeated violations

#### 2. Token Security Layer
- **Refresh token rotation** on every refresh
- **Access token blacklisting** with Redis
- **Token fingerprinting** for theft detection
- **Shorter token TTL** for reduced exposure

#### 3. Security Headers Layer
- **Middleware-based** security headers
- **Environment-specific** configuration
- **Cache control** for sensitive data
- **HTTPS enforcement** in production

#### 4. Monitoring Layer
- **Security event logging** with structured data
- **Anomaly detection** for suspicious patterns
- **Alert system** for security team
- **Dashboard** for security metrics

## Design Decisions

### Rate Limiting Strategy

**Decision**: Use Symfony Rate Limiter with Redis backend
**Rationale**: 
- Native Symfony integration
- Redis provides distributed rate limiting
- Configurable per endpoint
- Progressive penalty system

**Implementation**:
```yaml
# config/packages/rate_limiter.yaml
rate_limiter:
    auth_login:
        policy: 'token_bucket'
        limit: 5
        interval: '1 minute'
    auth_register:
        policy: 'token_bucket'  
        limit: 3
        interval: '1 minute'
    auth_refresh:
        policy: 'token_bucket'
        limit: 10
        interval: '1 minute'
        key: 'user_id'
```

### Token Rotation Strategy

**Decision**: Rotate refresh tokens on every use
**Rationale**:
- Prevents token reuse attacks
- Limits exposure window
- Industry best practice
- OAuth 2.1 compliance

**Implementation**:
```php
// AuthController.php - refresh method
public function refresh(Request $request): JsonResponse
{
    // 1. Validate current refresh token
    $refreshToken = $this->refreshTokenManager->get($data['refresh_token']);
    
    // 2. Generate new access token
    $accessToken = $this->jwtManager->create($user);
    
    // 3. Invalidate old refresh token
    $this->refreshTokenManager->delete($refreshToken);
    
    // 4. Generate new refresh token
    $newRefreshToken = $this->refreshTokenGenerator->createForUserWithTtl($user, 604800); // 7 days
    
    // 5. Return both tokens
    return $this->json([
        'access_token' => $accessToken,
        'refresh_token' => $newRefreshToken->getRefreshToken(),
    ]);
}
```

### Token Blacklisting Strategy

**Decision**: Use Redis for token blacklist with TTL
**Rationale**:
- Fast lookup performance
- Automatic expiration
- Distributed across instances
- Memory efficient

**Implementation**:
```php
// TokenBlacklistService.php
class TokenBlacklistService
{
    public function blacklistToken(string $token, int $ttl): void
    {
        $this->redis->setex(
            "blacklist:{$token}", 
            $ttl, 
            json_encode(['revoked_at' => time()])
        );
    }
    
    public function isTokenBlacklisted(string $token): bool
    {
        return $this->redis->exists("blacklist:{$token}");
    }
}
```

### Security Headers Strategy

**Decision**: Middleware-based security headers
**Rationale**:
- Consistent across all endpoints
- Easy to maintain and update
- Environment-specific configuration
- Performance efficient

**Implementation**:
```php
// SecurityHeadersMiddleware.php
class SecurityHeadersMiddleware
{
    public function addSecurityHeaders(Response $response): void
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        
        if ($this->isSensitiveEndpoint()) {
            $response->headers->set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
        }
    }
}
```

### Monitoring Strategy

**Decision**: Structured logging with alerting
**Rationale**:
- Security event tracking
- Pattern detection
- Incident response
- Compliance requirements

**Implementation**:
```php
// SecurityEventLogger.php
class SecurityEventLogger
{
    public function logFailedLogin(string $email, string $ip, string $userAgent): void
    {
        $this->logger->warning('Failed login attempt', [
            'event_type' => 'auth.failed_login',
            'email' => $email,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'timestamp' => time(),
            'risk_score' => $this->calculateRiskScore($ip, $email)
        ]);
        
        $this->checkForSuspiciousPatterns($ip, $email);
    }
}
```

## Security Considerations

### Threat Model

#### 1. Brute Force Attacks
- **Threat**: Automated password guessing
- **Mitigation**: Rate limiting with progressive penalties
- **Detection**: Multiple failed attempts from same IP

#### 2. Token Theft
- **Threat**: Stolen refresh tokens
- **Mitigation**: Token rotation and fingerprinting
- **Detection**: Token reuse from different devices

#### 3. Session Hijacking
- **Threat**: XSS attacks stealing tokens
- **Mitigation**: Secure token storage guidance
- **Detection**: Unusual token usage patterns

#### 4. Man-in-the-Middle
- **Threat**: Network interception
- **Mitigation**: HTTPS enforcement and HSTS
- **Detection**: Certificate validation

### Security Controls

#### 1. Preventive Controls
- Rate limiting on all auth endpoints
- Strong password requirements
- Secure token storage guidance
- HTTPS enforcement

#### 2. Detective Controls
- Security event logging
- Anomaly detection
- Failed attempt tracking
- Token usage monitoring

#### 3. Corrective Controls
- Token blacklisting
- Account lockout
- Security alerts
- Incident response procedures

## Performance Considerations

### Rate Limiting Performance
- **Redis connection pooling** for high concurrency
- **In-memory caching** for frequently accessed limits
- **Batch operations** for multiple limit checks
- **Async processing** for non-critical security events

### Token Blacklisting Performance
- **Redis clustering** for high availability
- **TTL-based expiration** to reduce memory usage
- **Batch cleanup** for expired tokens
- **Connection reuse** for Redis operations

### Monitoring Performance
- **Async logging** to prevent blocking
- **Batch processing** for security events
- **Sampling** for high-volume events
- **Compression** for log storage

## Scalability Considerations

### Horizontal Scaling
- **Stateless design** for load balancing
- **Redis clustering** for distributed rate limiting
- **Database sharding** for user data
- **CDN integration** for static assets

### Vertical Scaling
- **Memory optimization** for token storage
- **CPU optimization** for encryption/decryption
- **I/O optimization** for database operations
- **Network optimization** for API responses

## Migration Strategy

### Phase 1: Rate Limiting
1. Deploy rate limiting with monitoring
2. Gradually reduce limits based on usage
3. Add progressive penalties
4. Monitor for false positives

### Phase 2: Token Security
1. Deploy token rotation with fallback
2. Add token blacklisting
3. Implement fingerprinting
4. Test with multiple clients

### Phase 3: Monitoring
1. Deploy security logging
2. Add anomaly detection
3. Configure alerting
4. Train security team

## Rollback Strategy

### Emergency Rollback
1. Disable rate limiting via feature flag
2. Revert to old token refresh logic
3. Disable security headers
4. Restore previous configuration

### Gradual Rollback
1. Increase rate limits temporarily
2. Disable token rotation
3. Remove security headers
4. Monitor for issues

### Data Recovery
1. Restore from database backup
2. Clear Redis blacklist
3. Reset user sessions
4. Notify affected users
