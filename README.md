# Yadman — Gift Store & Corporate Gifting Platform

Yadman is a modern e-commerce platform designed for personal gifting and corporate gift solutions. It provides a streamlined shopping experience for individual customers while offering businesses dedicated tools to explore, customize, and request bulk gift packages.

The platform combines product discovery, online ordering workflows, customer accounts, content management, and corporate inquiry management in one integrated application.

## ✨ Key Features

### 🛍️ E-commerce
- Product catalog with detailed product information and images
- Product categories, search, filtering, and sorting
- Product variants and inventory management
- Shopping cart and checkout workflow
- Discount coupons
- Customer accounts and order history
- Product reviews and ratings
- Wishlist functionality

### 🏢 Corporate Gifting (B2B)
- Dedicated corporate gifting section
- Bulk order inquiries
- Custom gift package requests
- Gift package customization options
- Company branding and logo packaging requests
- Corporate inquiry and consultation forms

### 📝 Content Management
- Blog and article management
- Blog categories and authors
- Homepage content management
- Promotional banners and website settings
- Product and content management through the admin dashboard

### ⚙️ Admin Dashboard
- Secure administrator authentication
- Product and category management
- Order management and status updates
- Customer management
- Coupon management
- Review moderation
- Corporate inquiry management
- Consultation management
- Blog management
- Homepage content customization

## 🧰 Technology Stack

**Frontend**
- React 19
- TypeScript
- Vite
- Tailwind CSS 4

**Backend**
- Node.js
- Express
- TypeScript

**Database & ORM**
- PostgreSQL
- Supabase
- Prisma ORM

## 🏗️ Architecture

Yadman uses a full-stack architecture with a React-based frontend and an Express API backend.

- The frontend communicates with backend services through REST API endpoints.
- Express handles API requests and application services.
- Prisma ORM manages database access.
- PostgreSQL stores application data.
- Supabase provides the hosted PostgreSQL database infrastructure.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- PostgreSQL database or a Supabase PostgreSQL project

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_REPOSITORY_URL
   ```

2. Navigate to the project directory:

   ```bash
   cd yadman
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and configure the required environment variables.

   Example:

   ```env
   DATABASE_URL="YOUR_DATABASE_CONNECTION_STRING"
   JWT_SECRET="YOUR_SECURE_JWT_SECRET"
   APP_URL="http://localhost:3000"
   ```

   Use the project's environment configuration and `.env.example` as the source of truth for all required variables. Never commit real credentials or secrets.

5. Generate the Prisma Client:

   ```bash
   npx prisma generate
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

The application should now be available at the local development address configured by the project.

## 🔐 Security

The project includes security-focused measures such as:

- Authentication and role-based access control
- Protected administrative endpoints
- Request validation
- Rate limiting
- Secure HTTP headers
- Upload validation
- Restricted CORS configuration
- Server-side validation of order data

## 💳 Payment Integration

The checkout workflow is part of the application. A live payment gateway has not yet been integrated.

## 📌 Project Status

Yadman is an actively developed project. Its core e-commerce, corporate gifting, content management, and administrative workflows are implemented, with further improvements and integrations planned.

## 📄 License

No license has been specified yet. All rights are reserved unless a license is added to this repository.

---

**Yadman — Thoughtful Gifts, Meaningful Connections.**
