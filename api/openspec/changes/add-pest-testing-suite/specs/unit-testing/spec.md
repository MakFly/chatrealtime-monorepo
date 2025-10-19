# Specification: Unit Testing

## ADDED Requirements

### Requirement: GoogleUserProvisioner Service Tests
GoogleUserProvisioner service SHALL be tested in isolation with mocked dependencies to verify user provisioning logic.

#### Scenario: Create new user from Google profile
- GIVEN no existing user with email "google@example.com"
- WHEN `provisionUser('123', 'google@example.com', 'Google User', 'https://pic.url', 'token', null)` is called
- THEN new User entity is created with googleId='123', email='google@example.com', name='Google User'
- AND User password is null (Google-only user)
- AND User is persisted to database via EntityManager

#### Scenario: Link Google account to existing password user
- GIVEN existing User with email='test@example.com', password='hashed', googleId=null
- WHEN `provisionUser('456', 'test@example.com', 'Test', 'https://pic.url', 'token', null)` is called
- THEN User googleId is set to '456'
- AND User password remains 'hashed' (preserved)
- AND User googleAccessToken is set to 'token'

#### Scenario: Update Google tokens for existing Google user
- GIVEN existing User with googleId='789', googleAccessToken='old-token'
- WHEN `provisionUser('789', 'user@example.com', 'User', 'https://pic.url', 'new-token', 'refresh')` is called
- THEN User googleAccessToken is updated to 'new-token'
- AND User googleRefreshToken is updated to 'refresh'
- AND updatedAt timestamp is updated to current time

#### Scenario: Throw exception when Google ID collision detected
- GIVEN existing User with email='alice@example.com', googleId='111'
- WHEN `provisionUser('222', 'alice@example.com', 'Alice', 'https://pic.url', 'token', null)` is called (different Google ID)
- THEN ConflictException is thrown with status code 409
- AND exception message contains "Google account mismatch"
- AND User is NOT modified in database

#### Scenario: Update user profile data on login
- GIVEN existing User with name='Old Name', picture='old.jpg'
- WHEN `provisionUser('333', 'user@example.com', 'New Name', 'new.jpg', 'token', null)` is called
- THEN User name is updated to 'New Name'
- AND User picture is updated to 'new.jpg'
- AND updatedAt timestamp is refreshed

### Requirement: User Entity Tests
User entity SHALL be tested to verify role management, password handling, and interface compliance.

#### Scenario: User always has ROLE_USER
- GIVEN new User() with roles=[]
- WHEN getRoles() is called
- THEN returns ['ROLE_USER']
- AND ROLE_USER is guaranteed even if not explicitly set

#### Scenario: User roles are unique
- GIVEN User with roles=['ROLE_USER', 'ROLE_ADMIN', 'ROLE_USER']
- WHEN getRoles() is called
- THEN returns ['ROLE_USER', 'ROLE_ADMIN'] (no duplicates)

#### Scenario: Password can be null for Google-only users
- GIVEN User with password=null
- WHEN getPassword() is called
- THEN returns null without exception
- AND User can still implement PasswordAuthenticatedUserInterface

#### Scenario: getUserIdentifier returns email
- GIVEN User with email='test@example.com'
- WHEN getUserIdentifier() is called
- THEN returns 'test@example.com'

### Requirement: UserRepository Tests
UserRepository SHALL be tested to verify query methods work correctly with test database.

#### Scenario: Find user by email
- GIVEN User persisted with email='findme@example.com'
- WHEN `findOneBy(['email' => 'findme@example.com'])` is called
- THEN returns User entity with matching email

#### Scenario: Return null when user not found
- GIVEN no User with email='notfound@example.com'
- WHEN `findOneBy(['email' => 'notfound@example.com'])` is called
- THEN returns null

#### Scenario: Find user by Google ID
- GIVEN User persisted with googleId='999'
- WHEN `findOneBy(['googleId' => '999'])` is called
- THEN returns User entity with matching googleId

#### Scenario: Upgrade user password hash
- GIVEN User with password='old-hash'
- WHEN `upgradePassword($user, 'new-hash')` is called
- THEN User password is updated to 'new-hash'
- AND User is persisted to database
