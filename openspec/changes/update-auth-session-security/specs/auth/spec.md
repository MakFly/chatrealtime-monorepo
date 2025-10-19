## ADDED Requirements
### Requirement: Minimal JWT Claims
Auth tokens MUST only include essential claims (subject, issued-at, expiration, token id) and MUST NOT expose user role arrays or profile data.

#### Scenario: JWT creation excludes roles
- **GIVEN** a user logs in successfully
- **WHEN** the API issues a JWT access token
- **THEN** the encoded payload contains only the minimal claim set (sub, iat, exp, jti) and omits role information

#### Scenario: Token refresh preserves minimal payload
- **GIVEN** a refresh token is exchanged for a new access token
- **WHEN** the new JWT is generated
- **THEN** the payload matches the minimal claim contract without roles or profile fields

### Requirement: Token TTL Consistency
Auth responses MUST surface the configured access token TTL and align refresh token persistence accordingly.

#### Scenario: Login response exposes TTL
- **GIVEN** a user obtains tokens via login or registration
- **WHEN** the API responds with token data
- **THEN** the `expires_in` field matches the configured access token TTL in seconds

#### Scenario: Refresh reuses TTL
- **GIVEN** a client refreshes an access token
- **WHEN** the refresh endpoint returns the new token
- **THEN** the response includes `expires_in` consistent with the access token TTL configuration
