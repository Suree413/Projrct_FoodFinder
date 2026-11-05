
// Graph: เก็บความสัมพันธ์ระหว่างหน้าเว็บด้วย Adjacency List

export const pageGraph = {
  Home: ["IngredientFinder", "SavedRecipes"],
  IngredientFinder: ["Home", "MealDetail"],
  MealDetail: ["Home", "Queue", "SavedRecipes"],
  Queue: ["Home", "MealDetail"],
  SavedRecipes: ["Home", "MealDetail"],
};

// แปลงชื่อหน้าเป็น URL
export const pagePaths = {
  Home: "/",
  IngredientFinder: "/ingredients",
  MealDetail: "/meal/:id",
  Queue: "/queue",
  SavedRecipes: "/saved",
};

// ตรวจสอบว่าหน้าปัจจุบันเชื่อมไปหน้าใดได้บ้าง
export function getConnectedPages(pageName) {
  return pageGraph[pageName] || [];
}
