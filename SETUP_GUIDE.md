# Setup Guide (Hinglish/English)

Follow these steps to run the application on your machine.

## Prerequisites
1. **Node.js**: Make sure you have Node.js installed (Version 18 or higher recommended).
2. **Git**: (Optional) useful if you want to run git commands, but not strictly required for unzip.

## Step 1: Unzip and Install Dependencies
1. Unzip the folder.
2. Open your terminal (Command Prompt or Terminal) in the unzipped folder.
3. Run this command to install all dependencies for backend and frontend:
   ```bash
   npm run install:all
   ```

## Step 2: Backend Setup (Environment Variables)
1. Go to the `backend` folder: `cd backend`
2. Create a new file named `.env` and paste the following content (You can replace dummy values with real keys if you have them, otherwise some features like Upload/Payment might fail, but the app will run):

   ```env
   # Core Config
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   
   # Database (SQLite)
   # Note: We are using SQLite so no external DB setup is needed.
   # The database file will be created at backend/prisma/dev.db
   
   # Auth Secrets (Change these if you want)
   JWT_SECRET="any-secret-string-xyz"
   JWT_EXPIRES_IN="7d"
   
   # Optional Services (Leave as is for basic run, change for real functionality)
   ENABLE_SCHEDULER="false"
   
   # AWS S3 (Required for Video Uploads)
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="test"
   AWS_SECRET_ACCESS_KEY="test"
   AWS_S3_BUCKET="test-bucket"
   
   # Payments (Required for Payment Features)
   RAZORPAY_KEY_ID="test"
   RAZORPAY_KEY_SECRET="test"
   RAZORPAY_WEBHOOK_SECRET="test"
   STRIPE_SECRET_KEY="test"
   STRIPE_WEBHOOK_SECRET="test"
   ```

## Step 3: Database Setup
Still in the `backend` folder, run these commands to initialize the SQLite database:
```bash
npx prisma generate
npx prisma db push
```
*(This creates the `dev.db` file based on the schema)*

## Step 4: Frontend Setup
1. Go to the `frontend` folder: `cd ../frontend`
2. Create a new file named `.env.local` and paste this:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

## Step 5: Run the Project
1. Go back to the main root folder: `cd ..`
2. Run the project:
   ```bash
   npm run dev
   ```

The application should start!
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

## Troubleshooting
- If you see database errors, delete `backend/prisma/dev.db` and run `npx prisma db push` again.
- If images/videos don't load, it's likely because AWS S3 credentials are missing in `.env`.
