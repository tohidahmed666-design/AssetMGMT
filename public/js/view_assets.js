const API_BASE = "http://localhost:5000/api/asset";
const token = localStorage.getItem("token");
if (!token) location.href = "login.html";

const tbody = document.querySelector("#assetTable tbody");

// Fetch all assets
async function fetchAssets() {
  try {
    const res = await fetch(`${API_BASE}/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    tbody.innerHTML = "";

    data.forEach(asset => {
      const tr = document.createElement("tr");

      // Status color
      let statusColor = "black";
      if (asset.status === "available") statusColor = "green";
      if (asset.status === "issued") statusColor = "orange";
      if (asset.status === "deleted") statusColor = "red";

      tr.innerHTML = `
        <td>${asset.assetNumber}</td>
        <td>${asset.type}</td>
        <td>${asset.brand || asset.fields.brand || "-"}</td>
        <td>${asset.model || asset.fields.model || "-"}</td>
        <td>${asset.fields.location || asset.location || "-"}</td>
        <td>${asset.fields.year || asset.year || "-"}</td>
        <td>${asset.fields.quantity || asset.quantity || 1}</td>
        <td style="color:${statusColor}; font-weight:bold;">${asset.status}</td>
        <td>
          ${asset.status === "available" ? `<button onclick="issueAsset('${asset.assetNumber}')">Issue</button>` : ""}
          ${asset.status === "issued" ? `<button onclick="receiveAsset('${asset.assetNumber}')">Receive</button>` : ""}
          ${asset.status !== "deleted" ? `<button onclick="deleteAsset('${asset.assetNumber}')">Delete</button>` : ""}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Fetch assets error:", err);
    tbody.innerHTML = `<tr><td colspan="9">❌ Error loading assets</td></tr>`;
  }
}

// Issue asset
async function issueAsset(assetNumber) {
  const issuedTo = prompt("Enter receiver name:");
  const receiverEmail = prompt("Enter receiver email:");
  if (!issuedTo || !receiverEmail) return alert("Receiver name and email are required");

  const issuerName = localStorage.getItem("username") || "";
  const issuerEmail = localStorage.getItem("email") || "";

  try {
    const res = await fetch(`${API_BASE}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assetNumber, issuerName, issuerEmail, issuedTo, receiverEmail })
    });
    const out = await res.json();
    if (res.ok) alert(out.msg);
    else alert(out.msg || out.error);
    fetchAssets();
  } catch (err) {
    console.error(err);
    alert("❌ Server error while issuing asset");
  }
}

// Receive asset
async function receiveAsset(assetNumber) {
  if (!confirm(`Are you sure you want to receive ${assetNumber}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assetNumber })
    });
    const out = await res.json();
    if (res.ok) alert(out.msg);
    else alert(out.msg || out.error);
    fetchAssets();
  } catch (err) {
    console.error(err);
    alert("❌ Server error while receiving asset");
  }
}

// Delete asset
async function deleteAsset(assetNumber) {
  if (!confirm(`Are you sure you want to delete ${assetNumber}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/${assetNumber}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const out = await res.json();
    if (res.ok) alert(out.msg);
    else alert(out.msg || out.error);
    fetchAssets();
  } catch (err) {
    console.error(err);
    alert("❌ Server error while deleting asset");
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}

// Auto load assets
fetchAssets();
