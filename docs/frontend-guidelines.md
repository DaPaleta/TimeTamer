# Frontend Development Guidelines

## Technology Stack

### Core Technologies
- **React 18+** - Modern UI development with functional components and hooks
- **TypeScript** - Type-safe development and better IDE support
- **Vite** - Fast, modern build tool with instant HMR
- **Material-UI (MUI) v5** - Component library following Material Design principles

### Key Dependencies
```json
{
  "dependencies": {
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@mui/x-date-pickers": "^6.10.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "react-router-dom": "^6.20.0",
    "date-fns": "^2.30.0",
    "zustand": "^4.4.0",
    "zod": "^3.22.0"
  }
}
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── layout/       # Layout components
│   │   ├── tasks/        # Task-related components
│   │   ├── calendar/     # Calendar components
│   │   ├── analytics/    # Analytics components
│   │   └── common/       # Shared components
│   ├── pages/           # Page components
│   │   ├── tasks/       # Task pages
│   │   ├── calendar/    # Calendar pages
│   │   └── analytics/   # Analytics pages
│   ├── styles/          # Global styles and theme
│   ├── state/          # State management
│   ├── api/            # API integration
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── tests/              # Test files
└── public/            # Static assets
```

## Design System

### Theme Configuration
We use a custom Material-UI theme (`src/styles/theme.ts`) that defines:
- Color palette with semantic meanings
- Typography scale
- Component style overrides
- Spacing and layout constants

```typescript
// Example of our color palette
palette: {
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  secondary: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  }
}
```

### Component Guidelines

1. **Component Structure**
   ```typescript
   // Example component structure
   import React from 'react';
   import { ComponentProps } from './types';
   
   export const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
     // Component logic
     return (
       // JSX
     );
   };
   ```

2. **Props Interface**
   - Always define prop types using TypeScript interfaces
   - Document complex props with JSDoc comments
   - Use strict prop typing

3. **Styling**
   - Use MUI's `sx` prop for component-specific styling
   - Create styled components for reusable styles
   - Follow the theme's spacing and color system

## Layout System

### MainLayout Component
The `MainLayout` component (`src/components/layout/MainLayout.tsx`) provides:
- Responsive navigation drawer
- App bar with mobile menu
- Content area with proper spacing
- Route outlet for nested routes

```typescript
// Example usage
<MainLayout>
  <YourPageComponent />
</MainLayout>
```

### Grid System
Use MUI's Grid component for layouts:
- `container` for grid containers
- `item` for grid items
- Responsive breakpoints: xs, sm, md, lg, xl

```typescript
<Grid container spacing={2}>
  <Grid item xs={12} md={6} lg={4}>
    {/* Content */}
  </Grid>
</Grid>
```

## Component Examples

### TaskCard Component
The TaskCard component demonstrates best practices for:
- Prop typing with TypeScript
- Responsive design
- Theme integration
- Conditional rendering
- Event handling

```typescript
interface TaskCardProps {
  task: {
    id: string;
    title: string;
    // ... other task properties
  };
  onEdit?: (id: string) => void;
}
```

### TaskListPage Component
Shows implementation of:
- Data fetching (mock data for now)
- Filtering and sorting
- Grid layout
- Search functionality
- Empty state handling

## State Management

### Local State
- Use React's `useState` for component-local state
- Use `useReducer` for complex state logic

### Global State (To be implemented)
We will use Zustand for global state management:
- Task state
- User preferences
- Application settings
- Cache management

## Adding New Features

1. **Create New Component**
   ```bash
   frontend/src/components/[feature]/ComponentName.tsx
   frontend/src/components/[feature]/ComponentName.test.tsx
   ```

2. **Add Types**
   ```typescript
   // frontend/src/types/[feature].ts
   export interface NewFeatureProps {
     // Props definition
   }
   ```

3. **Add to Page**
   ```typescript
   // frontend/src/pages/[feature]/FeaturePage.tsx
   import { NewComponent } from '../../components/[feature]/NewComponent';
   ```

## Testing Guidelines

### Unit Tests
- Test component rendering
- Test user interactions
- Test error states
- Test responsive behavior

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('component renders correctly', () => {
  render(<YourComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Integration Tests
- Test component interactions
- Test data flow
- Test routing

## Performance Guidelines

1. **Component Optimization**
   - Use React.memo for expensive renders
   - Implement proper dependency arrays in hooks
   - Lazy load routes and large components

2. **Bundle Size**
   - Import only needed MUI components
   - Use tree-shaking friendly imports
   - Monitor bundle size with build analytics

3. **Rendering**
   - Avoid unnecessary re-renders
   - Use pagination for long lists
   - Implement virtual scrolling for large datasets

## Accessibility Guidelines

1. **ARIA Labels**
   - Add aria-labels to interactive elements
   - Use semantic HTML elements
   - Ensure proper heading hierarchy

2. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Implement focus management
   - Provide skip links for navigation

3. **Color Contrast**
   - Follow WCAG 2.1 guidelines
   - Use theme colors with proper contrast
   - Test with accessibility tools

## Error Handling

1. **API Errors**
   - Display user-friendly error messages
   - Implement retry mechanisms
   - Log errors for debugging

2. **Form Validation**
   - Provide immediate feedback
   - Show clear error messages
   - Handle all error states

## Future Improvements

1. **State Management**
   - Implement Zustand store
   - Add proper API integration
   - Implement caching strategy

2. **Features**
   - Task creation/editing modal
   - Calendar integration
   - Analytics dashboard
   - User settings

3. **Performance**
   - Implement code splitting
   - Add service worker
   - Optimize images and assets

## Contributing

1. Follow the established folder structure
2. Use TypeScript strictly (no any types)
3. Write tests for new components
4. Document complex logic
5. Follow the component guidelines
6. Use the theme system consistently
7. Ensure responsive design
8. Maintain accessibility standards

## Resources

- [Material-UI Documentation](https://mui.com/material-ui/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Router Documentation](https://reactrouter.com/) 