
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function MealDetail() {
  const { id } = useParams();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMeal = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        );

        if (!response.ok) {
          throw new Error("ไม่สามารถเชื่อมต่อ API ได้");
        }

        const data = await response.json();

        if (data.meals && data.meals.length > 0) {
          setMeal(data.meals[0]);
        } else {
          setError("ไม่พบข้อมูลเมนูอาหาร");
        }
      } catch (err) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [id]);

  // ดึงรายการวัตถุดิบและปริมาณ
  const getIngredients = () => {
    if (!meal) return [];

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient,
          measure: measure || "",
        });
      }
    }

    return ingredients;
  };

  // เพิ่มเมนูเข้า Queue
  const addToQueue = () => {
    const queue = JSON.parse(
      localStorage.getItem("foodfinder_queue") || "[]"
    );

    const exists = queue.some(
      (item) => item.idMeal === meal.idMeal
    );

    if (exists) {
      alert("เมนูนี้อยู่ใน Queue แล้ว");
      return;
    }

    queue.push(meal);

    localStorage.setItem(
      "foodfinder_queue",
      JSON.stringify(queue)
    );

    alert("เพิ่มเมนูเข้า Queue แล้ว!");
  };

  // บันทึกเมนูโปรด
  const saveRecipe = () => {
    const saved = JSON.parse(
      localStorage.getItem("foodfinder_saved") || "[]"
    );

    const exists = saved.some(
      (item) => item.idMeal === meal.idMeal
    );

    if (exists) {
      alert("เมนูนี้ถูกบันทึกไว้แล้ว");
      return;
    }

    saved.push(meal);

    localStorage.setItem(
      "foodfinder_saved",
      JSON.stringify(saved)
    );

    alert("บันทึกเมนูโปรดเรียบร้อย!");
  };

  if (loading) {
    return <h2>กำลังโหลดรายละเอียดอาหาร...</h2>;
  }

  if (error) {
    return (
      <div>
        <h2>{error}</h2>
        <Link to="/">กลับหน้าหลัก</Link>
      </div>
    );
  }

  if (!meal) return null;

  return (
    <div className="meal-detail">
      <Link to="/">← กลับหน้าหลัก</Link>

      <h1>{meal.strMeal}</h1>

      <img
        src={meal.strMealThumb}
        alt={meal.strMeal}
        width="350"
      />

      <p>
        <strong>Category:</strong> {meal.strCategory}
      </p>

      <p>
        <strong>Area:</strong> {meal.strArea}
      </p>

      <div className="detail-buttons">
        <button onClick={addToQueue}>
          ➕ เพิ่มเข้า Queue
        </button>

        <button onClick={saveRecipe}>
          ❤️ บันทึกเมนูโปรด
        </button>
      </div>

      <h2>🥕 Ingredients</h2>

      <ul>
        {getIngredients().map((item, index) => (
          <li key={index}>
            {item.name} - {item.measure}
          </li>
        ))}
      </ul>

      <h2>👩‍🍳 Instructions</h2>

      <p style={{ whiteSpace: "pre-line" }}>
        {meal.strInstructions}
      </p>

      {meal.strYoutube && (
        <a
          href={meal.strYoutube}
          target="_blank"
          rel="noreferrer"
        >
          ▶ Watch Cooking Video
        </a>
      )}
    </div>
  );
}

export default MealDetail;
