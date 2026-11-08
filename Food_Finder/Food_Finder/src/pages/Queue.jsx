import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Queue() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const savedQueue = JSON.parse(
      localStorage.getItem("foodfinder_queue") || "[]"
    );

    setQueue(savedQueue);
  }, []);

  const removeFromQueue = (id) => {
    const updatedQueue = queue.filter(
      (meal) => meal.idMeal !== id
    );

    setQueue(updatedQueue);

    localStorage.setItem(
      "foodfinder_queue",
      JSON.stringify(updatedQueue)
    );
  };

  const clearQueue = () => {
    setQueue([]);
    localStorage.removeItem("foodfinder_queue");
  };

  return (
    <div className="queue-page">
      <h1>📋 My Food Queue</h1>
      <p>รายการเมนูอาหารที่คุณต้องการดูถัดไป</p>

      {queue.length === 0 ? (
        <p>ยังไม่มีเมนูใน Queue</p>
      ) : (
        <>
          <button onClick={clearQueue}>
            ล้าง Queue ทั้งหมด
          </button>

          <div className="meal-grid">
            {queue.map((meal, index) => (
              <div className="meal-card" key={meal.idMeal}>
                <h3>ลำดับที่ {index + 1}</h3>

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
                  onClick={() => removeFromQueue(meal.idMeal)}
                >
                  นำออกจาก Queue
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Queue;
