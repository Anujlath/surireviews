# Surireviews - Review Platform

A Trustpilot-style public review platform built with Next.js, featuring role-based access control, business profiles, and admin moderation.

## Features

### Authentication
- **Email + Password authentication** using NextAuth.js
- **Google OAuth** (placeholder for future integration)
- **Role-based access control** (USER, BUSINESS, ADMIN)

### User Features
- Browse and search businesses
- Filter by category
- View business profiles with ratings
- Submit reviews (1-5 stars with title and content)
- Edit/delete own pending reviews
- One review per user per business

### Business Features
- Claim business profiles
- View business dashboard
- See analytics (average rating, total reviews, rating distribution)
- Reply to customer reviews
- View public business profile

### Admin Features
- Admin dashboard with platform statistics
- View all pending reviews
- Approve or reject reviews
- Moderate content before it goes public

### Public Features
- Homepage with featured businesses
- Business listing page with search and filters
- SEO-friendly business detail pages
- Rating distribution visualization
- Latest approved reviews

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Database Schema

### User
- Email/password authentication
- Role (USER, BUSINESS, ADMIN)
- Can claim one business (if BUSINESS role)

### Business
- Name, slug, website, category, description, logo
- Can be claimed by a business user
- Has many reviews

### Review
- Rating (1-5), title, content
- Status: PENDING, APPROVED, REJECTED
- Belongs to business and user
- Can have one reply from business

### Reply
- Business response to a review
- Belongs to review and business

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- yarn

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables in `.env`:
```env
DATABASE_URL="postgresql://trustpilot_user:trustpilot_pass@localhost:5432/trustpilot_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

4. Seed the database:
```bash
node prisma/seed.js
```

5. Start the development server:
```bash
yarn dev
```

## Demo Accounts

After seeding, you can log in with:

**Admin Account:**
- Email: admin@example.com
- Password: admin123

**Regular User:**
- Email: john@example.com
- Password: password123

**Business Owner:**
- Email: business@example.com
- Password: business123

## Pages

- `/` - Homepage with featured businesses
- `/companies` - Business listing with search/filter
- `/company/[slug]` - Business detail page
- `/login` - Login/signup page
- `/admin` - Admin dashboard (ADMIN only)
- `/dashboard` - Business dashboard (BUSINESS only)
- `/profile` - User profile

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Login
- `GET /api/auth/session` - Get current session

### Businesses
- `GET /api/businesses` - List all businesses
- `GET /api/businesses/[slug]` - Get business details
- `POST /api/businesses/[slug]/claim` - Claim business (BUSINESS only)

### Reviews
- `GET /api/reviews` - List reviews (with filters)
- `POST /api/reviews` - Submit review (authenticated)
- `PATCH /api/reviews/[id]` - Update review (own pending reviews)
- `DELETE /api/reviews/[id]` - Delete review (own pending reviews)
- `POST /api/reviews/[id]/reply` - Reply to review (business owner)

### Admin
- `GET /api/admin/stats` - Platform statistics (ADMIN only)
- `PATCH /api/admin/reviews/[id]/moderate` - Approve/reject review (ADMIN only)

### Business Dashboard
- `GET /api/dashboard/business` - Get business dashboard data (BUSINESS only)

## Key Features Implementation

### Review Moderation
- All reviews start with PENDING status
- Admin must approve before they appear publicly
- Users can edit/delete their PENDING reviews
- Once approved/rejected, users cannot modify

### One Review Per User Per Business
- Database constraint enforces unique (businessId, userId)
- API validates before creating review

### Business Claiming
- Only BUSINESS role users can claim
- One business per user
- Once claimed, business can reply to reviews

### Role-Based Access
- Middleware checks user role for protected routes
- API endpoints validate permissions
- UI conditionally renders based on user role

## Project Structure

```
/app
├── app/
│   ├── api/                    # API routes
│   ├── admin/                  # Admin dashboard
│   ├── companies/              # Business listing
│   ├── company/[slug]/         # Business detail
│   ├── dashboard/              # Business dashboard
│   ├── login/                  # Auth page
│   ├── profile/                # User profile
│   ├── layout.js               # Root layout
│   └── page.js                 # Homepage
├── components/
│   ├── ui/                     # shadcn components
│   ├── header.jsx              # Navigation
│   ├── star-rating.jsx         # Star rating component
│   └── rating-distribution.jsx # Rating charts
├── lib/
│   ├── auth.js                 # Auth configuration
│   ├── prisma.js               # Prisma client
│   └── utils.js                # Utilities
└── prisma/
    ├── schema.prisma           # Database schema
    └── seed.js                 # Seed data

## Development Notes

- Hot reload enabled for fast development
- PostgreSQL runs locally
- NextAuth handles session management
- Server Components used where possible for better performance
- Client Components used for interactive features

## Production Considerations

1. **Security**:
   - Change NEXTAUTH_SECRET to strong random value
   - Use environment variables for all secrets
   - Enable HTTPS in production
   - Add rate limiting for API routes

2. **Database**:
   - Use managed PostgreSQL service (e.g., Supabase, Neon)
   - Enable connection pooling
   - Add database indexes for performance

3. **Google OAuth**:
   - Set up Google Cloud Console project
   - Add OAuth credentials
   - Configure callback URLs

4. **Performance**:
   - Enable ISR for business pages
   - Add caching for API responses
   - Optimize images with Next.js Image
   - Add CDN for static assets

## License

MIT
