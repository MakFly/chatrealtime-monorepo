# Design Document: Cursor Rules Framework

## Context

Cursor IDE supports `.cursor/rules/*.md` files that provide context-aware AI assistance. These rules guide code generation, refactoring, and architectural decisions. The current project has basic OpenSpec commands but lacks comprehensive coding standards enforcement.

### Current State
- Project uses Symfony 7.3 + API Platform 4.2 + FrankenPHP
- Basic `CLAUDE.md` provides high-level instructions
- OpenSpec workflow manages change proposals
- No systematic enforcement of hexagonal architecture, DTO patterns, or quality standards

### Stakeholders
- **Developers**: Need consistent AI assistance for API development
- **Code Reviewers**: Want automated quality checks before manual review
- **Future Team Members**: Require clear patterns and examples

## Goals / Non-Goals

### Goals
1. **Enforce Hexagonal Architecture**: Separate Domain ← Application ← Infrastructure layers
2. **Standardize API Patterns**: RFC7807 errors, pagination, filtering, OpenAPI
3. **Ensure Code Quality**: PHPStan level 9, PHP CS Fixer, Pest testing, 90%+ coverage
4. **Prevent Common Mistakes**: N+1 queries, entity exposure, fat controllers
5. **Support Multi-Framework**: Symfony + API Platform primary, Laravel patterns for flexibility
6. **Provide Scaffolds**: Ready-to-use templates for common files (DTOs, Services, Tests)

### Non-Goals
- Not replacing OpenSpec (works alongside it)
- Not a runtime validation system (IDE-time only)
- Not covering frontend or non-API code
- Not enforcing specific business logic patterns
- Not a complete code generator (assists, doesn't automate)

## Decisions

### Decision 1: Multi-File Rule Structure
**Choice**: Separate rules into 6 focused files (01-06) instead of single monolithic file

**Rationale**:
- **Cognitive Load**: Each file <500 lines, focused on single concern
- **Performance**: Cursor loads rules incrementally, faster parsing
- **Maintenance**: Easier to update specific areas without affecting others
- **Modularity**: Projects can disable specific rule packs if needed

**Alternatives Considered**:
- Single `.cursorrules` file → Too large (2000+ lines), slow loading
- Per-feature files (auth, users, etc.) → Too granular, duplicated patterns
- Framework-specific only → Missed shared API patterns

### Decision 2: Framework-Neutral Common Rules First
**Choice**: Start with common API patterns (RFC7807, pagination) before framework-specific rules

**Rationale**:
- **Reusability**: 60% of patterns shared across Symfony/Laravel
- **Consistency**: Same error format, pagination logic regardless of framework
- **Migration**: Easier to switch frameworks with shared foundations
- **Learning**: New devs learn API principles before framework specifics

### Decision 3: Template-Based Scaffolding
**Choice**: Provide complete file templates with placeholder variables, not code snippets

**Rationale**:
- **Completeness**: Full file structure with imports, namespaces, documentation
- **Consistency**: Same structure every time, no partial implementations
- **Speed**: Generate entire files vs. assembling snippets manually
- **Type Safety**: Templates pre-typed with PHP 8.3 features (readonly, enums)

**Format**:
```php
// Template variables: {EntityName}, {Namespace}, {Fields}
// Cursor replaces during generation
```

### Decision 4: Refactoring Actions as Workflows
**Choice**: Define step-by-step refactoring instructions, not automated scripts

**Rationale**:
- **Context-Aware**: AI understands project-specific naming/structure
- **Safety**: Developer reviews each step, no blind automation
- **Learning**: Teaches hexagonal patterns through guided refactoring
- **Flexibility**: Adapts to edge cases automated tools miss

**Example Structure**:
```
Refactoring: Fat Controller → Hexagonal
Detection: >80 lines, inline queries, no DTOs
Steps:
  1. Extract DTO from request validation
  2. Create Application Service with single method
  3. Move ORM queries to Infrastructure Repository
  4. Transform response to API Resource/DTO
  5. Add Pest tests for Service + Controller
```

### Decision 5: PHPStan Level 9 with Baseline
**Choice**: Require maximum strictness, but allow baseline for legacy code

**Rationale**:
- **New Code Quality**: Level 9 catches 99% of type issues
- **Pragmatic Migration**: Baseline doesn't block development on existing code
- **Incremental Improvement**: Teams can shrink baseline over time
- **CI Integration**: Fails on new violations, tracks baseline reduction

**Configuration**:
```yaml
# phpstan.neon
parameters:
  level: 9
  paths: [src, tests]
  baseline: phpstan-baseline.neon  # Generated with --generate-baseline
```

### Decision 6: Pest Over PHPUnit
**Choice**: Use Pest for all new tests, provide migration patterns for PHPUnit

**Rationale**:
- **Readability**: `it('returns 200')` vs. `public function testItReturns200()`
- **Speed**: Faster test execution with parallel support
- **Ergonomics**: Built-in helpers for HTTP, Database, Assertions
- **Momentum**: Growing adoption in PHP community (Laravel default)

**Migration Path**: Provide side-by-side examples (PHPUnit → Pest)

### Decision 7: RFC7807 Problem Details Everywhere
**Choice**: Standardize on RFC7807 for all API errors, no custom formats

**Rationale**:
- **Standard Compliance**: Industry-standard format, widely supported
- **Tooling**: Client libraries exist for parsing RFC7807
- **Debugging**: `trace_id` enables log correlation
- **Extensibility**: Supports custom fields via `extensions`

**Format**:
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid credentials",
  "trace_id": "uuid-v4",
  "violations": [{"field": "email", "message": "Invalid format"}]
}
```

## Risks / Trade-offs

### Risk 1: Rule Complexity Overload
**Risk**: Too many rules slow down Cursor, confuse developers
**Mitigation**:
- Keep each rule file <500 lines
- Use clear section headers and table of contents
- Provide "Quick Start" section in each file
- Allow disabling specific rule files via `.cursorignore`

### Risk 2: Framework Lock-In
**Risk**: Too Symfony-specific, hard to adapt for Laravel or other frameworks
**Mitigation**:
- Separate common API rules (60% of content)
- Clearly mark framework-specific sections
- Provide parallel examples (Symfony vs. Laravel)
- Use framework-agnostic terms (DTO, not ApiResource)

### Risk 3: Template Staleness
**Risk**: Templates become outdated as frameworks evolve
**Mitigation**:
- Version templates with framework version comments
- Test templates with CI on each PHP/framework minor version
- Document template last-updated date
- Provide upgrade path in comments

### Risk 4: Conflict with CLAUDE.md
**Risk**: Rules contradict existing project instructions
**Mitigation**:
- Cross-reference `CLAUDE.md` during rule creation
- Mark conflicting areas explicitly ("Overrides CLAUDE.md section X")
- Prioritize project-specific `CLAUDE.md` over generic rules
- Document precedence: Project context > Cursor rules > Defaults

### Trade-off: Verbosity vs. Completeness
**Trade-off**: Detailed rules (better guidance) vs. Concise rules (faster loading)
**Decision**: Favor completeness, optimize with:
- Code folding sections
- Separate files for deep-dive topics
- Quick-reference tables at top
- Progressive disclosure (basic → advanced)

### Trade-off: Strict vs. Flexible
**Trade-off**: Strict rules (consistency) vs. Flexible rules (developer freedom)
**Decision**: Strict for architecture/security, flexible for implementation:
- **Strict**: Hexagonal layers, RFC7807, DTO usage, PHPStan level 9
- **Flexible**: Naming conventions, file organization, service patterns

## Migration Plan

### Phase 1: Foundation (Week 1)
- Create `.cursor/rules/` directory
- Generate common API rules (RFC7807, pagination)
- Test with existing project, validate no conflicts

### Phase 2: Framework Rules (Week 2)
- Generate Symfony + API Platform rules and templates
- Generate Laravel rules (for future-proofing)
- Validate templates compile and run

### Phase 3: Quality Rules (Week 3)
- Add PHPStan/Pint/Pest configurations
- Create refactoring action workflows
- Test on sample fat controller refactoring

### Phase 4: Validation (Week 4)
- Load all rules in Cursor IDE, test suggestions
- Apply to existing codebase, measure improvement
- Document usage patterns and examples
- Run `openspec validate --strict`

### Rollback Strategy
If rules cause issues:
1. Move problematic rule file to `.cursor/rules/.disabled/`
2. Restart Cursor IDE to clear cache
3. Identify specific section causing issue
4. Fix or remove, re-enable file
5. If unsolvable, document known issue in rule file header

### Monitoring Success
- **AI Suggestion Quality**: Track % of accepted suggestions (target: >70%)
- **Code Review Comments**: Measure reduction in style/architecture comments
- **Onboarding Time**: New devs productive faster with templates
- **Bug Rate**: Fewer N+1 queries, exposed entities, type errors

## Open Questions

1. **Performance**: What's max rule file size before Cursor slows down? (Need benchmarking)
2. **Versioning**: Should rules be versioned with framework versions? (e.g., `02-symfony-7.3.md`)
3. **Distribution**: Should rules be shareable across projects? (Consider packaging as composer package)
4. **CI Integration**: Can Cursor rules generate CI config automatically? (Explore API)
5. **Conflict Resolution**: How to handle when AI suggests code violating rules? (Need escalation path)
6. **Localization**: Should rules support French? (Current project bilingual, but code English)

## Next Steps

1. Validate this design document with team/stakeholders
2. Get OpenSpec proposal approved
3. Implement Phase 1 (common API rules)
4. Test with real refactoring scenario
5. Iterate based on feedback before full rollout
