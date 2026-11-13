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
| `WIKIJS_URL` | URL de base de votre instance Wiki.js (ex: `https://wiki.example.com`) |
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

## Intégration avec LibreChat (Docker)

### 1. Cloner le repo dans le dossier LibreChat

```bash
# À côté de docker-compose.yml
git clone https://github.com/skezu/wikijs-mcp.git
```

### 2. Ajouter les variables d'environnement dans `.env`

```env
WIKIJS_URL=https://votre-wiki.example.com
WIKIJS_TOKEN=votre-token-api
```

### 3. Ajouter le service dans `docker-compose.override.yml`

```yaml
services:
  mcp-wikijs:
    build:
      context: ./wikijs-mcp
    container_name: mcp-wikijs
    ports:
      - "8002:3000"
    environment:
      - WIKIJS_URL=${WIKIJS_URL}
      - WIKIJS_TOKEN=${WIKIJS_TOKEN}
    networks:
      - librechat-network
    restart: unless-stopped

networks:
  librechat-network:
    external: true
    name: librechat_default
```

### 4. Lancer le service

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d mcp-wikijs
```

### 5. Configurer `librechat.yaml`

```yaml
mcpServers:
  wikijs:
    url: http://mcp-wikijs:3000/sse
    type: sse
```

Puis redémarrer LibreChat :

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml restart api
```

---

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
