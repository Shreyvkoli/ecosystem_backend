# Video Editing Marketplace MVP

A two-sided marketplace connecting video creators with professional editors. This MVP includes core workflows for project management, video upload/review, timestamp-based comments, and payment processing.

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- React Player

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- AWS S3 (for video storage)
- Razorpay (payments)
- JWT authentication

## Project Structure

```
ecosystem/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth middleware
│   │   └── server.ts           # Express server
│   └── package.json
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/                    # API client & utilities
│   └── package.json
└── package.json                # Root package.json for dev scripts
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- AWS account with S3 bucket
- Razorpay account (for payments)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the `backend` directory:

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
```

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### Run Both Together

From the root directory:
```bash
# Install all dependencies first
npm run install:all

# Then run both frontend and backend
npm run dev
```

## Key Features

### Authentication
- Email/password registration and login
- JWT-based session management
- Role-based access (CREATOR / EDITOR)

### Project Workflow

1. **Creator creates project** with title, description, brief, and budget
2. **Creator uploads raw video** (5-80GB supported via S3 presigned URLs)
3. **Creator assigns editor** (manual assignment in MVP)
4. **Editor uploads preview** version
5. **Creator reviews** with timestamp-based comments
6. **Creator approves** or requests revision
7. **Editor uploads final** video
8. **Creator releases payment** (manual release in MVP)

### Video Upload
- Direct upload to S3 using presigned URLs
- Supports large files (5-80GB)
- Progress tracking
- Secure file access (no public URLs)

### Video Review
- In-browser video playback
- Timestamp-based comments
- Real-time comment updates (polling)
- Visual annotations support

### Payments
- Razorpay integration
- Order creation and verification
- Manual payment release workflow
- Payment status tracking

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (CREATOR only)
- `PATCH /api/projects/:id/assign` - Assign editor (CREATOR only)
- `PATCH /api/projects/:id/status` - Update project status

### Videos
- `POST /api/videos/upload-url` - Get presigned upload URL
- `POST /api/videos/:id/complete` - Mark upload as complete
- `GET /api/videos/:id/view-url` - Get presigned view URL

### Comments
- `GET /api/comments/project/:projectId` - List project comments
- `POST /api/comments` - Create comment
- `PATCH /api/comments/:id` - Update comment

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/:paymentId/release` - Release payment (manual)
- `GET /api/payments/project/:projectId` - List project payments

## Database Schema

### Models
- **User**: Creators and editors with role-based access
- **Project**: Projects with status tracking
- **Video**: Raw, preview, and final videos with S3 references
- **Comment**: Timestamp-based comments on videos
- **Payment**: Payment records with Razorpay integration

## Development Notes

### MVP Constraints
- Simple workflows, minimal abstractions
- Basic polling for real-time updates (no WebSockets)
- Manual editor assignment
- Manual payment release
- No automatic YouTube export (future feature)

### Security
- JWT tokens stored in HTTP-only cookies (frontend uses localStorage for MVP)
- Presigned URLs expire after 1 hour
- Role-based route protection
- S3 bucket should not be publicly accessible

### Scaling Considerations
- S3 multipart uploads ready (basic implementation)
- Database indexes on frequently queried fields
- Polling can be replaced with WebSockets for production
- Consider CDN for video delivery

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### S3 Upload Issues
- Verify AWS credentials
- Check bucket permissions
- Ensure bucket exists in specified region

### Payment Issues
- Verify Razorpay keys
- Check Razorpay dashboard for test mode
- Ensure order amount is in correct currency

## License

MIT

