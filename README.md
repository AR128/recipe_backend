# Poodiest Backend API

The REST API for **Poodiest**, a recipe-sharing application. Built with Node.js, Express 5, and MongoDB, the API supports recipe discovery and publishing, user accounts, comments, saved recipes, likes, and image uploads.

## Features

- Firebase ID-token authentication for users and admins
- Admin access is restricted to a configured, verified Google account
- Firebase user profiles are linked to MongoDB records by Firebase UID
- Usernames are protected by a unique, case-insensitive MongoDB index; generated usernames use four deterministic digits derived from the Google email address
- Full names are stored separately from usernames and may be shared by multiple users
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

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FIREBASE_PROJECT_ID=your_firebase_project_id
ADMIN_EMAIL=approved.admin@example.com

# Firebase Admin server credentials (required for revocation-aware checks)
# Alternatively, use the local service-account JSON file:
FIREBASE_SERVICE_ACCOUNT_PATH=./poodiest-firebase-adminsdk-fbsvc-3f0cbc6901.json
```

Use your actual MongoDB connection string and Cloudinary credentials. `CORS_ORIGIN` is a comma-separated list of allowed frontend origins; include the development URLs for the apps you use. Keep `.env` private and do not commit secrets.
Set `FIREBASE_PROJECT_ID` to the same Firebase project used by both frontends.
The server uses Firebase Admin service-account credentials for revocation-aware
token checks. For local development, set `FIREBASE_SERVICE_ACCOUNT_PATH` to the
service-account JSON path relative to the backend working directory. In
production, either set both `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`,
or provide the complete service-account JSON in
`FIREBASE_SERVICE_ACCOUNT_JSON` through the hosting provider's secret settings.
Keep credentials server-side; never put them in frontend `VITE_*` variables or
commit the JSON key file. When using separate variables, encode private-key
newlines as `\n`. Enable Google as the only sign-in provider in Firebase
Authentication and set `ADMIN_EMAIL` to the Google account allowed to use the
admin portal.

`ADMIN_EMAIL` is the admin allowlist; an account must sign in through Google
with that verified email address.

### Render deployment

Set the Render service root directory to `backend`, use `npm ci` for the
build command and `npm start` for the start command. Configure `MONGODB_URI`,
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`FIREBASE_PROJECT_ID`, `ADMIN_EMAIL`, `CORS_ORIGIN`, and the Firebase Admin
credentials in Render's environment settings. Do not rely on the ignored local
service-account JSON file being present in the deployed service; provide
`FIREBASE_SERVICE_ACCOUNT_JSON` or both `FIREBASE_CLIENT_EMAIL` and
`FIREBASE_PRIVATE_KEY` as secrets. Set `CORS_ORIGIN` to the exact Vercel site
origin(s), including any preview origin that should be allowed. Configure
`TRUST_PROXY=1` only when the Render request path has exactly one trusted
proxy hop.

### Security and resource limits

- In production, `CORS_ORIGIN` must list the exact allowed frontend origins;
  wildcard origins are rejected. CORS is not an authentication mechanism.
- The API uses an in-process token bucket before request-body parsing: each IP
  gets a burst capacity of 300 requests and refills at 5 requests per second.
  Public content routes additionally allow a burst of 240 and refill at 4
  requests per second. Search has a burst of 10 and refills at 0.5 requests
  per second; comment reads allow 30 and refill at 1 request per second.
  Authenticated writes allow 12 per user and refill at 0.5 per second;
  comment creation allows a burst of 2 and refills at 1 comment per 12
  seconds. Uploads are limited to 6 per IP per 10 minutes and 3 per user per
  20 minutes. These are per-process limits, not shared across multiple
  instances; use a shared limiter store or enforce equivalent limits at the
  gateway when running more than one API instance.
- `express.json()` defaults to 128 KiB. Upload requests use a route-specific
  7 MiB JSON limit, and Firebase authentication plus upload rate limits run
  before that parser. The upload endpoint accepts base64 JPEG, PNG, and WebP
  image data only, with a 5 MiB decoded/processed size ceiling, 8,192-pixel
  maximum dimension, and 20-megapixel maximum area. Recipe image references
  may be external URLs, but must use HTTPS.
- List endpoints default to 20 results per page and cap page size at 50;
  page numbers are bounded to 1,000. Search terms are length-limited and
  escaped so user input is treated literally. Writes reject unknown fields
  and validate field types, lengths, and collection sizes server-side.
- Responses include a request ID. API errors log diagnostic details on the
  server and return sanitized messages to clients.

If the API is behind a reverse proxy or load balancer, set `TRUST_PROXY` to
the exact positive number of trusted proxy hops (for example, `1` for one
known proxy). Do not set it to a broad trust value when clients can reach the
API directly, since the IP-based limits rely on Express's resolved client IP.
Terminate HTTPS at a trusted edge and configure security headers there for
the separately hosted frontend as well.

## Available commands

| Command          | Description                                 |
| ---------------- | ------------------------------------------- |
| `npm run dev`    | Start the API server                        |
| `npm start`      | Start the API server                        |
| `npm run seed`   | Add the sample recipes defined in `seed.js` |
| `npm run format` | Format backend files with Prettier          |
| `npm run check`  | Check backend formatting with Prettier      |

## API reference

All application endpoints are prefixed with `/api`. Protected routes require a
valid Firebase ID token in `Authorization: Bearer <Firebase ID token>`.

### Health

| Method | Endpoint  | Description              |
| ------ | --------- | ------------------------ |
| `GET`  | `/health` | Return API health status |

### Users (`/api/user`)

All protected user and recipe routes require `Authorization: Bearer <Firebase ID token>`.
The first authenticated request creates or links the user's MongoDB profile.
Usernames are unique regardless of capitalization, may contain 2–24 letters,
numbers, or underscores without spaces, and are checked with the same collation
as the unique index. New usernames use four digits derived from the user's
Google email address to distinguish users with the same name. Full names are
initialized from the Google profile and can be shared. MongoDB creates the username index before the API starts; resolve any
existing case-insensitive duplicate usernames before deploying this index.

| Method | Endpoint                   | Description                                                    |
| ------ | -------------------------- | -------------------------------------------------------------- |
| `GET`  | `/search`                  | Search community bloggers (limited featured preview is public) |
| `GET`  | `/public/:username`        | Get a user profile (**Protected**)                             |
| `GET`  | `/profile`                 | Get or provision the current user's profile (**Protected**)    |
| `PUT`  | `/profile`                 | Update the current user's profile (**Protected**)              |
| `GET`  | `/my-posts`                | Get the current user's recipes (**Protected**)                 |
| `GET`  | `/commented-posts`         | Get recipes commented on by the current user (**Protected**)   |
| `GET`  | `/saved-recipes`           | Get the current user's saved recipes (**Protected**)           |
| `POST` | `/saved-recipes/:idOrSlug` | Toggle a saved recipe (**Protected**)                          |
| `GET`  | `/dashboard`               | Verify access to the user dashboard (**Protected**)            |

### Recipes (`/api/recipes`)

| Method   | Endpoint          | Description                                                                  |
| -------- | ----------------- | ---------------------------------------------------------------------------- |
| `GET`    | `/`               | List published recipes; supports search and category filters (**Protected**) |
| `GET`    | `/trending`       | List trending recipes                                                        |
| `GET`    | `/categories`     | List recipe categories                                                       |
| `GET`    | `/:slug`          | Get a recipe by slug                                                         |
| `GET`    | `/:slug/comments` | List recipe comments                                                         |
| `POST`   | `/`               | Create a recipe (**Protected**)                                              |
| `PUT`    | `/:id`            | Update a recipe (**Protected**)                                              |
| `DELETE` | `/:id`            | Delete a recipe (**Protected**)                                              |
| `POST`   | `/:slug/comments` | Add a comment (**Protected**)                                                |
| `POST`   | `/:slug/likes`    | Toggle a recipe like (**Protected**)                                         |

### Admin (`/api/admin`) and uploads (`/api/upload`)

| Method | Endpoint               | Description                                        |
| ------ | ---------------------- | -------------------------------------------------- |
| `GET`  | `/api/admin/dashboard` | Verify Firebase identity and admin email allowlist |
| `POST` | `/api/upload`          | Upload an image to Cloudinary (**Protected**)      |

## Related applications

The API serves the [Poodiest frontend](../frontend/README.md) and the admin app in this repository. Set each app's API URL and include its origin in `CORS_ORIGIN`.
