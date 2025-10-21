# UI Exemples Feature

Cette feature permet de générer automatiquement des stories Storybook à partir de fichiers `*.ui_examples.yml`.

## Fonctionnalités

- **Génération automatique de stories** : Les fichiers `*.ui_examples.yml` sont automatiquement transformés en stories Storybook
- **Support des composants** : Affichage des composants avec leurs props et slots
- **Intégration complète** : Utilise le système de namespaces et d'alias existant
- **Indexation automatique** : Les stories sont automatiquement découvertes par Storybook

## Structure des fichiers

### Fichier UI Exemple (`*.ui_examples.yml`)

```yaml
id: 'homepage'
enabled: true
label: 'Homepage'
description: 'Provides standard HTML elements.'
render:
  - type: component
    component: 'umami:badge'
    props:
      icon: timer
    slots:
      text: Hola
```

### Story générée

```javascript
import badge from '@umami/badge/badge.component.yml';

export default {
  title: 'Storybook/UI Examples/Homepage',
  render: () => {
    return `
      ${badge.component({ ...badge.args, ...{"icon": "timer"}, ...{"text": "Hola"} })}
    `
  },
  play: async ({ canvasElement }) => {
    Drupal.attachBehaviors(canvasElement, window.drupalSettings)
  },
}

export const Basic = {}
```

## Architecture

### Fichiers créés

- `src/uiExemplesGenerator.ts` : Générateur principal pour les UI exemples
- `src/vite-plugin-ui-exemples.ts` : Plugin Vite et indexer Storybook
- `src/preset.ts` : Configuration mise à jour pour inclure le plugin

### Configuration

Le plugin est automatiquement configuré dans `src/preset.ts` :

```typescript
import UIExemplesPlugin, {
  uiExemplesIndexer,
} from './vite-plugin-ui-exemples.ts'

// Plugin Vite
UIExemplesPlugin({ namespaces })

// Indexer Storybook
uiExemplesIndexer
```

## Utilisation

1. Créer un fichier `*.ui_examples.yml` dans le dossier `ui_exemples/`
2. Définir la structure avec `id`, `label`, `enabled` et `render`
3. Dans `render`, spécifier les composants à afficher avec leurs props et slots
4. Storybook génère automatiquement la story correspondante

## Exemple complet

```yaml
id: 'homepage'
enabled: true
label: 'Homepage'
description: 'Page d\'accueil avec plusieurs composants'
render:
  - type: component
    component: 'umami:header'
    props:
      title: 'Mon Site'
  - type: component
    component: 'umami:badge'
    props:
      icon: timer
    slots:
      text: 'Nouveau'
  - type: component
    component: 'umami:card'
    props:
      title: 'Article'
    slots:
      content: 'Contenu de l\'article'
```

Cette structure génère une story qui affiche les trois composants dans l'ordre spécifié.
