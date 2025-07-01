# Task Components Test Suite

This directory contains comprehensive tests for the task-related components and their integration with the calendar functionality.

## Test Files

### 1. `TaskList.test.tsx`
Tests for the TaskList component covering:
- ✅ Rendering task list with categories and sections
- ✅ Displaying task items with all properties (title, priority, description, duration)
- ✅ Handling empty task lists
- ✅ Task item data attributes for dragging
- ✅ Priority badge colors and display
- ✅ Sortable functionality (mocked)
- ✅ State management during task moves

### 2. `TaskItem.test.tsx`
Tests for the TaskItem component covering:
- ✅ Rendering tasks with all properties
- ✅ Rendering tasks without optional properties
- ✅ Data attributes for drag-and-drop functionality
- ✅ Priority badge colors for all priority levels
- ✅ Description display logic
- ✅ Duration display logic
- ✅ CSS class structure

### 3. `CalendarPage.test.tsx`
Integration tests for the CalendarPage component covering:
- ✅ Loading states
- ✅ Successful data loading from server
- ✅ Task grouping by category
- ✅ Filtering out completed/cancelled tasks
- ✅ Handling tasks without categories
- ✅ Error handling (network, auth, permission, server errors)
- ✅ Duration formatting from minutes to HH:MM:SS
- ✅ Layout rendering

### 4. `drag-to-calendar.integration.test.tsx`
Integration tests for drag-to-calendar functionality covering:
- ✅ ThirdPartyDraggable initialization
- ✅ Event data extraction from task elements
- ✅ Task element properties for dragging
- ✅ Cleanup on component unmount
- ✅ Error handling during initialization

## Test Coverage

The test suite covers:

### Component Rendering
- All component states (loading, error, success, empty)
- Proper display of task properties
- Visual elements (priority badges, descriptions, durations)
- Layout structure and CSS classes

### Functionality
- Sortable list operations (mocked)
- Cross-category task movement
- Drag-to-calendar integration
- State management and updates

### API Integration
- Server data fetching
- Data transformation and formatting
- Error handling for various scenarios
- Loading states

### Data Flow
- Task data transformation from API to component format
- Duration formatting (minutes → HH:MM:SS)
- Category grouping logic
- Filtering logic (completed/cancelled tasks)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test TaskList.test.tsx
```

## Test Utilities

### Mocks
- `react-sortablejs`: Mocked to simulate drag-and-drop events
- `@fullcalendar/interaction`: Mocked ThirdPartyDraggable for testing
- API calls: Mocked fetchTasks for controlled testing

### Test Data
- Mock tasks with various properties
- Different priority levels
- Tasks with and without optional properties
- API response formats

## Best Practices

1. **Isolation**: Each test is isolated and doesn't depend on other tests
2. **Mocking**: External dependencies are properly mocked
3. **Async Testing**: Proper use of `waitFor` for async operations
4. **Error Scenarios**: Comprehensive error handling tests
5. **Edge Cases**: Tests for empty states, missing data, etc.

## Maintenance

When adding new features:
1. Add corresponding tests for new functionality
2. Update existing tests if component interfaces change
3. Ensure all error scenarios are covered
4. Maintain test data consistency

## Notes

- The sortable functionality is mocked since we can't easily test actual drag-and-drop in a unit test environment
- Integration tests focus on the data flow and component interactions
- Error handling tests cover various network and server error scenarios 