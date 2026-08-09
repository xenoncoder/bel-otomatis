import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SchedulesPage from "./pages/SchedulesPage";
import SettingsPage from "./pages/SettingsPage";
import LogsPage from "./pages/LogsPage";
import FileManagerPage from "./pages/FileManagerPage";
import DatabasePage from "./pages/DatabasePage";
import DocumentationPage from "./pages/DocumentationPage";
import { routes } from "./lib/route-encoder";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={routes.dashboard} element={<DashboardPage />} />
        <Route path={routes.schedules} element={<SchedulesPage />} />
        <Route path={routes.files} element={<FileManagerPage />} />
        <Route path={routes.settings} element={<SettingsPage />} />
        <Route path={routes.logs} element={<LogsPage />} />
        <Route path={routes.database} element={<DatabasePage />} />
        <Route path={routes.docs} element={<DocumentationPage />} />
      </Route>
    </Routes>
  );
}
