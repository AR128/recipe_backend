# ⚙️ Poodiest - Backend API Server

The backend service for Poodiest is a robust, modular Node.js REST API built with Express 5, Mongoose (MongoDB), JSON Web Tokens (JWT), and Cloudinary.

## 🚀 Features

- **Authentication & Security**: JWT access token + refresh token architecture stored in httpOnly cookies, password hashing with `bcryptjs`.
- **CORS Management**: Configurable allowed origins pulled directly from `.env` (`CORS_ORIGIN`).
- **Database Integration**: MongoDB object modeling using Mongoose schemas (User, Recipe, Comment).
- **Media Management**: Secure server-side Cloudinary integration for processing recipe and user avatar image uploads.
- **REST APIs**: Structured routes for user management, public/authenticated recipe operations, comments, and admin controls.

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── recipeController.js
│   │   ├── uploadController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification middleware
│   ├── models/
│   │   ├── Comment.js       # Comment schema & model
│   │   ├── Recipe.js        # Recipe schema & model
│   │   └── User.js          # User schema & model
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── recipeRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── userRoutes.js
│   └── index.js             # Express application entry point
├── .env                     # Environment configuration variables
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/food_recipe
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3000

# Auth Secrets
ACCESS_TOKEN=your_access_token_secret_here
REFRESH_TOKEN=your_refresh_token_secret_here

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Default Admin Credentials
ADMIN_USERNAME=admin
EMAIL=admin@example.com
PASSWORD=password123
```

---

## 🏃 Running the Server

### Development Mode
Runs the server with Node `--watch` for automatic restart on file changes:
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Formatter / Linter Commands
```bash
npm run format   # Format codebase with Prettier
npm run check    # Check formatting compliance
```

---

## 🛰️ API Routes

### Health Check
- `GET /health` - Returns `{ status: "healthy", timestamp: ... }`

### Recipes (`/api/recipes`)
- `GET /recipes` - Get published recipes (supports `?search=`, `?category=`, `?page=`, `?limit=`)
- `GET /recipes/categories` - Get distinct category list
- `GET /recipes/:slug` - Get recipe by slug
- `GET /recipes/:slug/comments` - Get comments for a recipe
- `POST /recipes` *(Protected)* - Create recipe post
- `PUT /recipes/:id` *(Protected)* - Edit recipe post
- `DELETE /recipes/:id` *(Protected)* - Delete recipe post
- `POST /recipes/:slug/comments` *(Protected)* - Post a comment

### User (`/api/user`)
- `POST /user/signup` - Register user account
- `POST /user/login` - User login
- `POST /user/refresh` - Refresh access token via httpOnly cookie
- `POST /user/logout` *(Protected)* - Logout and revoke refresh token
- `GET /user/my-posts` *(Protected)* - Get logged-in user's recipes
- `GET /user/public/:username` - Get public profile & posts by username
- `GET /user/search` - Search users by query string `?q=`

### Admin (`/api/admin`)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/refresh` - Admin token refresh
- `GET /api/admin/recipes` *(Admin)* - List all recipes
- `DELETE /api/admin/recipes/:id` *(Admin)* - Delete recipe as admin

### Upload (`/api/upload`)
- `POST /api/upload` *(Protected)* - Upload base64 image data to Cloudinary
