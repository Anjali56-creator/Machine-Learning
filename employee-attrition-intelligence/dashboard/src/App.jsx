import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { FilterProvider } from "./context/FilterContext";
import Overview from "./pages/Overview";
import AttritionAnalysis from "./pages/AttritionAnalysis";
import EmployeeInsights from "./pages/EmployeeInsights";
import PredictAttrition from "./pages/PredictAttrition";

export default function App() {
  return (
    <FilterProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="attrition-analysis" element={<AttritionAnalysis />} />
          <Route path="employee-insights" element={<EmployeeInsights />} />
          <Route path="predict" element={<PredictAttrition />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FilterProvider>
  );
}
