const API_BASE = "http://localhost:5000";
const token = localStorage.getItem("token");
if (!token) location.href = "login.html";

// 🔎 Search asset
async function searchAsset() {
  const serial = document.getElementById("searchSerial").value.trim();
  if (!serial) return alert("Enter a serial number");

  const res = await fetch(`${API_BASE}/asset/${serial}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const out = await res.json();
  const resultDiv = document.getElementById("searchResult");

  if (out.error || out.msg) {
    resultDiv.innerHTML = `<p style="color:red">${out.error || out.msg}</p>`;
  } else {
    resultDiv.innerHTML = `
      <h3>Asset Details</h3>
      <p><b>Type:</b> ${out.type}</p>
      <p><b>Serial:</b> ${out.serial}</p>
      <p><b>Brand:</b> ${out.brand}</p>
      <p><b>Model:</b> ${out.model}</p>
      <p><b>Location:</b> ${out.location}</p>
      <p><b>Quantity:</b> ${out.quantity}</p>
      <p><b>Status:</b> ${out.status}</p>
    `;
  }
}

// 📋 Fetch all assets
async function fetchAssets() {
  const res = await fetch(`${API_BASE}/asset/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  const tbody = document.querySelector("#assetTable tbody");
  tbody.innerHTML = "";

  data.forEach(asset => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${asset.type}</td>
      <td>${asset.serial}</td>
      <td>${asset.brand}</td>
      <td>${asset.model}</td>
      <td>${asset.location}</td>
      <td>${asset.quantity}</td>
      <td>${asset.status}</td>
      <td class="table-actions">
        ${asset.status === "available" ? `<button onclick="issueAsset('${asset.serial}')">📤 Issue</button>` : ""}
        ${asset.status === "issued" ? `<button onclick="receiveAsset('${asset.serial}')">📥 Receive</button>` : ""}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 📤 Issue asset
async function issueAsset(serial) {
  const qty = prompt("Enter quantity to issue:", "1");
  if (!qty) return;

  const receiver = prompt("Enter receiver email:");
  if (!receiver) return;

  const res = await fetch(`${API_BASE}/asset/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ serial, receiver, quantity: qty })
  });

  const out = await res.json();
  alert(out.msg || out.error);
  fetchAssets();
}

// 📥 Receive asset
async function receiveAsset(serial) {
  const qty = prompt("Enter quantity to receive:", "1");
  if (!qty) return;

  const res = await fetch(`${API_BASE}/asset/receive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ serial, quantity: qty })
  });

  const out = await res.json();
  alert(out.msg || out.error);
  fetchAssets();
}

// 🚪 Logout
function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}

// Auto load
fetchAssets();
