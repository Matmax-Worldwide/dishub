# Permission System Configuration

## Overview
The GraphQL API has been configured with role-based access control where:
- **Public content** (CMS, blogs, media) is accessible without authentication
- **Sensitive data** (users, submissions, forms data) requires authentication and proper roles

## Public Access (No Authentication Required)

### CMS Content
- `getAllCMSSections` - View all CMS sections
- `getPageBySlug` - Get page by slug for website rendering
- `page` - Get page by ID
- `getDefaultPage` - Get default page for locale
- `getAllCMSPages` - List all pages
- `getSectionComponents` - Get components for a section
- `getAllCMSComponents` - List all available components
- `getCMSComponent` - Get specific component
- `getCMSComponentsByType` - Get components by type

### Blog Content
- `blogs` - List all blogs
- `blog` - Get specific blog
- `blogBySlug` - Get blog by slug
- `post` - Get specific post
- `posts` - List posts with filtering
- `postBySlug` - Get post by slug

### Media Content
- `media` - List media files
- `mediaItem` - Get specific media item
- `mediaByType` - Get media by file type
- `mediaInFolder` - Get media in specific folder

### Menu Content
- `menus` - List all menus
- `menu` - Get specific menu
- `menuByName` - Get menu by name
- `menuByLocation` - Get menu by location
- `pages` - List pages for menu items

### Form Definitions
- `forms` - List available forms
- `form` - Get specific form
- `formBySlug` - Get form by slug
- `formSteps` - Get form steps
- `formStep` - Get specific form step
- `formFields` - Get form fields
- `submitForm` - Submit form data (public submission)

### Permission Information
- `allPermissions` - List all available permissions
- `allUsersWithPermissions` - List users with their permissions

## Protected Access (Authentication Required)

### User Management (Admin Only)
- `users` - List all users
- `user` - Get specific user
- `createUser` - Create new user
- `updateUser` - Update user information
- `deleteUser` - Delete user

### Form Submissions (Admin/Manager Only)
- `formSubmissions` - View form submissions
- `formSubmission` - Get specific submission
- `formSubmissionStats` - Get submission statistics
- `updateFormSubmissionStatus` - Update submission status
- `deleteFormSubmission` - Delete submission

### Content Management (Admin/Manager/Employee)
- `saveSectionComponents` - Edit CMS content
- `createPage` - Create new pages
- `updatePage` - Update existing pages
- `deletePage` - Delete pages
- `createBlog` - Create new blogs
- `updateBlog` - Update blogs
- `deleteBlog` - Delete blogs (Admin only)
- `createPost` - Create new posts
- `updatePost` - Update posts
- `deletePost` - Delete posts (Admin/Manager only)

### System Administration (Admin Only)
- `roles` - Manage roles
- `permissions` - Manage permissions
- `createRole` - Create new roles
- `updateRole` - Update roles
- `deleteRole` - Delete roles
- `createPermission` - Create permissions
- `assignPermissionToRole` - Assign permissions
- `removePermissionFromRole` - Remove permissions

## Role Hierarchy

1. **ADMIN** - Full access to all operations
2. **MANAGER** - Content management + user viewing
3. **EMPLOYEE** - Content creation and editing
4. **USER** - Basic authenticated access

## Security Benefits

1. **Website Performance**: Public content loads without authentication overhead
2. **SEO Friendly**: Search engines can index public content
3. **Data Protection**: Sensitive user data and submissions are protected
4. **Granular Control**: Different permission levels for different operations
5. **Audit Trail**: All protected operations require authentication

## Implementation Notes

- CMS queries are public for website rendering
- CMS mutations require authentication for content management
- Form definitions are public but submissions are protected
- Media files are publicly accessible for website display
- User data and analytics require proper authentication 