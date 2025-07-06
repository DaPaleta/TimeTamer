import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from './styles/theme';
import { MainLayout } from './components/layout/MainLayout';
import { TaskListPage } from './pages/tasks/TaskListPage';
import CalendarPage from './pages/calendar/CalendarPage';
import CategoryManagerPage from './pages/settings/CategoryManagerPage';
import DayContextSettingsPage from './pages/settings/DayContextSettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CalendarProvider } from './context/CalendarContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Placeholder components for other routes
const AnalyticsPage = () => <div>Analytics Page (Coming Soon)</div>;

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <CalendarProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/tasks" replace />} />
                    <Route path="tasks" element={<TaskListPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<CategoryManagerPage />} />
                    <Route path="day-context-settings" element={<DayContextSettingsPage />} />
                    <Route path="planner" element={<div>Planner Page (protected)</div>} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/calendar" replace />} />
              </Routes>
            </CalendarProvider>
          </AuthProvider>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
