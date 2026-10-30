# BizLens AI – Business Location Intelligence Platform

**Make smarter business location decisions with geographic data and machine learning.**

BizLens AI is a business location intelligence platform designed to help entrepreneurs evaluate potential business locations before investing. It analyzes nearby competitors, demand indicators, accessibility, and geographic factors to assess the business potential of a selected location.

The platform combines OpenStreetMap (OSM) data, machine learning, and rule-based scoring to generate location insights and actionable recommendations.

## 🌐 Live Application

- **Frontend:** https://biz-lens-ai-mu.vercel.app
- **Backend API:** https://bizlens-ai-backend-88an.onrender.com
- **ML Service:** https://bizlens-ai-ml-service.onrender.com

## ✨ Key Features

### 1. Business Location Analysis
- Select a business location using geographic coordinates.
- Choose a business category.
- Configure the analysis radius from 1 km to 5 km.
- Analyze nearby geographic and business information.

### 2. Competitor Analysis
- Identify nearby competing businesses.
- Calculate competitor distances.
- Analyze competitor distribution within 500 metres and 1 kilometre.
- Evaluate the competitive environment.

### 3. Market Demand Analysis
- Analyze nearby hospitals, clinics, schools, offices, and shopping areas.
- Identify demand-generating locations.
- Evaluate geographic factors that may influence business opportunities.

### 4. Accessibility Analysis
- Evaluate road connectivity.
- Examine nearby transportation facilities.
- Analyze accessibility-related geographic indicators.

### 5. Machine Learning Prediction
- Generate geographic features from location data.
- Use a trained Random Forest model to predict geographic opportunity.
- Display opportunity probability and geographic signals.
- Provide insights based on model outputs.

### 6. Business Recommendations
- Present recommendations based on analysis results.
- Highlight potential opportunities and business risks.
- Support location-selection decisions.

### 7. User Dashboard
- View previous location analyses.
- Monitor analysis statistics.
- Access saved analysis results.
- Review business location insights.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Machine Learning | Python, Scikit-learn |
| Geographic Data | OpenStreetMap, Overpass API |
| Data Processing | Pandas, NumPy |
| Geospatial Analysis | Haversine Distance, BallTree |
| Authentication | JWT, bcrypt |
| Maps | Leaflet, React-Leaflet |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

BizLens AI follows a modular architecture consisting of three primary services.

1. **Frontend:** Provides the user interface for location selection, business configuration, dashboard visualization, and analysis results.
2. **Backend:** Handles authentication, API requests, location analysis, competitor detection, business scoring, and database operations.
3. **Machine Learning Service:** Processes geographic features and generates predictions using the trained machine learning model.

### Architecture Flow

```text
              USER
                |
                v
       REACT FRONTEND
                |
                v
       NODE.JS / EXPRESS
          /          \
         v            v
    MONGODB       PYTHON ML API
                       |
                       v
                FEATURE ENGINEERING
                       |
                       v
                RANDOM FOREST MODEL
                       |
                       v
                OPPORTUNITY PREDICTION
                       |
                       v
                ANALYSIS RESULTS
                       |
                       v
                 REACT FRONTEND
```

## 📂 Project Structure

```text
BizLens-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   └── package.json
│
├── ml-service/
│   ├── data/
│   ├── models/
│   ├── data_pipeline/
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

*Adjust the folder structure above if your actual repository uses different directory names.*

## ⚙️ Installation and Setup

### Prerequisites

- Node.js and npm
- Python 3.10 or compatible project version
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd BizLens-AI
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 3. Backend Setup

```bash
cd backend
npm install
```

Configure the backend `.env` file with your MongoDB connection, JWT secret, and ML service URL.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:8000
```

Start the backend:

```bash
npm run dev
```

### 4. Machine Learning Service Setup

```bash
cd ml-service
```

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the ML service using the command configured in your project:

```bash
uvicorn main:app --reload --port 8000
```

Ensure the trained model and processed geographic dataset are available in their expected directories.

## 📊 Analysis Workflow

1. Register or log in to BizLens AI.
2. Select a geographic location.
3. Choose the desired business category.
4. Select the analysis radius.
5. Review the analysis configuration.
6. Start the location analysis.
7. View competitor, demand, accessibility, and risk indicators.
8. Review machine learning predictions and recommendations.
9. Save and revisit analysis results through the dashboard.

## 🔮 Future Enhancements

- Interactive geographic opportunity heatmaps.
- Improved geographic dataset coverage.
- Enhanced competitor classification and data validation.
- More detailed business recommendation capabilities.
- Advanced location comparison.
- Improved predictive model performance.
- Expanded business category coverage.

## 🎯 Project Objective

The primary objective of BizLens AI is to simplify business location evaluation by combining geographic information, competitor intelligence, and machine learning. It aims to help entrepreneurs make more informed location-selection decisions using data-driven insights.

## 👨‍💻 Contributors

Developed as an academic project by the project team.

## 📄 License

This project is developed for academic and educational purposes. Add an appropriate open-source license if you intend to distribute it publicly.
