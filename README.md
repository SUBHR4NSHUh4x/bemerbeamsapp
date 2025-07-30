# Quiz Spark - Interactive Learning Platform

A comprehensive quiz application built with Next.js, featuring authentication, admin and student panels, and interactive quiz creation and taking capabilities.

## Features

### 🔐 Authentication System
- **Clerk Integration**: Secure authentication with Clerk
- **User Profiles**: Custom user profiles with role-based access
- **Role Management**: Admin and Student roles with different permissions

### 👨‍🏫 Admin Panel
- **Quiz Creation**: Build custom quizzes with multiple question types (MCQ, Text, True/False, Fill-in-blank)
- **Bulk Upload**: Import questions from Excel/CSV files with validation
- **Analytics Dashboard**: Comprehensive insights and performance metrics
- **Student Management**: Track student progress and performance
- **Question Types**: MCQ, Text, True/False, Fill-in-blank with individual time limits
- **Advanced Quiz Settings**: Difficulty levels, passing scores, time limits, categories

### 👨‍🎓 Student Panel
- **Interactive Quiz Taking**: Modern, responsive quiz interface
- **Real-time Timer**: Countdown timer with auto-submission
- **Progress Tracking**: Visual progress indicators and navigation
- **Detailed Results**: Comprehensive result analysis with explanations
- **Performance Analytics**: Track improvement over time
- **Question Flagging**: Mark questions for review

### 🎨 Design & UX
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Yellow Theme**: Consistent yellow, white, and black color scheme
- **Interactive Elements**: Hover effects, transitions, and smooth animations
- **Mobile Responsive**: Works seamlessly on all device sizes

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Authentication**: Clerk
- **Database**: MongoDB with Mongoose
- **File Processing**: Excel/CSV import with xlsx library
- **Icons**: FontAwesome
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom color scheme
- **Real-time Features**: Auto-save, timers, progress tracking

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Clerk account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quiz-spark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   MONGO_URL=your_mongodb_connection_string
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
app/
├── Components/           # Reusable UI components
│   ├── UserProfileProvider.js  # User profile context
│   ├── Navbar.js        # Navigation component
│   └── ...
├── api/                 # API routes
│   ├── quizzes/         # Quiz CRUD operations
│   ├── user/           # User management
│   ├── user-profile/   # User profile management
│   ├── bulk-upload/    # Bulk upload functionality
│   └── analytics/      # Analytics data endpoints
├── models/             # MongoDB schemas
│   ├── QuizSchema.js
│   ├── UserSchema.js
│   └── UserProfileSchema.js
├── dashboard/          # Main dashboard page
├── quizzes/           # Student quiz browsing
├── manage-quizzes/    # Admin quiz management
├── analytics/         # Analytics dashboard
├── bulk-upload/       # Bulk upload interface
├── quiz-build/        # Quiz creation interface
├── quiz-start/        # Quiz taking interface
├── sign-in/          # Authentication pages
├── sign-up/
└── ...
```

## Key Features

### Authentication Flow
1. Users sign up/sign in through Clerk
2. User profiles are automatically created in the database
3. Role-based access control (Admin/Student)
4. Persistent authentication state

### Quiz System
- **Creation**: Admins can create quizzes with multiple question types
- **Bulk Upload**: Import questions from Excel/CSV files
- **Taking**: Students can browse and take quizzes with real-time timer
- **Scoring**: Automatic scoring and progress tracking
- **Analytics**: Detailed performance metrics and insights
- **Advanced Features**: Question flagging, detailed explanations, time tracking

### User Management
- **Profiles**: Extended user profiles with preferences
- **Roles**: Flexible role system for different user types
- **Statistics**: Track user engagement and performance

## API Endpoints

### Quizzes
- `GET /api/quizzes` - Fetch all quizzes
- `POST /api/quizzes` - Create new quiz
- `PUT /api/quizzes` - Update quiz
- `DELETE /api/quizzes` - Delete quiz

### User Profile
- `GET /api/user-profile` - Fetch user profile
- `POST /api/user-profile` - Create user profile
- `PUT /api/user-profile` - Update user profile

### Bulk Upload
- `POST /api/bulk-upload` - Upload Excel/CSV files with questions
- `GET /api/bulk-upload` - Get upload instructions and template

### Analytics
- `GET /api/analytics` - Fetch analytics data with filters

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS
   - DigitalOcean

3. **Set environment variables** in your deployment platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
