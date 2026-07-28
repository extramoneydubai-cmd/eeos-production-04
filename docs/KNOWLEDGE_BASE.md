# EEOS Knowledge Base

## Overview

The Knowledge Base engine provides self-service and agent-facing documentation for the Service Desk platform. It supports article management, categorized browsing, full-text search, helpful/not-helpful ratings, version history, and related ticket type suggestions.

## Architecture

```
KnowledgeBaseEngine
  ├── createArticle()        → Creates new KB article
  ├── getArticle()           → Fetches article (auto-increments views)
  ├── updateArticle()        → Updates article (auto-increments version)
  ├── searchArticles()       → Full-text search with category/internal filters
  ├── findRelatedArticles()  → Finds articles related to ticket type
  ├── markHelpful()          → Increments helpful count
  ├── markNotHelpful()       → Increments not-helpful count
  ├── getCategories()        → Lists all categories
  ├── getCategory()          → Gets single category
  └── getStats()             → Article/published/view/helpful totals
```

## Categories

9 default categories are registered on initialization:

| ID | Name | Icon | Order |
|----|------|------|-------|
| `getting_started` | Getting Started | Rocket | 1 |
| `hardware` | Hardware Support | Monitor | 2 |
| `software` | Software & Applications | Terminal | 3 |
| `network` | Network & Connectivity | Wifi | 4 |
| `student` | Student Services | GraduationCap | 5 |
| `finance` | Finance & Billing | DollarSign | 6 |
| `hr` | HR & People | Users | 7 |
| `facility` | Facility Management | Building | 8 |
| `faq` | FAQs | HelpCircle | 9 |

## Article Model

```typescript
interface KBArticle {
  id: string;
  title: string;
  body: string;
  categoryId?: string;
  categoryName?: string;
  tags: string[];
  isPublished: boolean;
  isInternal: boolean;       // Internal agent-only articles
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedTicketTypes: string[];  // Links to TICKET_TYPES
  version: number;
  authorId?: string;
  authorName?: string;
  createdAt: number;
  updatedAt: number;
}
```

## Article Versioning

Each update increments the `version` field automatically. This enables:
- Tracking article history
- Reverting to previous versions
- Audit trail for content changes

## Rating System

Articles support binary helpful/not-helpful rating:

```typescript
// Mark as helpful
knowledgeBaseEngine.markHelpful(articleId);

// Mark as not helpful
knowledgeBaseEngine.markNotHelpful(articleId);
```

The `findRelatedArticles()` method sorts results by helpfulness ratio (`helpfulCount / views`) to surface the most useful content first.

## Search

Full-text search across:
- Title
- Body content
- Tags

With optional filters:
- Category ID
- Internal/Published status

```typescript
knowledgeBaseEngine.searchArticles("printer not working", {
  categoryId: "hardware",
  isInternal: false,
});
```

## Related Articles

When viewing a ticket, the system automatically suggests relevant articles:

```typescript
knowledgeBaseEngine.findRelatedArticles(ticketType, limit = 5)
```

This matches articles where:
- `relatedTicketTypes` includes the ticket type
- Tags contain the ticket type keyword
- Articles are sorted by helpfulness ratio

## API Reference

```typescript
// Create article
knowledgeBaseEngine.createArticle({
  title: string,
  body: string,
  categoryId?: string,
  tags?: string[],
  isPublished?: boolean,
  isInternal?: boolean,
  relatedTicketTypes?: string[],
  authorId?: string,
  authorName?: string,
}) => KBArticle

// Get article (increments views)
knowledgeBaseEngine.getArticle(id: string) => KBArticle | undefined

// Update article (increments version)
knowledgeBaseEngine.updateArticle(id: string, updates: Partial<KBArticle>) => KBArticle | undefined

// Search
knowledgeBaseEngine.searchArticles(query: string, filters?: {
  categoryId?: string;
  isInternal?: boolean;
}) => KBArticle[]

// Find related articles
knowledgeBaseEngine.findRelatedArticles(ticketType: string, limit?: number) => KBArticle[]

// Ratings
knowledgeBaseEngine.markHelpful(articleId: string): void
knowledgeBaseEngine.markNotHelpful(articleId: string): void

// Categories
knowledgeBaseEngine.getCategories() => KBCategory[]
knowledgeBaseEngine.getCategory(id: string) => KBCategory | undefined

// Stats
knowledgeBaseEngine.getStats() => { totalArticles, published, totalViews, totalHelpful }
```

## Dashboard Integration

KB stats are displayed in:
- **SupportDashboard** (`/support`): Total articles, published count, total views
- **TicketWorkspace** (`/tickets/:id`): Related articles panel in Knowledge tab

## Convex Schema

The KB is backed by two Convex tables:

### `knowledgeArticles`
- `title`, `body`, `bodyHtml` — Content
- `categoryId` — FK to knowledgeCategories
- `tags`, `isPublished`, `isInternal` — Visibility
- `views`, `helpfulCount`, `notHelpfulCount` — Engagement
- `relatedTicketTypes` — Cross-reference to ticket types
- `version` — Version counter
- Indexed by: category, published+views, tags, organization

### `knowledgeCategories`
- `name`, `description` — Identity
- `parentId` — Nested hierarchy support
- `icon`, `order` — Display
- `isActive` — Soft delete
- Indexed by: parent, organization
