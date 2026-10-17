# Poodiest Backend API

The REST API for **Poodiest**, a recipe-sharing application. Built with Node.js, Express 5, and MongoDB, the API supports recipe discovery and publishing, user accounts, comments, saved recipes, likes, and image uploads.

## Features

- User and admin authentication with JWT access tokens and HTTP-only refresh-token cookies
- MongoDB persistence through Mongoose models
- Recipe search, categories, trending recipes, publishing, likes, and saves
- User profiles, comments, and account management
- Cloudinary image uploads
- Configurable cross-origin access

## Requirements

- Node.js and npm
- A MongoDB database, local or hosted
- Cloudinary credentials for image uploads

## Quick start

From the repository root:

```bash
cd backend
npm install
```

Create `backend/.env` and set the required values described below, then start the API:

```bash
npm run dev
```

The API listens on `http://localhost:3000` by default. Check that it is running at [http://localhost:3000/health](http://localhost:3000/health).

## Configuration

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/food_recipe
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
NODE_ENV=development

ACCESS_TOKEN=replace_with_a_long_random_secret
REFRESH_TOKEN=replace_with_a_different_long_random_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Use your actual MongoDB connection string and Cloudinary credentials. `CORS_ORIGIN` is a comma-separated list of allowed frontend origins; include the development URLs for the apps you use. Keep `.env` private and do not commit secrets.

Admin login requires an admin account to already exist in the database.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API server |
| `npm start` | Start the API server |
| `npm run seed` | Add the sample recipes defined in `seed.js` |
| `npm run format` | Format backend files with Prettier |
| `npm run check` | Check backend formatting with Prettier |

## API reference

All application endpoints are prefixed with `/api`. Routes marked **Protected** require a valid access token.

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Return API health status |

### Users (`/api/user`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/signup` | Register a user |
| `POST` | `/login` | Log in and return an access token |
| `POST` | `/refresh` | Refresh the access token using the cookie |
| `POST` | `/logout` | Clear the refresh-token cookie |
| `GET` | `/search` | Search users |
| `GET` | `/public/:username` | Get a public profile |
| `GET` | `/profile` | Get the current user's profile (**Protected**) |
| `PUT` | `/profile` | Update the current user's profile (**Protected**) |
| `GET` | `/my-posts` | Get the current user's recipes (**Protected**) |
| `GET` | `/commented-posts` | Get recipes commented on by the current user (**Protected**) |
| `GET` | `/saved-recipes` | Get the current user's saved recipes (**Protected**) |
| `POST` | `/saved-recipes/:idOrSlug` | Toggle a saved recipe (**Protected**) |
| `GET` | `/dashboard` | Verify access to the user dashboard (**Protected**) |

### Recipes (`/api/recipes`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | List published recipes; supports search and category filters |
| `GET` | `/trending` | List trending recipes |
| `GET` | `/categories` | List recipe categories |
| `GET` | `/:slug` | Get a recipe by slug |
| `GET` | `/:slug/comments` | List recipe comments |
| `POST` | `/` | Create a recipe (**Protected**) |
| `PUT` | `/:id` | Update a recipe (**Protected**) |
| `DELETE` | `/:id` | Delete a recipe (**Protected**) |
| `POST` | `/:slug/comments` | Add a comment (**Protected**) |
| `POST` | `/:slug/likes` | Toggle a recipe like (**Protected**) |

### Admin (`/api/admin`) and uploads (`/api/upload`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/login` | Log in an admin |
| `POST` | `/api/admin/refresh` | Refresh the admin access token |
| `POST` | `/api/admin/logout` | Clear the admin refresh-token cookie |
| `GET` | `/api/admin/dashboard` | Verify access to the admin dashboard (**Protected**) |
| `POST` | `/api/upload` | Upload an image to Cloudinary (**Protected**) |

## Related applications

The API serves the [Poodiest frontend](../frontend/README.md) and the admin app in this repository. Set each app's API URL and include its origin in `CORS_ORIGIN`.
