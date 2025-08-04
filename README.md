# Spark - KOL & Creator Marketplace Platform

A full-stack MVP connecting brands with creators through an innovative marketplace platform built with Next.js, Tailwind CSS, and Supabase.

## 🚀 Features

### ✅ **Core Functionality**
- **Beautiful Landing Page** - Complete homepage with hero, features, testimonials, FAQ
- **Role-Based Authentication** - Creator, Brand, and Admin user types with Google OAuth
- **Creator Dashboard** - Profile management, campaign discovery, application tracking
- **Brand Dashboard** - Campaign creation, application review, analytics
- **Campaign Management** - Full CRUD operations with filtering and search
- **Application System** - Creator applications with status tracking
- **File Upload** - Profile pictures and media kits via Supabase Storage
- **Responsive Design** - Mobile-first design with Tailwind CSS

### 🎨 **Design System**
- **Primary Color:** #6F47EB (Purple)
- **Secondary Color:** #F4F3FF (Light Purple)
- **Accent Color:** #FF6B6B (Coral)
- **Typography:** Montserrat (headings) + Inter (body)
- **Components:** shadcn/ui with custom styling

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth with Google OAuth
- **Storage:** Supabase Storage
- **Deployment:** Vercel-ready

## 📁 Project Structure

```
/app/
├── app/
│   ├── page.js                 # Homepage
│   ├── layout.js               # Root layout
│   ├── globals.css             # Global styles
│   ├── auth/                   # Authentication pages
│   │   ├── login/page.js
│   │   ├── signup/page.js
│   │   └── callback/page.js
│   ├── creator/                # Creator pages
│   │   ├── dashboard/page.js
│   │   └── campaigns/page.js
│   ├── brand/                  # Brand pages
│   │   ├── dashboard/page.js
│   │   └── campaigns/create/page.js
│   └── api/                    # API routes
│       └── setup-database/route.js
├── components/                 # React components
│   ├── AuthProvider.js
│   ├── ProtectedRoute.js
│   ├── Navigation.js
│   ├── Footer.js
│   ├── homepage/               # Homepage sections
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── supabase.js            # Supabase client & helpers
│   ├── utils.js               # Utility functions
│   └── database-setup.sql     # Database schema
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and yarn
- Supabase account and project

### 1. Clone and Install
```bash
git clone <your-repo>
cd spark-mvp
yarn install
```

### 2. Environment Setup
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/lib/database-setup.sql`
4. Run the SQL to create tables and policies

### 4. Google OAuth Setup (Optional)
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials

### 5. Run Development Server
```bash
yarn dev
```

Visit `http://localhost:3000`

## 📊 Database Schema

### Tables
- **profiles** - User profiles (creators, brands, admins)
- **campaigns** - Brand campaign listings
- **applications** - Creator applications to campaigns

### Key Features
- Row Level Security (RLS) policies
- User role-based access control
- File storage buckets for profiles and media kits
- Automatic timestamps and triggers

## 🔐 Authentication Flow

1. **Signup**: Users select Creator or Brand role
2. **Profile Creation**: Automatic profile creation in database
3. **Role-Based Routing**: Redirect to appropriate dashboard
4. **Protected Routes**: Middleware protects role-specific pages

## 🎯 User Journeys

### Creator Journey
1. Sign up as Creator
2. Complete profile setup
3. Browse available campaigns
4. Apply to campaigns with media kit
5. Track application status

### Brand Journey
1. Sign up as Brand  
2. Complete company profile
3. Create campaign briefs
4. Review creator applications
5. Manage ongoing campaigns

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Environment Variables for Production
Add these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🧪 Testing

The MVP includes comprehensive backend testing:

```bash
# Test Supabase integration
curl -X POST http://localhost:3000/api/setup-database
```

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Email notifications (SendGrid/Resend)
- [ ] Advanced analytics dashboard
- [ ] Creator portfolio builder
- [ ] Campaign performance metrics
- [ ] Payment integration (Stripe)
- [ ] Real-time messaging
- [ ] Admin panel enhancements
- [ ] Mobile app (React Native)

### Technical Improvements
- [ ] Unit and integration tests
- [ ] Performance optimization
- [ ] SEO enhancements
- [ ] PWA features
- [ ] Advanced caching

## 📄 License

MIT License - feel free to use this project as a starting point for your own marketplace!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💬 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js, Supabase, and Tailwind CSS**