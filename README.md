<h1 align="center">
  Travel Booking Web Application
</h1>

<p align="center">
  <strong>A full-stack, production-ready travel booking platform built with Spring Boot and React.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" />
</p>

---

## 📖 Overview

The **Travel Booking Web Application** is a modern, responsive, and secure platform designed for discovering and booking travel packages. It bridges a robust **Java Spring Boot backend** with a highly interactive, component-based **React frontend** powered by Vite.

This system was built with clean architecture in mind, ensuring that the backend serves as the absolute source of truth while the frontend delivers a high-quality, rich user experience through hybrid data mapping (merging secure database fields with high-fidelity UI presentation assets).

---

## ✨ Key Features

### 🏢 For Administrators
- **Admin Dashboard:** A centralized control panel providing metrics and shortcuts.
- **Package Management:** Create, read, update, and delete (CRUD) travel packages (enforced by `ROLE_ADMIN`).
- **Destination Management:** Define and manage geographic destinations.
- **User Auditing:** Inspect registered user accounts.
- **1-Click Data Seeding:** A built-in seeder that instantly populates the MySQL/PostgreSQL database with realistic travel destinations and packages directly via the API.

### 👤 For Users
- **Secure Authentication:** JWT-based login and registration system.
- **Travel Discovery:** Browse destinations and beautifully rendered travel packages featuring dynamic pricing, live seat availability, and daily itineraries.
- **Real-Time Booking Engine:** Select a travel package, input party size and travel dates, and instantly calculate costs and secure reservations.
- **Payment Processing:** Integrated mock payment flows linked directly to existing bookings.
- **Review System:** Leave star ratings and text reviews on past travel experiences.
- **Dashboard:** A personalized view of upcoming trips and past booking history.

---

## 🏗️ System Architecture

### 🛡️ Backend Architecture (Spring Boot)
The backend follows a standard N-tier architecture:
1. **Controllers:** REST APIs handling incoming HTTP requests.
2. **Services:** Core business logic, validation, and seat-availability checks.
3. **Repositories:** Spring Data JPA interfaces communicating with PostgreSQL.
4. **Security Filter Chain:** Intercepts requests, validates JWT tokens, and enforces RBAC (Role-Based Access Control).

### 🎨 Frontend Architecture (React)
The frontend utilizes a modern React setup:
1. **API Service Layer:** Isolated Axios instances (`bookingService.js`, `authService.js`, etc.) to keep UI components decoupled from network logic.
2. **Context API:** Global state management for Authentication (`AuthContext`) and Notifications (`ToastContext`).
3. **Route Guards:** `ProtectedRoute` and `AdminRoute` wrappers that prevent unauthorized access to sensitive views.
4. **Dynamic Data Hydration:** A unique `demoData.js` layer that safely merges beautiful frontend-only data (like high-res images and daily itineraries) with secure backend payloads (like prices and availability) without polluting the database schema.

---

## 🛠️ Technology Stack

| Category | Technology |
| --- | --- |
| **Backend Framework** | Java 17, Spring Boot 3 |
| **Database & ORM** | PostgreSQL, Spring Data JPA, Hibernate |
| **Security** | Spring Security, JSON Web Tokens (JWT), BCrypt |
| **Frontend Library** | React 18 |
| **Frontend Build Tool** | Vite |
| **Routing** | React Router v6 |
| **Network Client** | Axios |
| **Styling & UI** | Custom modular CSS, Lucide React (Icons) |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
- Java 17+
- Maven
- Node.js (v18+)
- PostgreSQL (running on port `5432`)

### 1️⃣ Database Setup
Create a PostgreSQL database named `travel_booking`.
```sql
CREATE DATABASE travel_booking;
```

### 2️⃣ Backend Setup
1. Open the project root in your favorite Java IDE (e.g., IntelliJ, Eclipse).
2. Configure your environment variables or update `src/main/resources/application-local.properties`:
   ```properties
   spring.datasource.username=YOUR_PG_USERNAME
   spring.datasource.password=YOUR_PG_PASSWORD
   jwt.secret=YOUR_SUPER_SECRET_JWT_KEY_MAKE_IT_LONG
   ```
3. Run the Spring Boot application. It will automatically generate the database schema. The server will start at `http://localhost:8080`.

### 3️⃣ Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary NPM packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5176` (or the port specified in your terminal). 
   *Note: The frontend is pre-configured to proxy `/api` requests to `localhost:8080` to bypass CORS during development.*

---

## 🪄 Populating Demo Data

To instantly experience the platform without manually typing out packages:

1. **Access the DB:** Manually insert an admin user into the database, or use the pre-existing one.
   *Example credentials:* `admin@gmail.com` / `admin123`
2. **Log In:** Navigate to `http://localhost:5176/login` and log in as the administrator.
3. **Navigate to Admin:** Click on your profile and select "Admin Dashboard".
4. **Seed Database:** Click the **"Seed Demo Data"** button. The frontend will iterate through `demoData.js` and securely transmit the core records to your backend, instantly building a realistic travel catalog.

---

## 🗺️ API Endpoints Summary

While the full API map is extensive, here are the primary REST resources:

- **Auth:** `POST /api/users/login`, `POST /api/users/register`
- **Packages:** `GET /api/travel-packages`, `POST /api/travel-packages` (Admin)
- **Destinations:** `GET /api/destinations`, `POST /api/destinations` (Admin)
- **Bookings:** `GET /api/bookings/my-bookings`, `POST /api/bookings`
- **Reviews:** `GET /api/reviews/package/{id}`, `POST /api/reviews`

---

## 🛡️ Security Posture

- **Passwords:** Hashed using `BCryptPasswordEncoder` before database persistence.
- **Tokens:** Stateless authentication using signed JWTs.
- **Authorization:** Controller-level role enforcement (e.g., `@PreAuthorize("hasRole('ADMIN')")`).
- **Validation:** Both backend (Jakarta validation constraints) and frontend (controlled React forms) ensure data integrity.
- **Data Encapsulation:** The frontend never exposes financial calculations to the backend; the backend validates all prices, durations, and seat capacities independently.

---

## 📝 License
This project is open-source. Feel free to fork, modify, and use it for educational purposes, portfolio demonstrations, or commercial foundations.
