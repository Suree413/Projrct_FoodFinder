
import { useState } from "react";
import { Link } from "react-router-dom";

function IngredientFinder() {
  const [ingredients, setIngredients] = useState("");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchByIngredients = async (e) => {
    e.preventDefault();

    const items = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length === 0) {
      setError("กรุณากรอกวัตถุดิบ");
      return;
    }

    setLoading(true);
    setError("");
    setMeals([]);

    try {
      // ค้นหาเมนูจากวัตถุดิบแต่ละรายการ
      const results = await Promise.all(
        items.map(async (ingredient) => {
          const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
          );

          if (!response.ok) {
            throw new Error("ไม่สามารถเชื่อมต่อ API ได้");
          }

          const data = await response.json();
          return data.meals || [];
        })
      );

      // เก็บเฉพาะเมนูที่พบจากวัตถุดิบทุกตัว
      const commonMeals = results[0].filter((meal) =>
        results.every((result) =>
          result.some((item) => item.idMeal === meal.idMeal)
        )
      );

      setMeals(commonMeals);

      if (commonMeals.length === 0) {
        setError("ไม่พบเมนูที่มีวัตถุดิบตรงกันทั้งหมด");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ingredient-page">
      <h1>🥕 Ingredient Finder</h1>
      <p>ค้นหาเมนูอาหารจากวัตถุดิบที่คุณมี</p>

      <form onSubmit={searchByIngredients}>
        <input
          type="text"
          placeholder="เช่น chicken, garlic, onion"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "กำลังค้นหา..." : "ค้นหาเมนู"}
        </button>
      </form>

      <p>สามารถใส่วัตถุดิบหลายชนิดโดยคั่นด้วย ,</p>

      {error && <p>{error}</p>}

      <div className="meal-grid">
        {meals.map((meal) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default IngredientFinder;
