# SuriReviews - Complete Review Platform

A production-ready Trustpilot-style review platform built with Next.js, PostgreSQL, and modern web technologies.

## 🚀 Live Demo
**URL**: https://trustloop-5.preview.emergentagent.com

## 📦 Quick Start

### Prerequisites
- Node.js 18+ and yarn
- PostgreSQL 12+

### Installation Steps

1. **Extract the ZIP file**
```bash
unzip trustreview-platform.zip
cd app
```

2. **Install dependencies**
```bash
yarn install
```

3. **Set up PostgreSQL database**
```bash
# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE trustpilot_db;
CREATE USER trustpilot_user WITH PASSWORD 'trustpilot_pass';
GRANT ALL PRIVILEGES ON DATABASE trustpilot_db TO trustpilot_user;
\c trustpilot_db
GRANT ALL ON SCHEMA public TO trustpilot_user;
ALTER USER trustpilot_user CREATEDB;
EOF
```

4. **Configure environment variables**

The `.env` file is already configured. Update if needed:
```env
DATABASE_URL="postgresql://trustpilot_user:trustpilot_pass@localhost:5432/trustpilot_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

5. **Run database migrations**
```bash
npx prisma generate
npx prisma migrate deploy
```

6. **Seed the database (optional but recommended)**
```bash
node prisma/seed.js
```

7. **Start the development server**
```bash
yarn dev
```

8. **Open your browser**
```
http://localhost:3000
```

## 👥 Demo Accounts (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| User | john@example.com | password123 |
| Business | business@example.com | business123 |

## ✨ Features

### Core Features
- ✅ **Authentication** - Password-based + Google OAuth ready
- ✅ **Role-Based Access** - USER, BUSINESS, ADMIN roles
- ✅ **Review System** - Submit, edit, delete reviews
- ✅ **Admin Moderation** - Approve/reject reviews
- ✅ **Business Dashboard** - Analytics and review management
- ✅ **Business Claiming** - Businesses can claim their profiles

### Advanced Features
- ✅ **Smart Search** - Autocomplete search with suggestions (like Trustpilot)
- ✅ **Advanced Filtering** - Sort by rating, newest, most reviews
- ✅ **Rating Filters** - Filter by minimum rating (4+, 3+, 2+)
- ✅ **Verification Badges** - Verified business indicators
- ✅ **CSV Export** - Export reviews for analysis
- ✅ **Business Replies** - Respond to customer reviews
- ✅ **Rating Distribution** - Visual rating breakdown

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Date**: date-fns

## 📁 Project Structure

```
app/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication
│   │   ├── businesses/        # Business endpoints
│   │   ├── reviews/           # Review endpoints
│   │   ├── admin/             # Admin endpoints
│   │   ├── dashboard/         # Dashboard endpoints
│   │   └── search/            # Search autocomplete
│   ├── admin/                 # Admin dashboard page
│   ├── companies/             # Companies listing
│   ├── company/[slug]/        # Business detail page
│   ├── dashboard/             # Business dashboard
│   ├── login/                 # Auth page
│   ├── profile/               # User profile
│   └── page.js                # Homepage
├── components/
│   ├── ui/                    # shadcn components
│   ├── header.jsx             # Navigation
│   ├── search-bar.jsx         # Autocomplete search
│   ├── star-rating.jsx        # Star ratings
│   └── rating-distribution.jsx
├── lib/
│   ├── auth.js                # Auth config
│   ├── prisma.js              # Database client
│   └── utils.js               # Utilities
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Seed data
├── .env                       # Environment variables
└── package.json               # Dependencies
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `GET /api/auth/session` - Get session

### Businesses
- `GET /api/businesses` - List businesses (with filters)
- `GET /api/businesses/[slug]` - Get business details
- `POST /api/businesses/[slug]/claim` - Claim business
- `GET /api/search?q={query}` - Search autocomplete

### Reviews
- `POST /api/reviews` - Submit review
- `GET /api/reviews` - Get reviews (filtered)
- `PATCH /api/reviews/[id]` - Update review
- `DELETE /api/reviews/[id]` - Delete review
- `POST /api/reviews/[id]/reply` - Reply to review

### Admin
- `GET /api/admin/stats` - Platform statistics
- `PATCH /api/admin/reviews/[id]/moderate` - Moderate review
- `PATCH /api/admin/businesses/[slug]/verify` - Verify business

### Business Dashboard
- `GET /api/dashboard/business` - Dashboard data
- `GET /api/dashboard/business/export` - Export reviews (CSV)

## 🎨 Features Walkthrough

### 1. Homepage Search
- Type 2+ characters to see suggestions
- Shows business logo, name, category, and verification status
- Click suggestion to go directly to business page
- "See all results" option for full search

### 2. Advanced Company Search
- Sort by: Newest, Highest Rated, Lowest Rated, Most Reviews
- Filter by minimum rating
- Category filters
- Real-time results count

### 3. Business Verification
- Verified businesses show blue checkmark badge
- Displayed on cards and detail pages
- Admin can verify via API endpoint

### 4. Export Reviews (Business Dashboard)
- Click "Export Reviews" button
- Downloads CSV with all approved reviews
- Includes: Date, Reviewer, Rating, Title, Content
- Date-stamped filename

### 5. Review Workflow
- User submits review → Status: PENDING
- Admin approves → Status: APPROVED (visible)
- Admin rejects → Status: REJECTED (hidden)
- Business can reply to approved reviews

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based session management
- Role-based access control
- SQL injection protection (Prisma)
- CSRF protection (NextAuth)
- Input validation and sanitization

## 📊 Database Schema

### Users
- Email/password authentication
- Roles: USER, BUSINESS, ADMIN
- Can claim one business (if BUSINESS)

### Businesses
- Name, slug, category, description
- Verified status (boolean)
- Can be claimed by business users
- Tracks average rating automatically

### Reviews
- 1-5 star rating + title + content
- Status: PENDING, APPROVED, REJECTED
- One review per user per business
- Can have business reply

### Replies
- Business responses to reviews
- One reply per review

## 🚀 Production Deployment

### Environment Variables
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-strong-random-secret"
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
```

### Build and Start
```bash
yarn build
yarn start
```

### Recommended Services
- **Database**: Supabase, Neon, Railway
- **Hosting**: Vercel, Netlify, Railway
- **Email**: Resend, SendGrid (for notifications)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## 📝 License

MIT License - Free for personal and commercial use

## 🙏 Credits

Built with:
- Next.js by Vercel
- Prisma ORM
- shadcn/ui components
- Tailwind CSS
- Lucide Icons

---

**Need Help?** Check the code comments or refer to:
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org
