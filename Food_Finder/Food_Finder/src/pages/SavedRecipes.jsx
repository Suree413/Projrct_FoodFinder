import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function SavedRecipes() {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const recipes = JSON.parse(
      localStorage.getItem("foodfinder_saved") || "[]"
    );

    setSaved(recipes);
  }, []);

  const removeRecipe = (id) => {
    const updated = saved.filter(
      (meal) => meal.idMeal !== id
    );

    setSaved(updated);

    localStorage.setItem(
      "foodfinder_saved",
      JSON.stringify(updated)
    );
  };

  return (
    <div className="saved-page">
      <h1>❤️ Saved Recipes</h1>
      <p>เมนูอาหารที่คุณบันทึกไว้</p>

      {saved.length === 0 ? (
        <p>ยังไม่มีเมนูที่บันทึกไว้</p>
      ) : (
        <div className="meal-grid">
          {saved.map((meal) => (
            <div className="meal-card" key={meal.idMeal}>
              <img
                src={meal.strMealThumb}
                alt={meal.strMeal}
                width="200"
              />

              <h3>{meal.strMeal}</h3>

              <Link to={`/meal/${meal.idMeal}`}>
                ดูรายละเอียด
              </Link>

              <button
                onClick={() => removeRecipe(meal.idMeal)}
              >
                นำออกจากรายการโปรด
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedRecipes;
