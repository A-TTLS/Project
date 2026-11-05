# CalorieSnap - AI Calorie Calculator Application

> **Group Name:** A TTLS (UTM Group 1)  
> **Course:** Software Engineering / Web Development Project  
> **Project Manager:** Tey Xin Yi  

CalorieSnap is a responsive social wellness and nutrition tracking web platform designed to eliminate logging fatigue through integrated artificial intelligence (AI), peer accountability, and gamified incentives.

---

## 👥 Team Members & Roles

| Bil | Name | Role | Focus |
|:---:|:---|:---|:---|
| 1 | **Tey Xin Yi** | Project Manager & Architect | Agile milestones, Jira sprint tracking, architecture |
| 2 | **Lee Hui Zhen** | UI/UX Designer & Frontend Dev | Figma wireframes, responsive mobile-first styling, onboarding flows |
| 3 | **Tan Hui Shan** | QA Engineer & User Testing | Test cases, integration testing, 14-day usability evaluations |
| 4 | **Nur Syafiqah** | Frontend Lead Developer | Client-side routing, calorie dashboard, logging modules |
| 5 | **Aloysius Probo** | Backend & Database Engineer | Supabase schema, AI food recognition pipeline, auth endpoints |

---

## 🚀 Quick Start Guide (For Team Members)

### 1. Prerequisites on Your Laptop
Before running, make sure your computer has:
- **Git**: [Download Git](https://git-scm.com/)
- **Node.js** (v18 or higher recommended): [Download Node.js](https://nodejs.org/)

Verify by opening your terminal or PowerShell and typing:
```bash
git --version
node -v
npm -v
```

---

### 2. Getting the Code

#### If you are cloning for the FIRST time:
```bash
git clone https://github.com/A-TTLS/Project.git
cd Project
```

#### If you already cloned the repository before:
```bash
cd Project
git pull origin main
```

---

### 3. Running the Frontend (CalorieSnap Web App)

1. Open terminal in the `Frontend` folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies (only needed the first time or when new packages are added):
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to:
   ```
   http://localhost:5173/
   ```

*(Alternatively, from the root `Project` folder, you can directly run `npm run dev`!)*

---

### 4. Running the Backend / Database (Supabase)

1. In the root `Project/` folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Ask **Aloysius** for the Supabase keys, or copy from the group chat.
3. Test the connection:
   ```bash
   node test-db.js
   ```

---

## 🛠 Project Structure

```
Project/
├── Frontend/                           # Frontend application (Hui Zhen & Syafiqah)
│   ├── public/assets/                  # 24 icons, SVGs, and food hero images
│   ├── src/
│   │   ├── context/
│   │   │   └── AppContext.tsx          # Central reactive state (meals, points, water)
│   │   ├── screens/                    # Main app wireframes
│   │   │   ├── HomeScreen.tsx          # Daily Dashboard & meal list
│   │   │   ├── ScanScreen.tsx          # AI Camera meal viewfinder
│   │   │   ├── ScanResultScreen.tsx    # Review & portion multiplier
│   │   │   ├── SocialScreen.tsx        # Following, Discover & Group Circles
│   │   │   ├── TrendScreen.tsx         # Analytics charts & October calendar
│   │   │   ├── ProfileScreen.tsx       # User profile & goal editor
│   │   │   └── RewardsScreen.tsx       # SnapPoints, missions & voucher wallet
│   │   ├── pages/                      # Onboarding & Authentication
│   │   │   ├── LandingPage.tsx         # Landing page with hero banner & features
│   │   │   ├── LoginPage.tsx           # Sign in page
│   │   │   ├── RegisterPage.tsx        # Registration page
│   │   │   ├── MeasurementsPage.tsx    # Profile setup (Step 1)
│   │   │   └── ActivityPage.tsx        # Activity level & BMR calculation (Step 2)
│   │   ├── services/
│   │   │   └── authService.ts          # Auth helper ready for Supabase OAuth
│   │   ├── App.tsx                     # Screen router & prototype switcher
│   │   └── ui.tsx                      # Design system tokens & UI components
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .env.example                        # Template for environment keys
├── package.json                        # Root project scripts
└── test-db.js                          # Supabase connection test script
```

---

## ❓ Common Troubleshooting

- **Blank screen when opening index.html directly**: Do not open `index.html` by double-clicking it from File Explorer. Modern web apps require a local server—always use `npm run dev` and open `http://localhost:5173`.
- **PowerShell script execution error**: If Windows blocks running scripts (`cannot be loaded because running scripts is disabled`), open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
- **Port 5173 is in use**: If another process is using port 5173, Vite will automatically select `http://localhost:5174`. Check the URL printed in your terminal.
