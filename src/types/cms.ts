export interface Section {
  id: string;
  sectionId: string;
  name: string;
  type: string;
  data: Array<{
    sectionId: string;
    type: string;
    data: Record<string, unknown>;
  }>;
  order: number;
  description: string;
}

export interface AvailableSection {
  id: string;
  sectionId: string;
  name: string;
  type: string;
  description?: string;
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  description: string;
  template: string;
  isPublished: boolean;
  pageType: string;
  locale: string;
  sections: Section[];
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface PageParams {
  locale: string;
  slug: string;
  [key: string]: string;
}

export interface PageResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  pageType: string;
  locale?: string;
  sections?: Array<{
    id: string;
    order: number;
    title?: string;
    componentType?: string;
    sectionId?: string;
    data?: Record<string, unknown>;
    isVisible?: boolean;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  publishDate?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface NotificationType {
  type: 'success' | 'error';
  message: string;
}

export interface ManageableSectionHandle {
  saveChanges: (skipLoadingState?: boolean) => Promise<void>;
} 