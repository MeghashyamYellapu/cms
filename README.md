# CableFlow - Cable TV Billing Management System

CableFlow is a comprehensive web-based billing and customer management solution designed specifically for Local Cable Operators (LCOs) and Internet Service Providers (ISPs). It streamlines operations by automating monthly billing, tracking payments, generating receipts, and providing detailed financial analytics.

![Dashboard Preview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670)

---

## 🚀 Key Features

*   **👥 Customer Management**: Add, edit, and manage customer profiles with detailed subscription info.
*   **📅 Automated Billing**: Automatically generates monthly bills on the 1st of every month using scheduled Cron jobs.
*   **💳 Smart Payments**: Record payments (Cash/UPI/Bank) with a searchable customer interface.
*   **🧾 Instant Receipts**: Generate professional PDF-style receipts and share directly via WhatsApp.
*   **📊 Analytics Dashboard**: Real-time insights into revenue, active vs inactive users, and collection trends.
*   **🔐 Role-Based Access**:
    *   **WebsiteAdmin**: Full system control.
    *   **SuperAdmin**: Manages multiple admins.
    *   **Admin**: Restricted access to assigned areas/customers.
*   **📱 Mobile Friendly**: Fully responsive UI/UX for managing business on the go.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Tailwind CSS, Lucide Icons, Recharts, Formik.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB.
*   **Authentication**: JWT (JSON Web Tokens).
*   **Tools**: `node-cron` (scheduling), `html2canvas` (receipt generation).

---

## ⚙️ Installation & Setup

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v14 or higher)
*   MongoDB (Local or Atlas URL)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone <repository_url>
cd cable
```

### 2. Backend Setup
Navigate to the server directory and install dependencies.
```bash
cd server
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key
# Optional: Admin Setup Keys
```

**Start the Server:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies.
```bash
cd client
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `client/` directory (optional if defaults work):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Start the React App:**
```bash
npm start
# Client runs on http://localhost:3000
```

---

## 📂 Project Structure

```
cable/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (Sidebar, Receipt, etc.)
│   │   ├── context/        # Auth Context
│   │   ├── pages/          # Main Views (Dashboard, Payments, Customers...)
│   │   ├── services/       # API integration (axios)
│   │   ├── App.js          # Routing & Main Layout
│   │   └── index.css       # Global Styles & Tailwind
│
├── server/                 # Node.js Backend
│   ├── config/             # DB Connection
│   ├── controllers/        # Route Logic (Auth, Bill, Payment, Customer)
│   ├── middlewares/        # Auth & Validation Middleware
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Routes
│   ├── utils/              # Helper functions (Cron Jobs)
│   └── server.js           # Entry Point
```

---

## 📝 Usage Guide

1.  **Login**: Use the default admin credentials (created upon first run or provided by database seed).
2.  **Dashboard**: View live stats.
3.  **Customers**: Add your customers. Set their monthly package amounts.
4.  **Bills**:
    *   Bills are auto-generated on the 1st of the month.
    *   You can manually generate bills from the "Bills" page if needed.
5.  **Payments**:
    *   Click "Record Payment".
    *   Search for a customer by Name or ID.
    *   Enter amount and save.
    *   Share the receipt via WhatsApp.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any feature additions or bug fixes.

---

## 📜 License

This project is licensed under the MIT License.
