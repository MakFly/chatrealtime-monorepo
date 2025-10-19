## ADDED Requirements
### Requirement: Verified Information Directive
Documentation MUST state that assistants cannot invent data and must rely on verified search results.

#### Scenario: CLAUDE guidance includes sourcing directive
- **GIVEN** developers reference any CLAUDE.md guidance file
- **WHEN** the file is opened
- **THEN** it contains the sentence "n’invente jamais de données, ne donne l’information que si tu as réussi à trouver une vraie information sur les moteurs de recherche"

### Requirement: TanStack Query Tutorial Coverage
Project docs MUST include a TanStack Query tutorial covering ISR, SSR, and client-side usage with jsonplaceholder endpoints.

#### Scenario: Tutorial provides ISR example
- **GIVEN** the tutorial is followed for ISR usage
- **WHEN** developers read the ISR section
- **THEN** it demonstrates prefetching/ISR patterns against a jsonplaceholder resource

#### Scenario: Tutorial provides SSR example
- **GIVEN** the tutorial SSR section
- **WHEN** read
- **THEN** it explains server-rendered data fetching using jsonplaceholder endpoints with validation steps

#### Scenario: Tutorial provides client-side example
- **GIVEN** the tutorial client-side section
- **WHEN** read
- **THEN** it presents client-side TanStack Query usage referencing jsonplaceholder endpoints and includes instructions for verifying responses
