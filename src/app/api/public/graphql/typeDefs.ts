// src/app/api/public/graphql/typeDefs.ts
import { gql } from 'graphql-tag';

export const publicTypeDefs = gql`
  scalar DateTime
  scalar Json

  type PublicSiteConfig {
    siteName: String
    logoUrl: String
    faviconUrl: String
    primaryColor: String
    secondaryColor: String
    defaultLocale: String
    supportedLocales: [String!]
  }

  type PublicMedia {
    id: ID!
    url: String! # Changed from fileUrl to url for consistency with other public types if any
    altText: String
    fileName: String
    fileType: String
  }

  type PublicCMSComponent {
    id: ID!
    type: String! # Maps to component's slug or a predefined component type identifier
    data: Json
    order: Int
  }

  type PublicCMSSection {
    id: ID!
    sectionId: String! # User-defined ID for the section instance
    backgroundImage: String # URL to background image
    backgroundType: String # e.g., 'image', 'color', 'gradient'
    gridDesign: String # e.g., 'basic', 'advanced-grid', etc.
    order: Int
    components: [PublicCMSComponent!] # Components within this section
    media: [PublicMedia!] # Media directly associated with this section (e.g., background, specific images)
  }

  type PublicPage {
    id: ID!
    title: String!
    slug: String!
    description: String
    featuredImage: PublicMedia # URL or a PublicMedia object
    metaTitle: String
    metaDescription: String
    locale: String!
    sections: [PublicCMSSection!] # Sections that make up this page
  }

  type PublicPost {
    id: ID!
    title: String!
    slug: String!
    content: String # HTML or Markdown content
    excerpt: String
    featuredImage: PublicMedia # URL or a PublicMedia object
    publishedAt: DateTime
    tags: [String!]
    categories: [String!]
    readTime: Int # Estimated read time in minutes
  }

  type PublicMenuItem {
    id: ID!
    title: String!
    url: String # Could be internal path or external URL
    target: String # e.g., '_self', '_blank'
    icon: String # Icon identifier or URL
    children: [PublicMenuItem!] # For nested menus
  }

  type PublicMenu {
    id: ID!
    name: String! # e.g., "Main Navigation", "Footer Links"
    location: String # e.g., "PRIMARY_NAVIGATION", "FOOTER_NAVIGATION"
    items: [PublicMenuItem!]
  }

  type Query {
    page(slug: String!, preview: Boolean): PublicPage
    siteConfig: PublicSiteConfig
    menu(location: String!): PublicMenu
    allPublishedPageSlugs: [String!] # Added new query
    # Future: posts(blogSlug: String!, limit: Int, cursor: String): PostConnection
    # Future: form(slug: String!): PublicForm
  }
`;
