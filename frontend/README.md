# Yatramigo - Travel Booking Web Application (Frontend)

Modern, high-performance React + Vite frontend for the existing Spring Boot + Spring Security + JWT + JPA + MySQL backend.

---

## 🌟 Features

- **Public Experience**:
  - **Landing Page**: Hero section, global destination search, curated itineraries, why-us guarantees, and traveler testimonials.
  - **Tour Catalog**: Real-time keyword search, destination filter dropdown, and price/duration sorting.
  - **Tour Details**: High-resolution photography, itinerary inclusions, live seat counters, interactive price calculator, and verified customer reviews.
  - **Authentication**: JWT token acquisition with secure local storage and automatic session expiration handling.

- **Traveler Portal (`USER` Role)**:
  - **Dashboard**: Overview of upcoming reservations, payments count, and review totals.
  - **My Bookings**: Real-time list of bookings from `GET /api/bookings` with cancellation dialogs returning seats to the pool.
  - **Booking Details**: Deep reservation view, update date/guests dialog for unpaid bookings (`PUT /api/bookings/{id}`).
  - **Payment Flow**: Payment checkout strictly using backend-calculated amount (read-only) via `POST /api/payments` with methods: `UPI`, `CARD`, `CASH`, `NET_BANKING`.
  - **Payment History**: Receipt tracking and deletion (`DELETE /api/payments/{id}`).
  - **Reviews**: Create, edit, and delete ratings (1-5 stars) and comments.

- **Administrator Portal (`ADMIN` Role)**:
  - **Admin Dashboard**: System metrics (packages, destinations, users, reservations).
  - **Package Management**: Create new travel packages with destination picker, edit existing tours, and delete tours.
  - **Destination Management**: Create, edit, and remove destinations with country classification.
  - **User Management**: View all registered accounts and delete users.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher (v26 tested)
- **Spring Boot Backend**: Running on `http://localhost:8080`

### 2. Installation
Navigate into the `frontend` directory:
```bash
cd frontend
npm install
```

### 3. Environment Configuration
By default, the Vite dev server uses a built-in reverse proxy forwarding all `/api` calls directly to `http://localhost:8080`, completely avoiding CORS issues:
```env
# frontend/.env
VITE_API_BASE_URL=
```
If you enable `@CrossOrigin` or CORS configuration bean on Spring Boot and wish to call it directly without the Vite proxy:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will be available at:
`http://localhost:5173`

### 5. Building for Production
```bash
npm run build
```
Production assets are generated in `frontend/dist/`.

---

## 🔌 Connected Spring Boot Backend Endpoints

| Resource | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/users/login` | Authenticate user & receive JWT token |
| **Auth** | `POST` | `/api/users` | Register new user |
| **Users** | `GET` | `/api/users/{id}` | Get user profile (Self/Admin) |
| **Users** | `PUT` | `/api/users/{id}` | Update own profile |
| **Users** | `GET` | `/api/users` | View all users (*Admin only*) |
| **Users** | `DELETE` | `/api/users/{id}` | Delete user (*Admin only*) |
| **Packages** | `GET` | `/api/travel-packages` | List all travel packages |
| **Packages** | `GET` | `/api/travel-packages/{id}` | Get single package by ID |
| **Packages** | `POST` | `/api/travel-packages` | Create travel package (*Admin only*) |
| **Packages** | `PUT` | `/api/travel-packages/{id}` | Update travel package (*Admin only*) |
| **Packages** | `DELETE` | `/api/travel-packages/{id}` | Delete package (*Admin only*) |
| **Destinations** | `GET` | `/api/destinations` | List all destinations |
| **Destinations** | `GET` | `/api/destinations/{id}` | Get destination by ID |
| **Destinations** | `POST` | `/api/destinations` | Create destination (*Admin only*) |
| **Destinations** | `PUT` | `/api/destinations/{id}` | Update destination (*Admin only*) |
| **Destinations** | `DELETE` | `/api/destinations/{id}` | Delete destination (*Admin only*) |
| **Bookings** | `GET` | `/api/bookings` | List user bookings (or all if Admin) |
| **Bookings** | `GET` | `/api/bookings/{id}` | View single booking details |
| **Bookings** | `POST` | `/api/bookings` | Create booking (`{ numberOfPeople, bookingDate, travelPackageId }`) |
| **Bookings** | `PUT` | `/api/bookings/{id}` | Update booking date/guests |
| **Bookings** | `DELETE` | `/api/bookings/{id}` | Cancel booking (restores seats) |
| **Payments** | `GET` | `/api/payments` | Get user payments |
| **Payments** | `GET` | `/api/payments/{id}` | Get payment by ID |
| **Payments** | `POST` | `/api/payments` | Process payment (`{ paymentMethod, bookingId }`) |
| **Payments** | `DELETE` | `/api/payments/{id}` | Delete payment record |
| **Reviews** | `GET` | `/api/reviews` | List all verified reviews |
| **Reviews** | `GET` | `/api/reviews/{id}` | Get review by ID |
| **Reviews** | `POST` | `/api/reviews` | Create review (`{ rating, comment, travelPackageId }`) |
| **Reviews** | `PUT` | `/api/reviews/{id}` | Update review |
| **Reviews** | `DELETE` | `/api/reviews/{id}` | Delete review |

---

## 🔒 Security & Role-Based UI Architecture

1. **JWT Header Injection**:
   Axios interceptor automatically attaches:
   `Authorization: Bearer <token>` to every outgoing request.
2. **Role Determination**:
   Upon login, the frontend decodes the JWT's `role` claim (`ADMIN` or `USER`) to conditionally render admin navigation and enforce route guarding via `<AdminRoute />`.
3. **Backend Authorization Defense**:
   If the Spring Boot server responds with `401 Unauthorized` or `403 Forbidden`, the central API interceptor normalizes the error and presents user-friendly messages:
   - `401`: Clears session and redirects to `/login`.
   - `403`: Displays `"You don't have permission to perform this action."`
4. **Calculated Totals Integrity**:
   Payment amounts are never user-editable on the frontend; the UI strictly reflects the server's computed total (`package.price * numberOfPeople`).
