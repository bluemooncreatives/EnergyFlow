# Energyflow - E-Commerce Platform

A full-stack e-commerce web application built with Next.js 15, featuring a complete shopping experience with user authentication, admin panel, payment integration, and more.

## 🚀 Features

### Customer Features
- **Product Browsing & Search**: Browse products with advanced filtering and search capabilities using Fuse.js
- **Shopping Cart**: Add, remove, and manage products in cart with Redux state management
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **User Dashboard**: Personal account management with order history
- **Payment Integration**: Razorpay payment gateway integration for secure transactions
- **Responsive Design**: Mobile-first design using Tailwind CSS

### Admin Features
- **Admin Dashboard**: Comprehensive admin panel for managing the store
- **Product Management**: Create, update, and delete products with rich text editor (CKEditor)
- **Order Management**: Track and manage customer orders
- **Image Management**: Cloudinary integration for image uploads and optimization
- **Data Analytics**: Visual analytics dashboard using Recharts
- **CSV Export**: Export data functionality for reports

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.2 (React 19)
- **Styling**: Tailwind CSS 4 with custom animations
- **UI Components**: 
  - Radix UI primitives
  - Material-UI components
  - Shadcn/ui components
- **State Management**: Redux Toolkit with Redux Persist
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React, React Icons, Material Icons

### Backend
- **Runtime**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Jose library) with bcryptjs
- **Email**: Nodemailer for transactional emails
- **Payment**: Razorpay integration
- **Image Storage**: Cloudinary

### Development Tools
- **Linting**: ESLint
- **Package Manager**: npm
- **Dev Tools**: React Query DevTools, Faker.js for testing data

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB database (local or cloud)
- Cloudinary account
- Razorpay account (for payment integration)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wency-web/Energyflow-Dev.git
   cd Energyflow-Dev
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret
   SECRET_KEY=your_secret_key
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Email
   EMAIL_HOST=your_email_host
   EMAIL_PORT=your_email_port
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Energyflow-Dev/
├── app/                    # Next.js app directory (pages, layouts, API routes)
├── components/             # Reusable React components
├── email/                  # Email templates
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── models/                 # Mongoose models/schemas
├── public/                 # Static assets
├── routes/                 # Route constants and configurations
├── store/                  # Redux store configuration and slices
├── middleware.js           # Next.js middleware for authentication
├── next.config.mjs         # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json           # Project dependencies
```

## 🔐 Authentication & Authorization

The application implements role-based access control with two roles:

- **User**: Can browse products, manage cart, place orders, and access personal dashboard
- **Admin**: Full access to admin panel, product management, and order management

Protected routes are handled via Next.js middleware with JWT token verification.

### Protected Routes
- `/admin/*` - Admin only
- `/my-account/*` - Authenticated users only
- `/auth/*` - Public (redirects if already authenticated)

## 🚀 Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## 🎨 UI Components

The project uses a hybrid approach combining:
- **Radix UI**: Accessible, unstyled components
- **Material-UI**: Rich component library
- **Custom Components**: Built with Tailwind CSS and class-variance-authority

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework with SSR/SSG |
| `mongoose` | MongoDB object modeling |
| `@reduxjs/toolkit` | State management |
| `@tanstack/react-query` | Server state management |
| `axios` | HTTP client |
| `razorpay` | Payment processing |
| `cloudinary` | Image management |
| `react-hook-form` | Form handling |
| `zod` | Schema validation |
| `bcryptjs` | Password hashing |
| `jose` | JWT operations |

## 🌐 API Routes

The application includes RESTful API routes for:
- User authentication (login, register, logout)
- Product CRUD operations
- Order management
- Payment processing
- User profile management

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- CORS configuration
- Environment variable protection
- Role-based access control

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🌐 Access Guide
Frontend (Customer Side)
Once you run the development server (npm run dev), the application will be available at http://localhost:3000

### Main Routes:
Homepage: http://localhost:3000/
Shop/Products: http://localhost:3000/shop
Product Details: http://localhost:3000/product/[product-slug]
Shopping Cart: http://localhost:3000/cart
Checkout: http://localhost:3000/checkout
Order Details: http://localhost:3000/order-details/[order-id]
Authentication Routes:
Login: http://localhost:3000/auth/login
Register: http://localhost:3000/auth/register
Reset Password: http://localhost:3000/auth/reset-password
User Dashboard (Requires Login):
My Account: http://localhost:3000/my-account
Profile: http://localhost:3000/my-account/profile
Orders: http://localhost:3000/my-account/orders
### Admin Panel
To access the admin panel, you need to:

Create an admin account (with role: 'admin' in the database)
Login at http://localhost:3000/auth/login
After successful authentication, you'll be redirected to the admin dashboard
Admin Routes:
Dashboard:

http://localhost:3000/admin/dashboard
### Category Management:

View Categories: http://localhost:3000/admin/category
Add Category: http://localhost:3000/admin/category/add
Edit Category: http://localhost:3000/admin/category/edit/[id]
Product Management:

View Products: http://localhost:3000/admin/product
Add Product: http://localhost:3000/admin/product/add
Edit Product: http://localhost:3000/admin/product/edit/[id]
Product Variants:

View Variants: http://localhost:3000/admin/product-variant
Add Variant: http://localhost:3000/admin/product-variant/add
Edit Variant: http://localhost:3000/admin/product-variant/edit/[id]
Media Management:

View Media: http://localhost:3000/admin/media
Edit Media: http://localhost:3000/admin/media/edit/[id]
Coupon Management:

View Coupons: http://localhost:3000/admin/coupon
Add Coupon: http://localhost:3000/admin/coupon/add
Edit Coupon: http://localhost:3000/admin/coupon/edit/[id]
Order Management:

View Orders: http://localhost:3000/admin/orders
Order Details: http://localhost:3000/admin/orders/details/[order-id]
Customer Management:

View Customers: http://localhost:3000/admin/customers
Reviews:

View Reviews: http://localhost:3000/admin/review
Trash:

View Trash: http://localhost:3000/admin/trash
Backend API Endpoints
The backend is built with Next.js API routes (located in app/api/). All API endpoints are accessible at:

http://localhost:3000/api/[endpoint]

### Available API Routes:
Authentication: /api/auth/*
Products: /api/product/*
Categories: /api/category/*
Product Variants: /api/product-variant/*
Orders: /api/orders/* & /api/user-order/*
Cart: /api/cart-verification/*
Coupons: /api/coupon/*
Customers: /api/customers/*
Media/Images: /api/media/*
Payment: /api/payment/* (Razorpay integration)
Reviews: /api/review/*
Profile: /api/profile/*
Dashboard Analytics: /api/dashboard/*
Shop/Filtering: /api/shop/*
Cloudinary: /api/cloudinary-signature/*
🔐 Authentication & Access Control
The application uses middleware.js for route protection:

Public routes: Homepage, shop, product details, auth pages
Protected user routes (/my-account/*): Requires authentication with role: 'user'
Protected admin routes (/admin/*): Requires authentication with role: 'admin'
The middleware automatically:

Redirects unauthenticated users to login page
Redirects authenticated users away from auth pages
Prevents users from accessing admin routes
Prevents admins from accessing user-specific routes
🚀 Quick Start
bash
# 1. Install dependencies
npm install

# 2. Set up environment variables in .env.local

# 3. Start development server
npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Admin Panel: http://localhost:3000/admin/dashboard (requires admin login)
# API: http://localhost:3000/api/*
Note: Make sure MongoDB is connected and environment variables are properly configured before accessing the application.

## 📝 License

This project is private and proprietary.

## 👥 Authors

- **wency-web** - *Initial work*

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting solutions
- All open-source contributors whose packages are used in this project

## 📞 Support

For support, please contact the development team or open an issue in the repository.

---

**Note**: This is a development version. Ensure all environment variables are properly configured before deploying to production.
