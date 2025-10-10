const API_BASE = "http://localhost:5000/api"; // updated base URL
const token = localStorage.getItem("token");
if (!token) location.href = "login.html";

// 📋 Fetch issued logs
async function fetchIssued() {
  try {
    const res = await fetch(`${API_BASE}/logs/issued`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch issued logs: ${res.status}`);
    const data = await res.json();

    const tbody = document.querySelector("#issuedTable tbody");
    tbody.innerHTML = "";

    data.forEach(log => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${log.serial || "-"}</td>
        <td>${log.type || "-"}</td>
        <td>${log.receiver || "-"}</td>
        <td>${log.quantity || "-"}</td>
        <td>${log.issuer || "-"}</td>
        <td>${log.issuedAt ? new Date(log.issuedAt).toLocaleString() : "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("❌ Error fetching issued logs:", err);
  }
}

// 📋 Fetch received logs
async function fetchReceived() {
  try {
    const res = await fetch(`${API_BASE}/logs/received`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch received logs: ${res.status}`);
    const data = await res.json();

    const tbody = document.querySelector("#receivedTable tbody");
    tbody.innerHTML = "";

    data.forEach(log => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${log.serial || "-"}</td>
        <td>${log.type || "-"}</td>
        <td>${log.receiver || "-"}</td>
        <td>${log.quantity || "-"}</td>
        <td>${log.receivedAt ? new Date(log.receivedAt).toLocaleString() : "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("❌ Error fetching received logs:", err);
  }
}

// 🚪 Logout
function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}

// Auto load
fetchIssued();
fetchReceived();
