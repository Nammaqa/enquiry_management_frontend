import { createBrowserRouter } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginGuard from "./components/LoginGuard";
import RootRedirect from "./components/RootRedirect";
import Dashboard from "./pages/Dashboard";
import PackageSubject from "./pages/PackageSubject";
import MainContent from "./components/MainContent";
import LoginPage from "./pages/LoginPage";
import Contact from "./pages/Contact";
import UserRoles from "./pages/UserRoles";
import Enquiry from "./pages/Enquiry";
import CandidateDetails from "./pages/CandidateDetails";
import Batches from "./pages/batches";
import Jobs from "./pages/Jobs";
import StudentPlacementList from "./pages/StudentPlacementList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginGuard>
      <LoginPage />
    </LoginGuard>,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute>
      <MainContent>
        <Dashboard />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/create-enquiry",
    element: <ProtectedRoute>
      <MainContent>
        <Enquiry />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/package-subject",
    element: <ProtectedRoute>
      <MainContent>
        <PackageSubject />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/enquiries",
    element: <ProtectedRoute>
      <MainContent>
        <Contact />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/contact-details/:id",
    element: <ProtectedRoute>
      <MainContent>
        <CandidateDetails />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/user-roles",
    element: <ProtectedRoute>
      <MainContent>
        <UserRoles />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/batches",
    element: <ProtectedRoute>
      <MainContent>
        <Batches />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/jobs",
    element: <ProtectedRoute>
      <MainContent>
        <Jobs />
      </MainContent>
    </ProtectedRoute>,
  },
  {
    path: "/student-placements",
    element: <ProtectedRoute>
      <MainContent>
        <StudentPlacementList />
      </MainContent>
    </ProtectedRoute>,
  },
]);

export default router
//test