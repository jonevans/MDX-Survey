import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssessmentForm from './components/AssessmentForm';
import Results from './pages/Results';
import AdminDashboard from './pages/AdminDashboard';
import AdminCompanies from './pages/AdminCompanies';
import AdminResponses from './pages/AdminResponses';
import AdminResponseDetail from './pages/AdminResponseDetail';
import AdminCompanySurveys from './pages/AdminCompanySurveys';
import AdminSurveyDetail from './pages/AdminSurveyDetail';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  useEffect(() => {
    document.title = 'Impact - DX Maturity';
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/assessment/new" element={
            <ProtectedRoute>
              <AssessmentForm />
            </ProtectedRoute>
          } />
          
          <Route path="/results/:responseId" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/admin/companies" element={
            <AdminRoute>
              <AdminCompanies />
            </AdminRoute>
          } />
          
          <Route path="/admin/companies/:name" element={
            <AdminRoute>
              <AdminCompanies />
            </AdminRoute>
          } />
          
          <Route path="/admin/responses" element={
            <AdminRoute>
              <AdminResponses />
            </AdminRoute>
          } />
          
          <Route path="/admin/responses/:id" element={
            <AdminRoute>
              <AdminResponseDetail />
            </AdminRoute>
          } />
          
          <Route path="/admin/surveys" element={
            <AdminRoute>
              <AdminCompanySurveys />
            </AdminRoute>
          } />
          
          <Route path="/admin/surveys/:id" element={
            <AdminRoute>
              <AdminSurveyDetail />
            </AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
