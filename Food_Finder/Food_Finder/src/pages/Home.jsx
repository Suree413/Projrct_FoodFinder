
import { useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [keyword, setKeyword] = useState("");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchMeals = async (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      setError("กรุณาพิมพ์ชื่อเมนูอาหาร");
      return;
    }

    setLoading(true);
    setError("");
    setMeals([]);

    try {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(keyword)}`
      );

      if (!response.ok) {
        throw new Error("ไม่สามารถเชื่อมต่อ API ได้");
      }

      const data = await response.json();

      if (data.meals) {
        setMeals(data.meals);
      } else {
        setError("ไม่พบเมนูอาหารที่ค้นหา");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h1>🍽️ Welcome to FoodFinder</h1>
      <p>ค้นหาเมนูอาหารที่คุณชื่นชอบ</p>

      <form onSubmit={searchMeals}>
        <input
          type="text"
          placeholder="ค้นหาชื่ออาหาร..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "กำลังค้นหา..." : "Search"}
        </button>
      </form>

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
            <p>{meal.strCategory}</p>

            <Link to={`/meal/${meal.idMeal}`}>
              ดูรายละเอียด
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
