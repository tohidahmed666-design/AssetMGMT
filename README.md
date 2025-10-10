# 🏢 Asset Management System (KSP - AssetMGMT)

A complete **Asset Management Web Application** built using **Node.js**, **Express.js**, and **Microsoft SQL Server** with secure **JWT authentication**, **email OTP verification**, and a clean HTML/JS frontend.  
Designed for police department asset tracking — includes modules for issuing, receiving, disposing, and auditing all assets.

---

## 🚀 Features

✅ **User Authentication**
- Secure login with JWT tokens  
- Email-based OTP verification  
- Role-based access (Admin / Station Users)  
- Login history tracking  

✅ **Asset Lifecycle Management**
- Add, update, view, and delete assets  
- Asset status tracking (`Available`, `Issued`, `Disposed`, `Deleted`)  
- Asset issue / receive workflow  
- Automatic audit logging  

✅ **Barcode & QR Scanning**
- Integrated with **Html5Qrcode** for asset identification  
- Auto-fetch asset details on scan  

✅ **Reporting & Analytics**
- Downloadable reports in **Excel**  
- Date, brand, model, and status filters  
- Summary of asset statistics  

✅ **Audit & Disposal Logs**
- Complete tracking of every issued, received, and disposed asset  
- GPS coordinates and approval tracking on disposal  
- Undo disposal support  

✅ **Email & Notification System**
- OTP delivery for login & password recovery  
- Nodemailer with secure app password support  

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Backend** | Node.js, Express.js |
| **Database** | Microsoft SQL Server |
| **ORM** | Sequelize |
| **Auth** | JWT, bcryptjs |
| **Email Service** | Nodemailer |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Barcode / QR** | JsBarcode, Html5Qrcode |
| **Reports** | Excel (via XLSX export) |

---

## ⚙️ Installation

1️⃣ **Clone the Repository**
```bash
git clone 
cd AssetMGMT
