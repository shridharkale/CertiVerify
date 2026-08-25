# CertiVerify — Certificate Generation & Verification Platform

![CertiVerify Banner](https://img.shields.io/badge/CertiVerify-Data%20Science%20Portfolio-3b82f6?style=for-the-badge&logo=shield&logoColor=white)

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![Pandas](https://img.shields.io/badge/Pandas-2.2-150458?style=flat-square&logo=pandas)](https://pandas.pydata.org/)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://render.com/)
[![Deployed on GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-222222?style=flat-square&logo=githubpages)](https://pages.github.com/)

> A full-stack, certificate generation and instant-verification platform. Built as a portfolio project by a VTU ISE engineering student.

**Live Demo:** [https://shridharkale.github.io/CertiVerify/](https://shridharkale.github.io/CertiVerify/)  
**API Base:** [https://certiverify-kz39.onrender.com/api](https://certiverify-kz39.onrender.com/api)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React/Vite)             │
│  HashRouter  │  Recharts  │  GitHub Pages Deploy    │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS REST
┌────────────────────────▼────────────────────────────┐
│                   BACKEND (Flask/Gunicorn)           │
│  Render Deploy  │  Pandas Dedup  │  5-min Cache     │
└────────────────────────┬────────────────────────────┘
                         │ Firebase Admin SDK
┌────────────────────────▼────────────────────────────┐
│               Firebase Firestore                    │
│  /certificates  collection  │  Immutable records    │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Implementation |
|---|---|
| **Bulk Certificate Generation** | CSV → Pandas validation → ReportLab PDF |
| **Smart Duplicate Detection** | 2-level: within-batch dedup + Firestore cross-event check |
| **Sub-2s Verification** | In-memory cache with 5-minute TTL, bypasses Firestore re-query |
| **Certificate Expiry Tracking** | Optional Unix timestamp stored in Firestore, checked on verify |
| **Analytics Dashboard** | Recharts: BarChart (per event), PieChart (roles), LineChart (trend) |
| **Public Event Gallery** | `/event/:event_name` — public registry of all certs for an event |
| **Export CSV** | Client-side download of full certificate records |
| **LinkedIn Share** | Direct "Add to Profile" deep-link from certificate preview |
| **QR Code Verification** | Embedded QR on each PDF → deep-links to `/verify/:cert_id` |
| **Dark Data Science Theme** | `#080b14` background, electric blue + emerald, dot-grid overlay |
| **Keep-Alive Ping** | Frontend pings backend every 14 min to prevent Render cold starts |

---

## 🗂️ Project Structure

```
CertiVerify/
├── frontend/                        # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Hero with live stats counter
│   │   │   ├── Dashboard.jsx        # Sidebar layout + Recharts analytics
│   │   │   ├── Verify.jsx           # Scanner effect + timeline + EXPIRED state
│   │   │   ├── CertificatePreview.jsx  # LinkedIn share + copy link
│   │   │   └── EventGallery.jsx     # Public event certificate registry
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── VideoBackground.jsx  # Animated dark DS theme
│   │   └── utils/
│   │       └── api.js               # Axios instance with auth interceptor
│   ├── .env                         # VITE_API_BASE_URL, VITE_APP_NAME
│   └── vite.config.js
│
└── certverify-backend/              # Flask REST API
    ├── routes/
    │   ├── certificates.py          # Upload, Generate, Download, Gallery
    │   └── verify.py                # Verify with in-memory cache + expiry
    ├── utils/
    │   ├── cert_generator.py        # ReportLab PDF generation
    │   ├── qr_generator.py          # QR code generation to /tmp
    │   └── csv_reader.py            # Pandas CSV parser
    ├── firebase_config.py           # Firebase Admin SDK init
    ├── requirements.txt
    └── .env                         # Firebase credentials + VERIFY_BASE_URL
```

---

## 🔌 API Reference

### Certificates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/certificates/upload-csv` | 🔒 Bearer | Parse & deduplicate a CSV file |
| `POST` | `/api/certificates/generate` | 🔒 Bearer | Generate PDFs and store in Firestore |
| `GET` | `/api/certificates/list` | 🔒 Bearer | List all certs issued by authenticated user |
| `GET` | `/api/certificates/download/:cert_id` | Public | Download certificate PDF |
| `GET` | `/api/certificates/public-stats` | Public | Total certificates count |
| `GET` | `/api/certificates/public-event/:event_name` | Public | All certs for a named event |

### Verification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/verify/:cert_id` | Returns `VALID`, `EXPIRED`, or `INVALID` status |

**Verify Response Schema:**
```json
{
  "status": "VALID | EXPIRED | INVALID",
  "cert_id": "CERT-2026-AB12",
  "certificate": {
    "name": "Alice Vance",
    "email": "alice@example.com",
    "role": "Data Scientist",
    "event_name": "ML Bootcamp 2026",
    "event_date": "2026-01-15",
    "organisation": "VTU DS Club",
    "created_at": "2026-01-15T10:00:00Z",
    "expiry_date": 1800000000,
    "issued_by": "organiser@email.com"
  }
}
```

### Generate Request Schema

```json
{
  "event_name": "ML Bootcamp 2026",
  "event_date": "2026-01-15",
  "organisation": "VTU DS Club",
  "expiry_date": "2027-01-15",
  "participants": [
    { "name": "Alice Vance", "email": "alice@example.com", "role": "Data Scientist" }
  ]
}
```

---

## ⚙️ Local Development Setup

### Backend

```bash
cd certverify-backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in your credentials
cp .env.example .env

python app.py
# Server runs at http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
# Copy and configure
cp .env.example .env

npm run dev
# Dev server at http://localhost:5173
```

---

## 🌐 Deployment

### Frontend → GitHub Pages

```bash
cd frontend
npm run build
# Then push the dist/ folder to gh-pages branch
# Or use the gh-pages npm package:
npm install -g gh-pages
gh-pages -d dist
```

Configure `vite.config.js` with `base: '/CertiVerify/'`.

### Backend → Render

1. Push `certverify-backend/` to a GitHub repo
2. Create a **Web Service** on Render pointing to that repo
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `gunicorn app:app`
5. Add all environment variables from `.env` in Render's Dashboard

---

## 🔑 Environment Variables

### Frontend (`frontend/.env`)

| Variable | Example | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://certiverify-kz39.onrender.com/api` | Backend API base URL |
| `VITE_APP_NAME` | `CertiVerify` | App name for branding |

### Backend (`certverify-backend/.env`)

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (with `\n`) |
| `FIREBASE_PRIVATE_KEY_ID` | Key ID from service account JSON |
| `FIREBASE_CLIENT_ID` | Client ID from service account JSON |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `VERIFY_BASE_URL` | `https://shridharkale.github.io/CertiVerify/#/verify` |
| `GMAIL_USER` | Gmail address for email dispatch (optional) |
| `GMAIL_PASS` | Gmail app password for SMTP (optional) |

---

## 📊 Data Science Design Decisions

### Smart Duplicate Detection (Two-Level)

```python
# Level 1: Within-batch deduplication (O(n) with dict)
seen = {}
for p in participants:
    if p["email"] in seen:
        batch_dups.append(p)
    else:
        seen[p["email"]] = True
        batch_clean.append(p)

# Level 2: Cross-event Firestore check
for p in batch_clean:
    existing = db.collection("certificates")
        .where("email", "==", email)
        .where("event_name", "==", event_name)
        .limit(1).stream()
    if any(True for _ in existing):
        already_certified.append(p)
```

### Verification Cache (5-min TTL)

```python
_cert_cache = {}
_cache_expiry = {}
CACHE_TTL = 300  # seconds

now = time.time()
if cert_id in _cert_cache and now < _cache_expiry[cert_id]:
    return cached_response  # ← sub-2ms
```

### Certificate ID Format

All IDs follow the regex `^CERT-\d{4}-[A-Z0-9]{4}$`  
Example: `CERT-2026-X8Y9`

---

## 🧑‍💻 Developer

**Shridhar Kale** — VTU, B.E. Information science and engineering 

[![GitHub](https://img.shields.io/badge/GitHub-shridharkale-181717?style=flat-square&logo=github)](https://github.com/shridharkale)

---

## 📄 License

MIT License — free to use for portfolio, education, and personal projects.
