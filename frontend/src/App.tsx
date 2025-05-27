import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from './styles/theme';
import { MainLayout } from './components/layout/MainLayout';
import { TaskListPage } from './pages/tasks/TaskListPage';

// Placeholder components for other routes
const CalendarPage = () => <div>Calendar Page (Coming Soon)</div>;
const AnalyticsPage = () => <div>Analytics Page (Coming Soon)</div>;
const SettingsPage = () => <div>Settings Page (Coming Soon)</div>;

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/tasks" replace />} />
              <Route path="tasks" element={<TaskListPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/tasks" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
};
