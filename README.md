# Urbancart E-Commerce Platform

A full-stack e-commerce website with React + Vite frontend, Express + MongoDB backend, JWT auth, product catalog, cart, wishlist, checkout, payments, and admin management.

## Features

- Home page with hero, featured, trending, recommended, and category sections
- Product browsing with search, filter, sort, and pagination-style listing
- Product details with image gallery, reviews, stock, price, and related products
- Cart and wishlist persistence through backend APIs
- User authentication and profile management
- Checkout flow with shipping address, coupon, delivery summary, and payment processing
- Admin dashboard with product, order, user, and coupon management
- Razorpay integration supported with sandbox/test mode when credentials are unavailable
- MongoDB models for users, products, cart, wishlist, orders, reviews, coupons, addresses, categories, and brands

## Requirements

- Node.js 18+
- npm (included with Node.js)
- MongoDB instance or MongoDB Atlas connection string
- Optional: Razorpay account for real payments
- Optional: Cloudinary account for image upload management

## Installation

1. Clone the repository and open a terminal in its root.
2. Install the root, client, and server dependencies together:

   ```bash
   npm install
   ```

   In Windows PowerShell environments that block `npm.ps1`, use `npm.cmd install` instead; use `npm.cmd` in place of `npm` for the commands below as well.

## Environment variables

Copy `.env.example` to `.env` in the project root, then set the required values. In PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env`. Set `MONGO_URI` to a MongoDB connection string for persistent data, `JWT_SECRET` to a unique random value, and `ADMIN_EMAIL` plus `ADMIN_PASSWORD` before running the seed command. The JWT secret and admin password must not be shared or committed. Without `MONGO_URI`, the backend uses its development-only in-memory MongoDB.

`VITE_API_URL` is the public API base URL used by the frontend. It defaults to `http://localhost:5000/api` for local development; set it in the frontend host's build environment to the deployed backend URL. For a local override, use `client/.env.local`. `CLIENT_URL` is the frontend origin allowed by the backend, without a trailing slash. Razorpay and Cloudinary variables are optional unless enabling those integrations.

## MongoDB setup

- Local MongoDB: install MongoDB Community Edition and run mongod
- Or use MongoDB Atlas and set `MONGO_URI` to your Atlas connection string

## Database setup

Seed the database with sample data and the admin account configured above:

```bash
npm run seed
```

This resets the configured database and creates:

- categories
- brands
- demo products
- coupons
- admin account

## Running the app

Start backend:

```bash
npm run server
```

Start frontend:

```bash
npm run client
```

Or install once and run both together:

```bash
npm run dev
```

## Razorpay test setup

If you want real Razorpay integration:

1. Create a Razorpay account.
2. Get your Key ID and Key Secret.
3. Add them to `.env`.
4. The payment route verifies the signature server-side before confirming payment.

If keys are not provided, the app runs in TEST mode for local development. This creates a simulated successful payment flow without exposing real secrets.

## Cloudinary setup

To enable real image uploads:

1. Create a Cloudinary account.
2. Add cloud name, API key, and secret to `.env`.
3. Upload routes use Cloudinary-compatible architecture. When credentials are absent, the app falls back to demo image URLs.

## Testing

Use the app UI to test:

1. Register a new customer account
2. Log in
3. Browse home page, category pages, and search
4. Open a product and add to wishlist/cart
5. Change quantity in cart
6. Start checkout and test payment
7. Confirm an order
8. Log in as admin
9. Add or edit a product
10. Update order status

## Troubleshooting

- If MongoDB connection fails, verify `MONGO_URI` and ensure the DB is reachable.
- If the frontend cannot reach the API, confirm `CLIENT_URL` and server port.
- If JWT auth fails, ensure `JWT_SECRET` is set and consistent.
- If build fails, delete `node_modules` and reinstall dependencies.

## Deployment instructions

This project requires a Node.js backend, so GitHub Pages is not suitable for the complete application. Uploading the source to GitHub is separate from deploying the frontend and backend.

- **Database:** Create a MongoDB Atlas database and use its connection string for `MONGO_URI`. The in-memory development database is not persistent and is not suitable for production.
- **Backend on Render:** Create a Web Service connected to this GitHub repository. Leave the Root Directory at the repository root, use `npm ci` as the Build Command and `npm run server` as the Start Command, and set `/api/health` as the Health Check Path. Configure `NODE_ENV=production`, `MONGO_URI`, a unique `JWT_SECRET`, and `CLIENT_URL` to the exact deployed frontend origin (no trailing slash). Add Razorpay or Cloudinary variables only when using those services. Render supplies `PORT`.
- **Frontend on Vercel:** Import the same repository as a separate Vercel project and set Root Directory to `client`, Framework Preset to Vite, Build Command to `npm run build`, and Output Directory to `dist`. Set `VITE_API_URL` to the full backend API URL, such as `https://your-api-host.example.com/api`. The included `client/vercel.json` rewrites nested React Router URLs to the app entry point.
- After deployment, confirm the backend health URL returns JSON, then test frontend registration/login and an API-backed catalog page. The production `CLIENT_URL` must match the frontend's origin exactly.

## GitHub source upload

Upload the project root contents through Git, not by uploading a ZIP that contains generated files. Keep the root and nested package manifests and lockfiles, app source, `.gitignore`, `.env.example`, `README.md`, and `client/vercel.json`. Do not upload `.env`, any `node_modules/`, build output (`dist/` or `build/`), or local upload data.

Create an empty GitHub repository first, install Git, then run these commands from the project root. Replace `YOUR-USERNAME` and `YOUR-REPOSITORY` in the remote URL:

```bash
git init
git check-ignore -v .env node_modules client/node_modules server/node_modules
git status --short
git add .
git commit -m "Prepare Urbancart for GitHub"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If a secret file was committed previously, ignoring it does not remove it from Git history; rotate its credentials and remove it from tracking.

## License

This project is for educational and local-development use.
