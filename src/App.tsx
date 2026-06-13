import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import TaskList from "@/pages/TaskList";
import NewTask from "@/pages/NewTask";
import TaskDetail from "@/pages/TaskDetail";
import ReportPreview from "@/pages/ReportPreview";
import Reports from "@/pages/Reports";
import AlertReview from "@/pages/AlertReview";
import Recommendations from "@/pages/Recommendations";
import Approvals from "@/pages/Approvals";
import Dashboard from "@/pages/Dashboard";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TaskList />} />
          <Route path="/tasks/new" element={<NewTask />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/alerts" element={<AlertReview />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportPreview />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
