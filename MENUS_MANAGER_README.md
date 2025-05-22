# 🧭 Advanced Menus Manager

A comprehensive navigation menu management system for the CMS with modern UX/UI design and advanced features.

## ✨ Features

### 🎨 Modern UI/UX Design
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Clean Interface**: Following shadcn/ui design patterns with TailwindCSS
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Real-time Feedback**: Loading states, success/error messages, and visual confirmations

### 🌍 Locale Support
- **Current Locale**: Uses the current CMS locale for menu management
- **Locale-Specific Menus**: Menus are created for the active locale

### 🔧 Menu Management
- **Create New Menus**: Simple form with name, slug, location, and visibility settings
- **Edit Existing Menus**: Inline editing with real-time updates
- **Duplicate Menus**: Clone existing menus for quick setup
- **Delete Menus**: Safe deletion with confirmation dialogs
- **Menu Locations**: Support for Header, Footer, Sidebar, and Mobile navigation

### 📋 Menu Items Management
- **Add Menu Items**: Support for both custom URLs and internal pages
- **Drag & Drop Reordering**: Visual reordering with react-beautiful-dnd
- **Nested Structure**: Parent-child relationships for dropdown menus
- **Rich Configuration**:
  - Title and optional icon
  - URL or internal page selection
  - Target settings (_blank/_self)
  - Role-based visibility
  - Show/hide toggle

### 🔐 Role-Based Access Control
- **Visibility Settings**: Control which user roles can see each menu item
- **Role Types**: Administrator, User, Guest
- **Visual Indicators**: Color-coded badges for role assignments

### 🎯 Advanced Features
- **Search & Filter**: Find menus by name, description, or location
- **Import/Export**: JSON-based menu structure import/export
- **Undo/Redo**: History management for menu changes
- **Auto-save**: Automatic saving of changes
- **Preview Mode**: Visual tree view of menu structure

### 📊 Menu Analytics
- **Item Count**: Display number of items per menu
- **Last Modified**: Track when menus were last updated
- **Status Indicators**: Public/private visibility status

## 🏗️ Technical Architecture

### Components Structure
```
src/app/[locale]/cms/menus/page.tsx
├── MenusManagerPage (Main Component)
├── MenuEditor (Menu editing interface)
├── MenuCreator (New menu creation form)
└── MenuItemForm (Menu item configuration modal)
```

### Key Technologies
- **Next.js 15**: App Router with server/client components
- **React 18**: Modern React with hooks and context
- **TypeScript**: Full type safety throughout
- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Consistent component library
- **react-beautiful-dnd**: Drag and drop functionality
- **GraphQL**: Data fetching and mutations

### State Management
- **Local State**: React useState for component-specific data
- **Form State**: Controlled components with TypeScript interfaces
- **History Management**: Undo/redo functionality with state snapshots
- **Error Handling**: Comprehensive error states and user feedback

## 🚀 Usage Guide

### Creating a New Menu
1. Click "New Menu" button in the header
2. Fill in menu details:
   - **Name**: Display name for the menu
   - **Slug**: URL-friendly identifier (auto-generated if empty)
   - **Location**: Where the menu will appear
   - **Visibility**: Public or private access
   - **Description**: Optional description
3. Click "Create Menu" to save

### Adding Menu Items
1. Select a menu from the list
2. Click "Add Item" in the menu editor
3. Configure the item:
   - **Title**: Display text for the menu item
   - **Link Type**: Choose between custom URL or internal page
   - **Target**: Open in same window or new tab
   - **Icon**: Optional emoji or icon name
   - **Roles**: Select which user roles can see this item
   - **Parent**: Choose parent item for nested structure
4. Click "Save Item"

### Reordering Menu Items
1. In the menu editor, grab the drag handle (⋮⋮) next to any item
2. Drag the item to its new position
3. Drop to reorder - changes are saved automatically
4. Nested items can be reordered within their parent or moved to different parents

### Managing Locales
1. Menus are automatically created for the current CMS locale
2. Each locale maintains its own set of menus
3. Menu structure is specific to the active locale

### Import/Export Functionality
- **Export**: Click the download icon next to any menu to export as JSON
- **Import**: Use the "Import" button to upload a JSON menu file
- **Format**: Standard JSON structure with menu and item properties

## 🔧 Configuration

### Menu Locations
The system supports four predefined locations:
- `HEADER`: Main site navigation
- `FOOTER`: Footer links
- `SIDEBAR`: Side navigation panels
- `MOBILE`: Mobile-specific navigation

### Role Configuration
Default roles available:
- `admin`: Full access (red badge)
- `user`: Registered users (blue badge)
- `guest`: Anonymous visitors (gray badge)

### Locale Support
Menus are created for the current CMS locale automatically. The system supports any locale configured in the CMS.

## 🎨 Design Patterns

### Layout Structure
- **Header**: Title, actions, and language tabs
- **Sidebar**: Menu list with search and filters
- **Main Content**: Menu editor or creation form
- **Modals**: Item configuration and confirmations

### Color Scheme
- **Primary**: Blue tones for actions and highlights
- **Success**: Green for confirmations and success states
- **Warning**: Yellow for cautions and pending states
- **Error**: Red for errors and destructive actions
- **Neutral**: Gray tones for secondary content

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, consistent sizing
- **Labels**: Clear, descriptive form labels
- **Badges**: Color-coded status indicators

## 🔄 Data Flow

### Menu Operations
1. **Fetch**: Load menus and pages from GraphQL API
2. **Create**: POST new menu with validation
3. **Update**: PATCH existing menu with changes
4. **Delete**: DELETE with confirmation
5. **Reorder**: Update item order via drag & drop

### State Synchronization
- **Local State**: Immediate UI updates
- **Server State**: Persistent data storage
- **History State**: Undo/redo functionality
- **Form State**: Controlled input management

## 🛠️ Development

### Adding New Features
1. Update TypeScript interfaces in the main file
2. Add new UI components following shadcn/ui patterns
3. Implement GraphQL mutations for data persistence
4. Add proper error handling and loading states
5. Update this documentation

### Testing Considerations
- **Unit Tests**: Component rendering and state management
- **Integration Tests**: GraphQL operations and data flow
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: Screen reader and keyboard navigation

## 📝 Future Enhancements

### Planned Features
- **Menu Templates**: Pre-built menu structures
- **Advanced Permissions**: Granular role-based access
- **Menu Analytics**: Usage tracking and insights
- **Bulk Operations**: Multi-select actions
- **Menu Versioning**: Change history and rollback
- **Custom Fields**: Additional metadata for menu items
- **Menu Scheduling**: Time-based menu visibility

### Performance Optimizations
- **Virtual Scrolling**: For large menu lists
- **Lazy Loading**: On-demand component loading
- **Caching**: Optimized data fetching
- **Debounced Search**: Improved search performance

---

## 🤝 Contributing

When contributing to the Menus Manager:
1. Follow the existing TypeScript patterns
2. Maintain consistency with shadcn/ui components
3. Add proper error handling for all operations
4. Update documentation for new features
5. Test across different locales and screen sizes

## 📄 License

This Menus Manager is part of the CMS system and follows the same licensing terms as the main project. 