import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ForgotPassword from './components/ForgotPassword';
import Sidebar from './components/Sidebar';
import EnquiryForm from './pages/EnquiryForm';
import EnquiryList from './pages/EnquiryList';
import DemoList from './pages/DemoList';
import LoginPage from './components/LoginPage';
import DemoList1 from './pages/DemoList1';
import ClassList from './pages/ClassList';
import ClassListPage from './pages/Class_List';
import PlacementList from './pages/PlacementList';
import './App.css';
import AccountsDemoList from './pages/AccountsDemoList';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Layout with Sidebar */}
          <Route
            path="/*"
            element={
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Routes>
                    <Route path="/enquiry-form" element={<EnquiryForm />} />
                    <Route path="/enquiry-list" element={<EnquiryList />} />
                    <Route path="/demo-list" element={<DemoList />} />
                    <Route path="/demo-list-1" element={<DemoList1 />} />
                    <Route path="/class-list" element={<ClassList />} />
                    <Route path="/class_list" element={<ClassListPage />} /> {/* Fixed PascalCase */}
                    <Route path="/placement-list" element={<PlacementList />} />
                    <Route path="/interview-list" element={<ClassList />} />
                    <Route path="/accounts-demo-list" element={<AccountsDemoList />} />
                    
                    {/* Redirect unknown routes */}
                    <Route path="*" element={<Navigate to="enquiry-form" replace />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;