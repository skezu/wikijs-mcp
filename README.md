# wikijs-mcp

Serveur MCP (Model Context Protocol) pour interagir avec l'API GraphQL de Wiki.js.

## Prérequis

- Node.js 18+
- Un token API Wiki.js (généré depuis **Administration > API Access**)

## Installation

```bash
npm install
npm run build
```

## Configuration

Deux variables d'environnement sont requises :

| Variable | Description |
|---|---|
| `WIKIJS_URL` | URL de base de votre instance Wiki.js (ex: `https://platform.digiteka.com`) |
| `WIKIJS_TOKEN` | Token JWT généré depuis l'interface d'administration Wiki.js |

## Intégration avec Claude Code

Ajouter dans `.mcp.json` à la racine du projet :

```json
{
  "mcpServers": {
    "wikijs": {
      "command": "node",
      "args": ["<chemin_absolu>/wikijs-mcp/dist/index.js"],
      "env": {
        "WIKIJS_URL": "https://votre-wiki.example.com",
        "WIKIJS_TOKEN": "votre-token-api"
      }
    }
  }
}
```

## Outils disponibles

### Pages

| Outil | Description |
|---|---|
| `pages_list` | Liste toutes les pages (tri configurable : `TITLE`, `CREATED`, `UPDATED`, `ID`, `PATH`) |
| `pages_search` | Recherche plein texte dans les pages |
| `pages_get` | Récupère le contenu et les métadonnées d'une page par son ID |
| `pages_create` | Crée une nouvelle page (Markdown) |
| `pages_update` | Met à jour une page existante (contenu, titre, tags, statut de publication) |
| `pages_delete` | Supprime une page par son ID |

### Utilisateurs

| Outil | Description |
|---|---|
| `users_search` | Recherche des utilisateurs par nom ou email |
| `users_get` | Récupère les informations d'un utilisateur par son ID |
| `users_create` | Crée un nouvel utilisateur local |

### Groupes

| Outil | Description |
|---|---|
| `groups_list` | Liste tous les groupes de permissions |
| `groups_create` | Crée un nouveau groupe |

### Requête brute

| Outil | Description |
|---|---|
| `graphql_query` | Exécute une requête ou mutation GraphQL arbitraire (pour les opérations non couvertes par les outils ci-dessus) |

## Structure du projet

```
wikijs-mcp/
├── src/
│   ├── index.ts      # Point d'entrée (transport stdio)
│   ├── server.ts     # Définition des outils MCP
│   └── client.ts     # Client HTTP GraphQL avec authentification Bearer
├── dist/             # Code compilé (généré par `npm run build`)
├── package.json
└── tsconfig.json
```

## Exemples d'utilisation

### Lister les pages

```
pages_list { orderBy: "TITLE" }
```

### Rechercher une page

```
pages_search { query: "API Upload" }
```

### Créer une page

```
pages_create {
  path: "docs/nouveau-guide",
  title: "Nouveau Guide",
  content: "# Contenu en Markdown",
  tags: ["guide", "api"]
}
```

### Requête GraphQL brute

```
graphql_query {
  query: "{ pages { list(orderBy: UPDATED) { id title updatedAt } } }"
}
```
