# AI-DD : AI-Data-Driven Development Guide

## 📚 Vue d'ensemble

Ce dossier contient les **règles, principes et bonnes pratiques** pour développer une application Symfony robuste en suivant :

- **TDD** (Test-Driven Development)
- **SOLID** (Principes de conception orientée objet)
- **Clean Architecture** (Architecture hexagonale adaptée à Symfony)
- **DDD** (Domain-Driven Design - patterns tactiques)

## 🎯 Objectifs

1. **Code maintenable** : Faciliter les modifications et évolutions
2. **Code testable** : Couverture de tests élevée (>80%)
3. **Code évolutif** : Ajouter des fonctionnalités sans casser l'existant
4. **Code lisible** : Auto-documenté avec des noms explicites

## 📂 Structure de la documentation

```
AI-DD/
├── README.md (ce fichier)
├── architecture/
│   ├── clean-architecture.md       # Architecture hexagonale
│   ├── layered-structure.md        # Structure en couches
│   └── dependency-injection.md     # Injection de dépendances
├── solid/
│   ├── single-responsibility.md    # SRP
│   ├── open-closed.md              # OCP
│   ├── liskov-substitution.md      # LSP
│   ├── interface-segregation.md    # ISP
│   └── dependency-inversion.md     # DIP
├── tdd/
│   ├── test-first.md               # TDD workflow
│   ├── unit-tests.md               # Tests unitaires
│   ├── integration-tests.md        # Tests d'intégration
│   └── testing-strategies.md       # Stratégies de test
├── symfony/
│   ├── best-practices.md           # Bonnes pratiques Symfony
│   ├── controller-slim.md          # Controllers minimalistes
│   ├── service-layer.md            # Couche service
│   └── entity-design.md            # Conception d'entités
├── interfaces/
│   ├── when-to-use.md              # Quand utiliser des interfaces
│   ├── naming-conventions.md       # Conventions de nommage
│   └── contracts.md                # Contrats d'interface
└── examples/
    ├── good-practices/             # Exemples de bon code
    └── anti-patterns/              # Exemples d'anti-patterns

```

## 🚀 Démarrage rapide

### Pour les développeurs

1. **Lire en priorité** :
   - `architecture/clean-architecture.md`
   - `solid/single-responsibility.md`
   - `interfaces/when-to-use.md`
   - `tdd/test-first.md`

2. **Avant d'écrire du code** :
   - Lire `symfony/best-practices.md`
   - Consulter les exemples dans `examples/`

3. **Lors du code review** :
   - Vérifier le respect des principes SOLID
   - Valider la couverture de tests
   - Checker l'utilisation appropriée des interfaces

### Pour l'IA (Claude, Cursor, etc.)

Lors du développement :
1. Toujours privilégier TDD (écrire le test d'abord)
2. Respecter les principes SOLID à chaque nouvelle classe
3. Utiliser des interfaces pour les dépendances importantes
4. Maintenir les controllers Symfony minimalistes (<50 lignes)
5. Implémenter la logique métier dans les services

## 🎓 Principes fondamentaux

### 1. TDD (Test-Driven Development)

```
Red → Green → Refactor

1. ❌ Écrire un test qui échoue
2. ✅ Écrire le minimum de code pour le faire passer
3. 🔄 Refactoriser en gardant les tests verts
```

### 2. SOLID

| Principe | Description | Impact |
|----------|-------------|--------|
| **S**RP | Une classe = une responsabilité | Facilite maintenance |
| **O**CP | Ouvert à l'extension, fermé à la modification | Réduit risques de régression |
| **L**SP | Substitution sans casser le comportement | Polymorphisme sûr |
| **I**SP | Interfaces spécifiques plutôt que générales | Couplage faible |
| **D**IP | Dépendre d'abstractions, pas de concrets | Flexibilité maximale |

### 3. Clean Architecture (Symfony)

```
┌─────────────────────────────────────────┐
│         Controller (HTTP Layer)         │ ← Slim, délègue tout
├─────────────────────────────────────────┤
│      Service Layer (Application)        │ ← Orchestration
├─────────────────────────────────────────┤
│     Domain Layer (Business Logic)       │ ← Règles métier
├─────────────────────────────────────────┤
│  Infrastructure (Doctrine, API, etc.)   │ ← Détails techniques
└─────────────────────────────────────────┘
```

## 🔍 Checklist avant de committer

- [ ] Tous les tests passent (`make test`)
- [ ] Couverture de code >80% pour le nouveau code
- [ ] PHPStan niveau max sans erreur (`make tools`)
- [ ] Pas de duplication de code (DRY)
- [ ] Principes SOLID respectés
- [ ] Interfaces utilisées pour les dépendances clés
- [ ] Controllers < 50 lignes
- [ ] Services avec une seule responsabilité
- [ ] Documentation PHPDoc complète
- [ ] Nommage explicite (pas de `$data`, `$tmp`, etc.)

## 📖 Lecture recommandée

### Livres
- **Clean Code** - Robert C. Martin
- **Clean Architecture** - Robert C. Martin
- **Domain-Driven Design** - Eric Evans
- **Test-Driven Development** - Kent Beck

### Articles
- [Symfony Best Practices](https://symfony.com/doc/current/best_practices.html)
- [SOLID Principles in PHP](https://www.digitalocean.com/community/tutorials/solid-principles-php)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

## 🆘 Support

- **Questions sur TDD** : Voir `tdd/test-first.md`
- **Questions sur SOLID** : Voir les fichiers dans `solid/`
- **Questions sur les interfaces** : Voir `interfaces/when-to-use.md`
- **Exemples de code** : Voir `examples/good-practices/`

---

**Version** : 1.0
**Dernière mise à jour** : 2025-10-19
**Mainteneur** : Équipe de développement
