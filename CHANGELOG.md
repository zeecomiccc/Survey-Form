# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-XX

### Added

#### User Interface Enhancements
- **Toast Notifications**: Replaced all `alert()` calls with modern, accessible toast notifications
- **Modal Dialogs**: Replaced all `confirm()` dialogs with customizable modal components
- **Toast Context**: Global toast notification system using React Context API
- **View Mode Toggle**: Switch between Card View and Table View on the surveys page
- **View Preference Saving**: View mode preference automatically saved to localStorage
- **Mobile Hamburger Menu**: Responsive mobile navigation with hamburger menu icon

#### Survey Management
- **Search Functionality**: Search surveys by title or description
- **Filter & Sort**: Sort surveys by date, title, or response count (ascending/descending)
- **Survey Templates**: 5 pre-built survey templates:
  - Customer Feedback
  - Net Promoter Score (NPS)
  - Event Feedback
  - Product Satisfaction
  - Employee Satisfaction
- **Soft Delete**: Surveys are now soft-deleted (marked as deleted but preserved in database)
- **Template Selector**: Easy template selection interface in survey builder

#### Analytics & Reporting
- **Chart Customization**: 
  - Multiple chart types: Pie, Doughnut, Column, Bar, Area, Line, Gauge
  - 8 color palette options (default, vibrant, pastel, dark, ocean, sunset, forest, rainbow)
  - 3D effect toggle for enhanced visual appeal
- **Real-time Polling**: Auto-update analytics with configurable polling (5-second intervals)
- **Polling Toggle**: Enable/disable real-time updates with visual indicator
- **PDF Export**: Export analytics reports with charts as PDF documents
- **Enhanced Excel Export**: 
  - Statistics sheet with calculated percentages
  - Summary sheet with response rates
  - Better formatting and structure

#### Components
- **Modal Component**: Reusable modal dialog component with customizable options
- **Toast Component**: Toast notification component with 4 types (success, error, info, warning)
- **MobileHeader Component**: Responsive header component with mobile menu support
- **CompanyLogo Component**: Logo component with size variants (default, large, xl)

#### Developer Experience
- **Custom Hooks**: 
  - `useModal`: Hook for managing modal state
  - `useToast`: Hook for managing toast notifications
- **Better Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Improved loading indicators throughout the application

### Changed

- **Database Connection Pool**: Optimized MySQL connection pool configuration
  - Increased connection limit to 50
  - Added maxIdle and idleTimeout for better connection management
  - Enabled keepAlive for stable connections
- **Excel Export**: Enhanced to include statistics and summary sheets with calculated data
- **Survey Page Loading**: Fixed loading state to show spinner instead of "Not Found" message
- **Header Logo Size**: Increased header logo size by 35% (from h-10 to h-14)
- **Login Page Logo**: Customizable logo size on login page

### Fixed

- **Loading State**: Fixed survey page showing "Not Found" before data loads
- **Database Connections**: Fixed "Too many connections" error with optimized pool
- **Mobile Responsiveness**: Improved mobile menu and header visibility
- **Type Errors**: Fixed TypeScript type errors in various components
- **Event Handlers**: Removed unsupported event handlers from database pool

### Technical Details

#### New Dependencies
- `jspdf`: PDF generation library
- `html2canvas`: HTML to canvas conversion for chart export
- `@types/jspdf`: TypeScript types for jsPDF

#### New Files
- `components/Modal.tsx`: Modal dialog component
- `components/Toast.tsx`: Toast notification component
- `contexts/ToastContext.tsx`: Toast notification context provider
- `hooks/useModal.ts`: Modal state management hook
- `hooks/useToast.ts`: Toast state management hook
- `lib/surveyTemplates.ts`: Survey template definitions
- `app/demo/page.tsx`: Table view demo page
- `scripts/migrate-add-soft-delete.js`: Migration script for soft delete

#### Database Changes
- Added `deleted_at` column to `surveys` table
- Added index on `deleted_at` column for better query performance

#### Migration Required
Run the following migration to add soft delete support:
```bash
npm run migrate-soft-delete
```

## [1.0.0] - Initial Release

### Added
- Survey creation and management
- Multiple question types (text, multiple-choice, single-choice, rating, yes/no, date)
- User authentication and authorization
- Admin and user roles
- Survey distribution with unique expiring links
- One submission per link enforcement
- Analytics dashboard with visual charts
- Excel export functionality
- Email notifications for new responses
- Responsive design for mobile and desktop
- Drag & drop question reordering
- Progress tracking for survey completion

