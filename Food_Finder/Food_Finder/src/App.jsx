import { Routes, Route, Navigate } from "react-router-dom";

import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import IngredientFinder from "./pages/IngredientFinder";
import MealDetail from "./pages/MealDetail";
import Queue from "./pages/Queue";
import SavedRecipes from "./pages/SavedRecipes";

import "./App.css";

function App() {
  return (
    <div className="app">
      <Navigation />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ingredients" element={<IngredientFinder />} />
          <Route path="/meal/:id" element={<MealDetail />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/saved" element={<SavedRecipes />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

