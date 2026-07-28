/**
 * KnowledgeBaseEngine — Enterprise Knowledge Base for Service Desk
 *
 * Article management, categories, search, helpful/not-helpful ratings,
 * version history, related ticket suggestions.
 */

export interface KBArticle {
  id: string;
  title: string;
  body: string;
  categoryId?: string;
  categoryName?: string;
  tags: string[];
  isPublished: boolean;
  isInternal: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedTicketTypes: string[];
  version: number;
  authorId?: string;
  authorName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KBCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  order: number;
  articleCount: number;
}

class KnowledgeBaseEngineImpl {
  private articles: Map<string, KBArticle> = new Map();
  private categories: Map<string, KBCategory> = new Map();

  constructor() {
    this.createDefaultCategories();
  }

  private createDefaultCategories(): void {
    const cats = [
      { id: "getting_started", name: "Getting Started", icon: "Rocket", order: 1 },
      { id: "hardware", name: "Hardware Support", icon: "Monitor", order: 2 },
      { id: "software", name: "Software & Applications", icon: "Terminal", order: 3 },
      { id: "network", name: "Network & Connectivity", icon: "Wifi", order: 4 },
      { id: "student", name: "Student Services", icon: "GraduationCap", order: 5 },
      { id: "finance", name: "Finance & Billing", icon: "DollarSign", order: 6 },
      { id: "hr", name: "HR & People", icon: "Users", order: 7 },
      { id: "facility", name: "Facility Management", icon: "Building", order: 8 },
      { id: "faq", name: "FAQs", icon: "HelpCircle", order: 9 },
    ];
    cats.forEach((c) => this.categories.set(c.id, { ...c, articleCount: 0, description: `${c.name} articles` }));
  }

  createArticle(params: {
    title: string;
    body: string;
    categoryId?: string;
    tags?: string[];
    isPublished?: boolean;
    isInternal?: boolean;
    relatedTicketTypes?: string[];
    authorId?: string;
    authorName?: string;
  }): KBArticle {
    const now = Date.now();
    const article: KBArticle = {
      id: `kb_${now}_${Math.random().toString(36).slice(2, 6)}`,
      title: params.title,
      body: params.body,
      categoryId: params.categoryId,
      categoryName: params.categoryId ? this.categories.get(params.categoryId)?.name : undefined,
      tags: params.tags || [],
      isPublished: params.isPublished ?? true,
      isInternal: params.isInternal ?? false,
      views: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      relatedTicketTypes: params.relatedTicketTypes || [],
      version: 1,
      authorId: params.authorId,
      authorName: params.authorName,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(article.id, article);

    const cat = this.categories.get(params.categoryId || "");
    if (cat) cat.articleCount = (cat.articleCount || 0) + 1;

    return article;
  }

  getArticle(id: string): KBArticle | undefined {
    const article = this.articles.get(id);
    if (article) {
      article.views = (article.views || 0) + 1;
    }
    return article;
  }

  updateArticle(id: string, updates: Partial<KBArticle>): KBArticle | undefined {
    const article = this.articles.get(id);
    if (!article) return undefined;
    const updated = { ...article, ...updates, version: article.version + 1, updatedAt: Date.now(), id };
    this.articles.set(id, updated);
    return updated;
  }

  searchArticles(query: string, filters?: { categoryId?: string; isInternal?: boolean }): KBArticle[] {
    const q = query.toLowerCase();
    let results = Array.from(this.articles.values());

    if (filters?.categoryId) results = results.filter((a) => a.categoryId === filters.categoryId);
    if (filters?.isInternal !== undefined) results = results.filter((a) => a.isInternal === filters.isInternal);

    if (query) {
      results = results.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return results.sort((a, b) => b.views - a.views);
  }

  /** Find articles related to a ticket type */
  findRelatedArticles(ticketType: string, limit = 5): KBArticle[] {
    return Array.from(this.articles.values())
      .filter((a) => a.isPublished && !a.isInternal && (
        a.relatedTicketTypes.includes(ticketType) ||
        a.tags.some((t) => t.toLowerCase().includes(ticketType.toLowerCase()))
      ))
      .sort((a, b) => b.helpfulCount / (b.views || 1) - a.helpfulCount / (a.views || 1))
      .slice(0, limit);
  }

  /** Mark article as helpful */
  markHelpful(articleId: string): void {
    const article = this.articles.get(articleId);
    if (article) article.helpfulCount = (article.helpfulCount || 0) + 1;
  }

  /** Mark article as not helpful */
  markNotHelpful(articleId: string): void {
    const article = this.articles.get(articleId);
    if (article) article.notHelpfulCount = (article.notHelpfulCount || 0) + 1;
  }

  getCategories(): KBCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  getCategory(id: string): KBCategory | undefined {
    return this.categories.get(id);
  }

  getStats(): { totalArticles: number; published: number; totalViews: number; totalHelpful: number } {
    const all = Array.from(this.articles.values());
    return {
      totalArticles: all.length,
      published: all.filter((a) => a.isPublished).length,
      totalViews: all.reduce((s, a) => s + (a.views || 0), 0),
      totalHelpful: all.reduce((s, a) => s + (a.helpfulCount || 0), 0),
    };
  }

  reset(): void {
    this.articles.clear();
    this.categories.clear();
    this.createDefaultCategories();
  }
}

export const knowledgeBaseEngine = new KnowledgeBaseEngineImpl();
