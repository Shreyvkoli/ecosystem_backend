# Video Editing Marketplace - Monorepo Structure

```
ecosystem/
├── .gitignore
├── package.json                    # Root package.json for dev scripts
├── README.md                       # Main documentation
│
├── backend/                        # Express + Prisma Backend
│   ├── .env.example               # Backend environment variables template
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (User, Project, Video, Comment, Payment)
│   │
│   └── src/
│       ├── server.ts              # Express server entry point
│       │
│       ├── middleware/
│       │   └── auth.ts            # JWT authentication middleware
│       │
│       └── routes/
│           ├── auth.ts            # POST /register, /login, GET /me
│           ├── projects.ts        # Project CRUD, assignment, status updates
│           ├── videos.ts          # S3 presigned URLs, upload completion
│           ├── comments.ts        # Comment CRUD with timestamps
│           └── payments.ts        # Razorpay order creation, verification, release
│
└── frontend/                       # Next.js 14 App Router Frontend
    ├── .env.example               # Frontend environment variables template
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    │
    ├── app/                        # Next.js App Router
    │   ├── layout.tsx             # Root layout with providers
    │   ├── page.tsx               # Home page (redirects to login/dashboard)
    │   ├── globals.css            # Global styles + Tailwind
    │   ├── providers.tsx          # React Query provider
    │   │
    │   ├── login/
    │   │   └── page.tsx           # Login page
    │   │
    │   ├── register/
    │   │   └── page.tsx           # Registration page
    │   │
    │   ├── dashboard/
    │   │   └── page.tsx           # Project list dashboard
    │   │
    │   └── projects/
    │       ├── new/
    │       │   └── page.tsx       # Create new project
    │       └── [id]/
    │           └── page.tsx       # Project detail with video review
    │
    ├── components/                 # React components
    │   ├── Navbar.tsx             # Navigation bar
    │   ├── VideoUploader.tsx      # S3 direct upload component
    │   ├── VideoPlayer.tsx        # Video player with timestamp comments
    │   └── PaymentButton.tsx      # Razorpay payment button
    │
    └── lib/                        # Utilities & API client
        ├── api.ts                 # Axios client + API functions
        └── auth.ts                # Auth token management (localStorage/cookies)
```

## Environment Files

### backend/.env.example
```env
DATABASE_URL="postgresql://user:password@localhost:5432/video_marketplace"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001

AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

FRONTEND_URL="http://localhost:3000"
```

### frontend/.env.example
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Setup Commands

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

## Key Files by Function

### Database & Models
- `backend/prisma/schema.prisma` - All database models

### Authentication
- `backend/src/routes/auth.ts` - Register/login endpoints
- `backend/src/middleware/auth.ts` - JWT verification
- `frontend/lib/auth.ts` - Token management
- `frontend/app/login/page.tsx` - Login UI
- `frontend/app/register/page.tsx` - Register UI

### Projects
- `backend/src/routes/projects.ts` - Project API
- `frontend/app/dashboard/page.tsx` - Project list
- `frontend/app/projects/new/page.tsx` - Create project
- `frontend/app/projects/[id]/page.tsx` - Project detail

### Video Upload & Review
- `backend/src/routes/videos.ts` - S3 presigned URLs
- `frontend/components/VideoUploader.tsx` - Upload UI
- `frontend/components/VideoPlayer.tsx` - Playback + comments

### Comments
- `backend/src/routes/comments.ts` - Comment API
- `frontend/components/VideoPlayer.tsx` - Comment UI

### Payments
- `backend/src/routes/payments.ts` - Razorpay integration
- `frontend/components/PaymentButton.tsx` - Payment UI

