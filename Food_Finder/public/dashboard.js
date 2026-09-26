// ================================================================
// โหลดและแสดงเมนู
// ================================================================

async function loadDashboard() {

  const algo =
    document.getElementById('algo').value;

  const errorBox =
    document.getElementById('error');


  try {

    const res =
      await fetch(
        `/meals?sort=${algo}`
      );


    const result =
      await res.json();


    if (!res.ok) {

      throw new Error(
        result.error ||
        'โหลดข้อมูลไม่สำเร็จ'
      );

    }


    // แสดงข้อมูล Sort

    document.getElementById(
      'sortInfo'
    ).textContent =
      `${result.count} เมนู · ${result.ms} ms`;


    const container =
      document.getElementById('meals');


    // ถ้าไม่มีข้อมูล

    if (
      result.data.length === 0
    ) {

      container.innerHTML =
        '<div class="card">ไม่พบข้อมูลเมนู</div>';

      return;

    }


    // แสดงเมนู

    container.innerHTML =
      result.data.map(meal => `

        <div class="card">

          <img
            src="${meal.image}"
            alt="${escapeHtml(meal.name)}"
          >


          <div class="info">

            <strong>
              ${escapeHtml(meal.name)}
            </strong>


            <div class="meta">

              ${escapeHtml(
                meal.category ||
                'ไม่ระบุหมวดหมู่'
              )}

              ·

              ${escapeHtml(
                meal.area ||
                'ไม่ระบุประเทศ'
              )}

            </div>

          </div>


          <button
            onclick="addToQueue(${meal.id})"
          >

            เพิ่มเข้าคิว

          </button>

        </div>

      `).join('');


    errorBox.style.display =
      'none';


  } catch (err) {

    showError(
      err.message
    );

  }

}


// ================================================================
// เพิ่มเมนูเข้าคิว
// ================================================================

async function addToQueue(id) {

  try {

    const res =
      await fetch(
        '/watchlist',
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              id: id
            })

        }
      );


    const result =
      await res.json();


    if (!res.ok) {

      throw new Error(
        result.error ||
        'เพิ่มเข้าคิวไม่สำเร็จ'
      );

    }


    await refreshQueueAndHistory();


  } catch (err) {

    showError(
      err.message
    );

  }

}


// ================================================================
// เลือกเมนูจาก Queue
// ================================================================

async function processQueue() {

  try {

    const res =
      await fetch(
        '/watchlist/process',
        {
          method: 'DELETE'
        }
      );


    const result =
      await res.json();


    if (!res.ok) {

      throw new Error(
        result.error ||
        'ประมวลผลคิวไม่สำเร็จ'
      );

    }


    await refreshQueueAndHistory();


  } catch (err) {

    showError(
      err.message
    );

  }

}


// ================================================================
// Undo
// ================================================================

async function undo() {

  try {

    const res =
      await fetch(
        '/undo',
        {
          method: 'POST'
        }
      );


    const result =
      await res.json();


    if (!res.ok) {

      throw new Error(
        result.error ||
        'Undo ไม่สำเร็จ'
      );

    }


    await refreshQueueAndHistory();


  } catch (err) {

    showError(
      err.message
    );

  }

}


// ================================================================
// โหลด Queue และ History
// ================================================================

async function refreshQueueAndHistory() {

  try {

    const [
      queueRes,
      historyRes
    ] = await Promise.all([

      fetch('/watchlist'),

      fetch('/history')

    ]);


    const queue =
      await queueRes.json();


    const history =
      await historyRes.json();


    // จำนวน Queue

    document.getElementById(
      'queueSize'
    ).textContent =
      queue.size;


    const watchlist =
      document.getElementById(
        'watchlist'
      );


    // ถ้า Queue ว่าง

    if (
      queue.items.length === 0
    ) {

      watchlist.innerHTML =
        '<li class="empty">ยังไม่มีเมนูในคิว</li>';

    }


    // แสดง Queue

    else {

      watchlist.innerHTML =
        queue.items.map(
          (meal, index) => `

          <li>

            ${index + 1}.
            ${escapeHtml(
              meal.name
            )}

            <span>

              ${escapeHtml(
                meal.category || ''
              )}

            </span>

          </li>

        `
        ).join('');

    }


    // ============================================================
    // History
    // ============================================================

    const historyBox =
      document.getElementById(
        'history'
      );


    if (
      history.history.length === 0
    ) {

      historyBox.innerHTML =
        '<li class="empty">ยังไม่มีประวัติ</li>';

    }


    else {

      historyBox.innerHTML =
        history.history.map(
          item => `

          <li>

            ${item.action}:
            ${escapeHtml(
              item.meal.name
            )}

            <span>

              ${escapeHtml(
                item.time
              )}

            </span>

          </li>

        `
        ).join('');

    }


  } catch (err) {

    showError(
      err.message
    );

  }

}


// ================================================================
// แสดง Error
// ================================================================

function showError(message) {

  const errorBox =
    document.getElementById(
      'error'
    );


  errorBox.textContent =
    'เกิดข้อผิดพลาด: ' +
    message;


  errorBox.style.display =
    'block';

}


// ================================================================
// ป้องกัน HTML Injection
// ================================================================

function escapeHtml(value) {

  return String(
    value ?? ''
  )

    .replaceAll(
      '&',
      '&amp;'
    )

    .replaceAll(
      '<',
      '&lt;'
    )

    .replaceAll(
      '>',
      '&gt;'
    )

    .replaceAll(
      '"',
      '&quot;'
    )

    .replaceAll(
      "'",
      '&#039;'
    );

}


// ================================================================
// เริ่มต้นระบบ
// ================================================================

loadDashboard();

refreshQueueAndHistory();