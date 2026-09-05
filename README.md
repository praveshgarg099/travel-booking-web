# Travel Booking Web Application

A full-stack travel booking platform built with **Spring Boot** (Backend) and **React + Vite** (Frontend). 

## 🚀 Features
- **User Authentication:** Secure JWT-based registration and login system with Role-Based Access Control (Admin vs. User).
- **Destinations & Packages:** Browse rich, high-quality travel destinations and curated packages.
- **Booking Engine:** End-to-end booking flow including seat validation, date selection, and price calculation.
- **Payment Processing:** Integrated mock payment flows linked to bookings.
- **Review System:** Users can leave ratings and reviews for travel packages they've booked.
- **Admin Console:** A comprehensive dashboard for administrators to seed demo data, manage users, and perform CRUD operations on packages and destinations.

## 🛠️ Technology Stack
### Backend
- **Framework:** Java 17+, Spring Boot
- **Database:** PostgreSQL (with Spring Data JPA / Hibernate)
- **Security:** Spring Security & JWT
- **Build Tool:** Maven

### Frontend
- **Framework:** React 18, Vite
- **Routing:** React Router DOM
- **Styling:** Custom CSS with Lucide React icons
- **State & Data Fetching:** React Hooks, Axios (with interceptors)
- **Architecture:** Service-based component architecture

## ⚙️ Getting Started

### 1. Backend Setup (Spring Boot)
1. Make sure you have PostgreSQL running locally on port `5432`.
2. Configure the database credentials in `src/main/resources/application-local.properties`:
   ```properties
   spring.datasource.username=YOUR_DB_USERNAME
   spring.datasource.password=YOUR_DB_PASSWORD
   jwt.secret=YOUR_LONG_JWT_SECRET_KEY
   ```
3. Run the Spring Boot application (e.g. via your IDE or `mvn spring-boot:run`). The API will run on `http://localhost:8080`.

### 2. Frontend Setup (React/Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The frontend will be available at `http://localhost:5176` (or another port specified in the terminal). Note: The Vite config automatically proxies `/api` requests to the backend on `localhost:8080`.

### 3. Seeding Demo Data
To instantly populate the application with rich travel packages and destinations without manually entering them:
1. Register a new user and promote them to `ADMIN` in the database, OR use an existing Admin account (e.g., `admin@gmail.com` / `admin123`).
2. Log in to the frontend as the Admin.
3. Navigate to the **Admin Console** and click the **Seed Demo Data** button under Quick Administration Actions.

## 🔒 Security
- All sensitive API routes are protected by Spring Security.
- Admin-only routes strictly validate the `ROLE_ADMIN` authority on the backend.
- The React frontend uses protected route wrappers (`ProtectedRoute.jsx` and `AdminRoute.jsx`) to safely gatekeep UI views based on the JWT context.

## 📝 License
This project is open-source and available for educational and commercial use.
