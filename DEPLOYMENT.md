# Travel Booking Web Application - Production Deployment Guide

A comprehensive, production-grade guide for deploying the Travel Booking platform (React/Vite frontend + Spring Boot backend + Managed PostgreSQL + Razorpay INR payment architecture).

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Environment Variables Reference](#2-environment-variables-reference)
3. [Database Setup & Managed PostgreSQL](#3-database-setup--managed-postgresql)
4. [Backend Deployment Guide (Spring Boot)](#4-backend-deployment-guide-spring-boot)
5. [Frontend Deployment Guide (React + Vite)](#5-frontend-deployment-guide-react--vite)
6. [CORS & Network Security](#6-cors--network-security)
7. [Razorpay Payment Gateway (INR) Configuration](#7-razorpay-payment-gateway-inr-configuration)
8. [HTTPS, Domains & Webhooks](#8-https-domains--webhooks)
9. [Pre-Flight Launch Checklist](#9-pre-flight-launch-checklist)
10. [Rollback & Disaster Recovery](#10-rollback--disaster-recovery)

---

## 1. Architecture Overview

```mermaid
graph TD
    Client["Client Browser (Desktop/Mobile)"]
    Frontend["Frontend Host (Render / Vercel / Netlify)<br/>React 19 + Vite 8 Static Asset Hosting"]
    Backend["Backend Service (Render / Railway / Container)<br/>Spring Boot 4.x on Java 25"]
    Database[("Managed PostgreSQL (Render / Supabase / AWS RDS)<br/>6 Tables, Relational Schema")]
    Razorpay["Razorpay Payment Gateway (India)<br/>Orders, Checkout, Webhooks, Verification"]

    Client -->|HTTPS / Assets| Frontend
    Client -->|REST API Requests / JWT| Backend
    Client -->|Checkout Modal / Razorpay SDK| Razorpay
    Backend -->|JDBC Connection Pool (HikariCP)| Database
    Backend -->|Order Creation & Verification API| Razorpay
    Razorpay -->|Server-to-Server HMAC Webhooks| Backend
```

- **Frontend**: Single Page Application (SPA) built with Vite and React. Served as static files with client-side routing.
- **Backend**: Spring Boot REST API with stateless JWT authentication, server-authoritative pricing and inventory management.
- **Database**: Managed PostgreSQL (14+) with connection pooling managed by HikariCP.
- **Payment Processing**: Razorpay (INR - Indian Rupees `₹`), server-side order generation in paise, cryptographic HMAC signature verification, replay protection, and automated expiration for pending bookings.

---

## 2. Environment Variables Reference

### Backend Environment Variables (`application-prod.properties`)

| Variable Name | Required | Default / Format | Description |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **YES** | `prod` | Activates production profile with optimized pooling and disabled SQL logging. |
| `PORT` | **YES** | `8080` | Port for the embedded server (automatically provided by Render/Railway/Heroku). |
| `DATABASE_URL` | **YES** | `jdbc:postgresql://<host>:<port>/<dbname>?sslmode=require` | Managed PostgreSQL JDBC connection URL. |
| `DB_USERNAME` | Conditional | `<db-user>` | Database username (if not embedded directly in JDBC URL). |
| `DB_PASSWORD` | Conditional | `<db-password>` | Database password (if not embedded directly in JDBC URL). |
| `JWT_SECRET` | **YES** | High-entropy string (≥32 chars) | Secret key used to sign and verify HMAC-SHA JWT access tokens. |
| `FRONTEND_URL` | **YES** | `https://yatramigo.dev` | Production frontend HTTPS origin for strict CORS allowlisting (no trailing slash). |
| `GOOGLE_CLIENT_ID` | **YES** | Google OAuth Web Client ID (`...apps.googleusercontent.com`) | Required for cryptographic verification of Google Sign-In ID tokens. |
| `SPRING_MAIL_HOST` | **YES** | `smtp.resend.com` | Outbound SMTP host (Resend SMTP). |
| `SPRING_MAIL_PORT` | **YES** | `465` | Outbound SMTP port (465 for SSL). |
| `SPRING_MAIL_USERNAME` | **YES** | `resend` | Resend SMTP username. |
| `SPRING_MAIL_PASSWORD` | **YES** | Resend API key | **STRICTLY PRIVATE** Resend API key (`re_...`) configured in Render environment. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH` | Optional | `true` | Enables SMTP authentication. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_SSL_ENABLE` | Optional | `true` | Enables SSL encryption on port 465. |
| `MAIL_FROM` | **YES** | `no-reply@yatramigo.dev` | Verified sender From address configured in Resend. |
| `RAZORPAY_KEY_ID` | **YES** | `rzp_test_...` or `rzp_live_...` | Razorpay public API key ID (transmitted to checkout clients). |
| `RAZORPAY_KEY_SECRET` | **YES** | Razorpay secret key | **STRICTLY PRIVATE** server key used for HMAC signature and order APIs. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Webhook secret | **STRICTLY PRIVATE** secret configured in Razorpay dashboard for webhook signing. |

> [!CAUTION]
> **CRITICAL SECRET HYGIENE**:
> `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SPRING_MAIL_PASSWORD`, `JWT_SECRET`, and `DB_PASSWORD` must NEVER be committed to Git, logged to consoles, or bundled into frontend assets.

### Frontend Environment Variables (`frontend/.env.example` / Vercel)

| Variable Name | Required | Example | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | **YES** in Prod | `https://travel-booking-web-i3a0.onrender.com` | Public HTTPS URL of the backend API (without trailing slash). |
| `VITE_GOOGLE_CLIENT_ID` | **YES** in Prod | `<same-google-client-id>.apps.googleusercontent.com` | Google OAuth2 Web Client ID for Google Identity Services. |

---

## 2.1 Production Authentication Architecture

### 1. Local Email / Password Authentication
- **Registration**:
  - Name, normalized lowercase email, and password submitted to `/api/users/register`.
  - Password hashed using BCrypt (`BCryptPasswordEncoder`). Plaintext passwords are never stored or logged.
  - Generates a secure, cryptographically random 6-digit OTP code (`SecureRandom`).
  - Stores BCrypt-hashed OTP in database with a 15-minute expiration timestamp (`verificationCodeExpiresAt`).
  - Sets `emailVerified=false` and `verificationAttempts=0`.
  - Dispatches OTP to user's email via Resend SMTP (`smtp.resend.com:465` SSL).
  - Enforces `@Transactional(rollbackFor = Exception.class)`: If Resend SMTP delivery fails, the transaction rolls back cleanly, returning HTTP 503 so no orphaned or unverified users remain without an email.
- **Verification**:
  - Submits email and 6-digit OTP to `/api/users/verify-email`.
  - Enforces brute-force defense: Maximum 5 failed attempts per OTP code. Exceeding 5 attempts immediately destroys the OTP code, requiring a new code request.
  - Upon valid verification, immediately invalidates the OTP code, clears expiration, marks `emailVerified=true`, and issues an application JWT access token.
- **Resend OTP Cooldown**:
  - Endpoint `/api/users/resend-verification-code` enforces a mandatory 60-second cooldown between resend requests to prevent inbox flooding and spam.
- **Local Login**:
  - Requires matching BCrypt password and explicitly requires `emailVerified=true`.
  - Unverified accounts receive HTTP 403 Forbidden with a clear prompt to complete email verification at `/verify-email`.

### 2. Real Google Identity Services (GIS) Authentication
- **Client Flow**:
  - The official Google Identity Services (GIS) button (`window.google.accounts.id`) is rendered on both `/login` and `/register`.
  - The client displays Google's authentic account chooser UI.
  - Upon user account selection, Google issues a signed cryptographic Google ID Token (JWT).
- **Backend Cryptographic Verification**:
  - ID Token is posted to `/api/users/google-login`.
  - Verified server-side by `GoogleAuthService` using `com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier`.
  - Validates cryptographic signature, Google issuer (`accounts.google.com` or `https://accounts.google.com`), audience (`GOOGLE_CLIENT_ID`), and expiration.
  - Validates `emailVerified=true` from Google's payload. Tokens with unverified Google emails are strictly rejected.
- **Account Linking & Duplicate Prevention**:
  - Searches database first by `googleId`, then by normalized email.
  - If an existing account with the same email exists (e.g. created via email/password), the Google identity is linked:
    - User ID is preserved.
    - Role (`ADMIN` or `USER`) is preserved.
    - Existing bookings, reviews, and payments remain intact.
    - Sets `googleId` and ensures `emailVerified=true`.
  - If no account exists, a new account is created with `authProvider="GOOGLE"`, `emailVerified=true`, a secure unguessable random password, and a welcome email is sent.
  - Zero duplicate accounts are created.
- **Application JWT Issuance**:
  - Google ID token is never used as the session token.
  - Once verified, Yatramigo issues its own signed HMAC-SHA JWT token. Both local and Google users share the exact same `AuthContext` state.
- **Production Simulation Elimination**:
  - Simulated tokens (`test_google_token_*`) are strictly rejected with an exception whenever `SPRING_PROFILES_ACTIVE=prod` or `app.auth.allow-simulation=false`.
  - No bypass branches exist in production.

### 3. Google Cloud Console Configuration Checklist
1. Open [Google Cloud Console -> APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials).
2. Select or create an OAuth 2.0 Client ID of type **Web application**.
3. Under **Authorized JavaScript origins**, configure:
   - `https://yatramigo.dev` (Production custom domain)
   - `https://travel-booking-web-*.vercel.app` (Vercel preview/production deployments)
   - `http://localhost:5173` (Local frontend development)
4. Under **Authorized redirect URIs**, configure:
   - `https://yatramigo.dev`
   - `http://localhost:5173`
5. Copy the Client ID:
   - Set in Render: `GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com`
   - Set in Vercel: `VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com`

---

## 3. Database Setup & Managed PostgreSQL

### Provisioning
Create a Managed PostgreSQL instance on your preferred cloud provider (e.g., Render Managed PostgreSQL, Supabase, Neon, or AWS RDS).

### Schema Initialization
Before the first backend start, initialize the database using the provided [schema.sql](file:///Users/ektagarg/javaspring/travelBookingWeb/src/main/resources/schema.sql):

```bash
# Example initialization via psql
psql "postgres://<user>:<password>@<host>:<port>/<dbname>?sslmode=require" -f src/main/resources/schema.sql
```

The schema defines:
1. `app_users` - User authentication and role management (`USER`, `ADMIN`).
2. `destination` - Travel destinations catalog.
3. `travel_package` - Packages with real-time available seats and pricing.
4. `booking` - Customer reservations with status and expiration tracking.
5. `payment` - Complete audit trail of Razorpay order IDs, payment IDs, and signatures.
6. `review` - Customer ratings and verified reviews.
7. Performance indexes on lookup and foreign key columns.

### Hibernate DDL Strategy in Production
In `application-prod.properties`, Hibernate is configured with:
```properties
spring.jpa.hibernate.ddl-auto=update
```
- **Safety**: `update` does **not** drop tables or delete existing customer columns/data.
- **Production Best Practice**: For long-term schema evolution, schema changes should be managed via version-controlled migration scripts applied through database deployment pipelines.

---

## 4. Backend Deployment Guide (Spring Boot)

### Deploying on Render (Recommended)

1. **Create Web Service**:
   - Go to Render Dashboard -> **New** -> **Web Service**.
   - Connect your GitHub repository: `praveshgarg099/travel-booking-web`.
   - Root Directory: Leave blank (repository root).
   - Runtime: **Java** or **Docker**.

2. **Build & Start Commands** (Native Java Environment):
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -Dspring.profiles.active=prod -jar target/travelBookingWeb-0.0.1-SNAPSHOT.jar`

3. **Configure Environment Variables**:
   In the Render Service Settings, add the following Environment Variables:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DATABASE_URL`: `jdbc:postgresql://<render-db-host>:5432/<dbname>?sslmode=require`
   - `DB_USERNAME`: `<db-user>`
   - `DB_PASSWORD`: `<db-password>`
   - `JWT_SECRET`: `<generate-a-secure-random-64-character-string>`
   - `FRONTEND_URL`: `https://your-app-frontend.onrender.com`
   - `RAZORPAY_KEY_ID`: `rzp_test_...` (start with Test keys)
   - `RAZORPAY_KEY_SECRET`: `<your-razorpay-test-secret>`
   - `RAZORPAY_WEBHOOK_SECRET`: `<your-razorpay-webhook-secret>`
   - `GOOGLE_CLIENT_ID`: `<google-oauth-client-id>`
   - `SPRING_MAIL_HOST`: `smtp.resend.com`
   - `SPRING_MAIL_PORT`: `465`
   - `SPRING_MAIL_USERNAME`: `resend`
   - `SPRING_MAIL_PASSWORD`: `<your-resend-api-key-from-render-dashboard>`
   - `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH`: `true`
   - `SPRING_MAIL_PROPERTIES_MAIL_SMTP_SSL_ENABLE`: `true`
   - `MAIL_FROM`: `no-reply@yatramigo.dev`

4. **Health Check Path**:
   - Path: `/api/travel-packages` (public read endpoint).

---

## 5. Frontend Deployment Guide (React + Vite)

### Deploying on Render / Vercel / Netlify

1. **Create Static Site**:
   - Provider Dashboard -> **New** -> **Static Site**.
   - Connect repository: `praveshgarg099/travel-booking-web`.

2. **Build Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`

4. **Single Page Application (SPA) Routing Rewrite**:
   Because React uses client-side routing via React Router, configure redirects so all page paths route to `index.html`:
   - **Render / Netlify (`frontend/public/_redirects`)**:
     ```text
     /*    /index.html   200
     ```
   - **Vercel (`vercel.json`)**:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```

---

## 6. CORS & Network Security

In `application-prod.properties`, CORS is restricted strictly to the configured `FRONTEND_URL`:

```properties
cors.allowed-origins=${FRONTEND_URL}
```

- **Zero Localhost Exposure**: In production, `localhost:5173` is **not** permitted.
- **Credentials Support**: `allowCredentials=true` is enabled to securely support authorization headers.
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS, PATCH`.
- **Allowed Headers**: `Authorization, Content-Type, Accept, Origin, X-Requested-With`.

---

## 7. Razorpay Payment Gateway (INR) Configuration

### Architecture & Security Rules
1. **Server-Authoritative Amounts**: The frontend never determines the transaction amount. All pricing is calculated by the backend in Indian Rupees (`₹`) and submitted to Razorpay in **paise** (`amountInPaise = amount * 100`).
2. **Cryptographic Verification**: After checkout completion, the backend independently verifies the `razorpay_signature` using HMAC-SHA256:
   $$\text{HMAC\_SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{KEY\_SECRET})$$
3. **Replay Attack Detection**: A used `razorpay_payment_id` can never be submitted more than once.
4. **Pending Payment Expiration**: Unpaid bookings expire automatically after 15 minutes, returning package seats to general availability.

### Transition Checklist: Test Mode -> Live Mode

> [!WARNING]
> DO NOT switch to Live Mode until KYC verification is completed in the Razorpay Dashboard and all end-to-end checkout paths have been validated in Test Mode.

1. **Verify Test Mode First**:
   - Run end-to-end booking tests using Razorpay test card/UPI credentials.
   - Confirm booking changes from `PENDING_PAYMENT` -> `CONFIRMED`.
   - Verify payment record is created with `status = SUCCESS`.
2. **Obtain Live Credentials**:
   - Log into [Razorpay Dashboard](https://dashboard.razorpay.com).
   - Switch toggle from **Test Mode** to **Live Mode**.
   - Go to **Settings** -> **API Keys** -> **Generate Key**.
3. **Update Backend Environment Variables**:
   - Update `RAZORPAY_KEY_ID` to `rzp_live_...`.
   - Update `RAZORPAY_KEY_SECRET` to your live secret in the host's secret manager.
4. **Configure Production Webhook**:
   - URL: `https://your-backend-api.onrender.com/api/payments/webhook`
   - Active Events: `payment.captured`, `payment.failed`, `order.paid`.
   - Set Webhook Secret in both Razorpay Dashboard and backend `RAZORPAY_WEBHOOK_SECRET`.

---

## 8. HTTPS, Domains & Webhooks

1. **Strict HTTPS**:
   Both frontend and backend must be served over HTTPS. Cloud providers (Render, Vercel, Railway) provide managed SSL/TLS certificates automatically.
2. **Custom Domain**:
   - Configure DNS `CNAME` records pointing to provider hostnames.
   - Ensure `FRONTEND_URL` on the backend matches the final custom frontend domain (e.g. `https://travel.yourdomain.com`).

---

## 9. Pre-Flight Launch Checklist

- [ ] Managed PostgreSQL provisioned and accepting connections.
- [ ] Database initialized with `schema.sql`.
- [ ] Backend environment variables (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) configured.
- [ ] Production build succeeds without warnings (`npm run build` & `./mvnw clean package -DskipTests`).
- [ ] All 39 test suites passing (`./mvnw clean test`).
- [ ] Frontend configured with public backend URL (`VITE_API_BASE_URL`).
- [ ] CORS verified: Requests from frontend succeed without CORS pre-flight errors.
- [ ] Razorpay webhook active and verified.

---

## 10. Rollback & Disaster Recovery

1. **Application Rollback**:
   - Both Render and Vercel support instant rollback to any previous deployment with 1 click.
2. **Database Backups**:
   - Enable automated daily snapshots on Managed PostgreSQL.
   - For manual backup:
     ```bash
     pg_dump "postgres://<user>:<password>@<host>/<dbname>" -F c -b -v -f backup_$(date +%Y%m%d).dump
     ```
   - For restore:
     ```bash
     pg_restore -d "postgres://<user>:<password>@<host>/<dbname>" -v backup_file.dump
     ```
