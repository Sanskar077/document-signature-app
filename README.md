# 📄 Document Signature App

A full-stack e-signature platform inspired by DocuSign, Adobe Sign, and ILovePDF, built using the MERN stack.

The application allows users to upload PDF documents, place signatures, initials, stamps, create signing requests, manage recipients, generate public signing links, and download finalized signed PDFs.

---

# 🚀 Features

## Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes
* Session Management
* Forgot Password
* Email OTP Verification

---

## Document Management

* Upload PDF Documents
* Document Dashboard
* Document Search & Filtering
* Document Status Tracking
* PDF Preview
* Multi-Page PDF Support
* Download Signed PDFs

---

## Signature Features

* Draw Signature
* Typed Signature
* Initials
* Company Stamp
* Multiple Signature Styles
* Color Selection
* Draggable Signatures
* Resizable Signatures
* Signature Persistence
* Duplicate Signature Prevention

---

## Signing Workflow

* Sign Documents Yourself
* Public Signing Links
* Recipient Management
* Signing Requests
* Multiple Signers
* Signing Order Enforcement
* Expiration Handling
* Request Tracking

---

## Audit & Tracking

* Audit Trail
* Activity Timeline
* Signing History
* Document Status Monitoring

Tracked Events:

* Upload
* View
* Share
* Recipient Added
* Recipient Removed
* Sign
* Reject
* Finalize
* Download

---

## Security

* JWT Authentication
* Protected APIs
* Token Validation
* Expired Link Validation
* Ownership Verification
* Input Validation
* Secure Password Storage

---

# 🛠️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React PDF
* DnD Kit
* Axios
* React Router

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Multer
* PDF-Lib
* Nodemailer

---

# 📁 Project Structure

```text
document-signature-app/

├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── contexts/
│   │   ├── types/
│   │   └── assets/
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── config/
│   └── package.json
│
└── README.md
```

# ⚙️ Installation

## Clone Repository

```bash
git clone <repository-url>
cd document-signature-app
```

## Install Frontend Dependencies

```bash
cd client
npm install
```

## Install Backend Dependencies

```bash
cd ../server
npm install
```

# 🔑 Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

OTP_SECRET=your_otp_secret
```

# 🗄️ Database Setup

1. Create MongoDB Atlas Cluster.
2. Create Database User.
3. Whitelist IP Address.
4. Copy Connection String.
5. Add Connection String to `.env`.

Example:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/document-sign
```

# ▶️ Run Backend

```bash
cd server
npm run dev
```

Server starts at:

```text
http://localhost:5000
```

# ▶️ Run Frontend

```bash
cd client
npm run dev
```

Frontend starts at:

```text
http://localhost:5173
```

# 📌 Available Features

| Feature               | Status |
| --------------------- | ------ |
| Registration          | ✅      |
| Login                 | ✅      |
| JWT Authentication    | ✅      |
| Protected Routes      | ✅      |
| PDF Upload            | ✅      |
| Dashboard             | ✅      |
| PDF Preview           | ✅      |
| Signature Placement   | ✅      |
| Typed Signature       | ✅      |
| Initials              | ✅      |
| Company Stamp         | ✅      |
| Public Signing        | ✅      |
| Audit Trail           | ✅      |
| Activity Timeline     | ✅      |
| Recipients            | ✅      |
| Multi Signer Workflow | ✅      |
| Request Tracking      | ✅      |
| Signed PDF Generation | ✅      |

# 🌐 Deployment

## Frontend

Deploy to:

* Vercel
* Netlify

Build:

```bash
npm run build
```

## Backend

Deploy to:

* Render
* Railway

Start Command:

```bash
npm start
```
## Deployed Links

Frontend : https://document-signature-app-kappa.vercel.app/
Backend : https://document-signature-app-bbus.onrender.com/

## Database

Use:

* MongoDB Atlas

# 📷 Screenshots

Add screenshots here:

* Login Page
<img width="1366" height="2446" alt="screencapture-localhost-5173-2026-06-07-10_34_40" src="https://github.com/user-attachments/assets/c0f80fd2-8e20-4d3d-889f-84eff17b9c0e" />

* Dashboard
<img width="1366" height="1413" alt="screencapture-localhost-5173-dashboard-2026-06-07-10_36_27" src="https://github.com/user-attachments/assets/28d9729a-2aeb-424f-926d-bd868a70082b" />

* Upload Page
<img width="1365" height="647" alt="image" src="https://github.com/user-attachments/assets/bd464b1c-d055-4e1c-b481-aab570bdb951" />

* PDF Preview
<img width="1365" height="644" alt="image" src="https://github.com/user-attachments/assets/e1188b45-0ecc-411c-ba69-2ed3d1888d50" />

* Signature Workspace
<img width="1365" height="646" alt="image" src="https://github.com/user-attachments/assets/c7726515-697a-4357-9d25-56d53f0f5658" />

* Recipients Page
<img width="1365" height="645" alt="image" src="https://github.com/user-attachments/assets/bf54aca9-cac7-433b-a2e9-23b4ba13979a" />

* Audit Trail
<img width="1365" height="646" alt="image" src="https://github.com/user-attachments/assets/94b2576a-5c14-4329-839f-61a7bb87aa58" />

* Public Signing Page
<img width="1365" height="647" alt="image" src="https://github.com/user-attachments/assets/fc862066-1686-4108-9a29-b4461d22b969" />


# 🎯 Future Enhancements

* Advanced Notifications
* SMS Verification
* AI Signature Verification
* Bulk Document Signing
* Team Workspaces
* Role-Based Access Control

# 👨‍💻 Author

Sanskar Alave

---

## License

This project is developed for educational and internship purposes.
