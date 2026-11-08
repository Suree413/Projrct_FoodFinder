
import { Link, useLocation } from "react-router-dom";
import {
  pageGraph,
  pagePaths,
  getConnectedPages,
} from "../utils/Graph";

const pageLabels = {
  Home: "ค้นหาเมนู",
  IngredientFinder: "ค้นหาจากวัตถุดิบ",
  MealDetail: "รายละเอียดเมนู",
  Queue: "คิวเมนู",
  SavedRecipes: "เมนูที่บันทึก",
};

function getCurrentPage(pathname) {
  if (pathname.startsWith("/meal/")) {
    return "MealDetail";
  }

  return (
    Object.keys(pagePaths).find(
      (page) => pagePaths[page] === pathname
    ) || "Home"
  );
}

function Navigation() {
  const location = useLocation();
  const currentPage = getCurrentPage(location.pathname);

  // อ่านหน้าที่เชื่อมต่อจาก Graph
  const connectedPages = getConnectedPages(currentPage);

  // แสดงเฉพาะหน้าที่มี URL ใช้งานได้
  const navigationPages = connectedPages.filter(
  (page) =>
    pageGraph[page] &&
    pagePaths[page] &&
    !pagePaths[page].includes(":")
);

  return (
    <nav className="main-navigation">
      <Link to="/" className="nav-brand">
        🍽️ FoodFinder
      </Link>

      <div className="nav-links">
        {navigationPages.map((page) => (
          <Link
            key={page}
            to={pagePaths[page]}
            className={
              currentPage === page ? "nav-link active" : "nav-link"
            }
          >
            {pageLabels[page]}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;
