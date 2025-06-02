import { NextRequest } from 'next/server';
import DataLoader from 'dataloader';
import { CMSSection, User as PrismaUser, Page as PrismaPage, PageType as PrismaPageType, Post as PrismaPost } from '@prisma/client'; // Added PrismaPost for EnrichedPost typing
import { RoleName } from '@/config/rolePermissions'; 
// Import EnrichedPost if it's defined in its own file, or define it here.
// Assuming EnrichedPost is defined in postsByBlogIdLoader.ts and exported.
import { EnrichedPost } from './dataloaders/postsByBlogIdLoader'; // Path relative to types.ts

// Defines the user object structure available in the GraphQL context after authentication
export interface AuthenticatedUser {
  id: string;
  role: RoleName; 
  permissions: string[];
  tenants?: Array<{ id: string; role: string; status: string }>;
}

// Defines the structure of DataLoaders available in the context
export interface MyLoaders {
  sectionLoader: DataLoader<string, CMSSection[], string>;
  postsByBlogIdLoader: DataLoader<string, EnrichedPost[], string>; // Added postsByBlogIdLoader
  // Example: userLoader?: DataLoader<string, PrismaUser, string>; 
}

// Definición de los tipos de usuario y sesión
// This User interface is likely for the GraphQL User type, not the context user.
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: RoleGQL; 
  permissions?: string[]; 
  createdAt: Date; 
  updatedAt: Date; 
}

// Contexto para los resolvers de GraphQL
export interface Context {
  req?: NextRequest; 
  user: AuthenticatedUser | null; 
  loaders: MyLoaders; 
  // tenantId?: string | null; 
}

// Tipo para roles (GraphQL type)
export interface RoleGQL { 
  id: string;
  name: string; 
  description?: string;
}

// --- Other existing types below are preserved ---
export interface UserPermission {
  id: string;
  userId: string;
  permissionName: string;
  granted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
} 

export interface MenuItem {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
  order: number;
  children?: MenuItem[];
  parent?: MenuItem;
  menu?: Menu;
  page?: PageBasic;
}

export interface PageBasic {
  id: string;
  title: string;
  slug: string;
}

export interface Menu {
  id: string;
  name: string;
  location: string | null;
  items: MenuItem[];
  headerStyle?: HeaderStyle | null;
  footerStyle?: FooterStyle | null;
}

export interface HeaderStyle {
  id: string;
  menuId: string;
  transparency?: number;
  headerSize?: HeaderSize;
  menuAlignment?: MenuAlignment;
  menuButtonStyle?: MenuButtonStyle;
  mobileMenuStyle?: MobileMenuStyle;
  mobileMenuPosition?: MobileMenuPosition;
  transparentHeader?: boolean;
  borderBottom?: boolean;
  fixedHeader?: boolean;
  advancedOptions?: Record<string, unknown>;
  showButton?: boolean;
  buttonText?: string;
  buttonAction?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  buttonBorderRadius?: number;
  buttonShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  buttonWidth?: string;
  buttonHeight?: string;
  buttonPosition?: 'left' | 'center' | 'right';
  buttonDropdown?: boolean;
  buttonDropdownItems?: Array<{id: string; label: string; url: string}>;
  buttonUrlType?: 'custom' | 'page';
  selectedPageId?: string;
}

export interface FooterStyle {
  id: string;
  menuId: string;
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  advancedOptions?: Record<string, unknown>;
}

export enum HeaderSize { sm = 'sm', md = 'md', lg = 'lg' }
export enum MenuAlignment { left = 'left', center = 'center', right = 'right' }
export enum MenuButtonStyle { default = 'default', filled = 'filled', outline = 'outline' }
export enum MobileMenuStyle { fullscreen = 'fullscreen', dropdown = 'dropdown', sidebar = 'sidebar' }
export enum MobileMenuPosition { left = 'left', right = 'right' }

export interface CMSComponent { // Local definition if different from Prisma's or for GQL type
  id: string;
  type: ComponentType; // Local enum
  data: Record<string, unknown>;
}

// This is a local definition for the GraphQL type CMSSection.
// It references the local SectionComponent type.
// The DataLoader uses Prisma.CMSSection.
export interface CMSSection { // Local GraphQL Type
  id: string;
  sectionId: string;
  name?: string;
  description?: string;
  order?: number;
  lastUpdated: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string | null;
  components: SectionComponent[]; // Uses local SectionComponent
}

export interface SectionComponent { // Local GraphQL Type
  id: string;
  // sectionId: string; // Not needed if this is purely for GQL output nested in CMSSection
  // componentId: string; // Not needed if GQL component is nested
  order: number;
  data?: Record<string, unknown>;
  component?: CMSComponent; // Local CMSComponent
}

export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
}

export enum PageType {
  CONTENT = 'CONTENT', LANDING = 'LANDING', BLOG = 'BLOG', PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY', TAG = 'TAG', HOME = 'HOME', CONTACT = 'CONTACT',
  ABOUT = 'ABOUT', CUSTOM = 'CUSTOM'
}

export enum ScrollType { NORMAL = 'NORMAL', SMOOTH = 'SMOOTH'}

export enum ComponentType {
  HERO = 'HERO', TEXT = 'TEXT', IMAGE = 'IMAGE', GALLERY = 'GALLERY', VIDEO = 'VIDEO', FORM = 'FORM',
  CARDS = 'CARDS', TESTIMONIALS = 'TESTIMONIALS', CTA = 'CTA', FAQ = 'FAQ', FEATURES = 'FEATURES',
  PRICING = 'PRICING', TEAM = 'TEAM', BENEFITS = 'BENEFITS', CONTACT = 'CONTACT', SERVICES = 'SERVICES',
  HEADER = 'HEADER', FOOTER = 'FOOTER', CARD = 'CARD', BENEFIT = 'BENEFIT', FEATURE = 'FEATURE',
  TESTIMONIAL = 'TESTIMONIAL', CUSTOM = 'CUSTOM'
}

export interface PageSEO {
  id: string;
  pageId: string; // This links to the Page's main ID
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
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Page extends Omit<PrismaPage, 'pageType' | 'sections' | 'seo' | 'createdAt' | 'updatedAt'> { 
  pageType: PrismaPageType | string; 
  sections?: CMSSection[]; // Uses local GraphQL CMSSection type
  seo?: PageSEO | null; 
  createdAt: string | Date; 
  updatedAt: string | Date;
}
