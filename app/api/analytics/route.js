import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import Quiz from '@/app/models/QuizSchema';
import UserProfile from '@/app/models/UserProfileSchema';

export async function GET(request) {
  await connectToDB();

  try {
    const { searchParams } = request.nextUrl;
    const timeRange = searchParams.get('timeRange') || '7d';
    const quizId = searchParams.get('quizId') || 'all';

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    const query = {
      createdAt: { $gte: startDate }
    };

    if (quizId !== 'all') {
      query._id = quizId;
    }

    // Fetch quizzes
    const quizzes = await Quiz.find(query).select('quizTitle category metadata');

    // Mock analytics data (in a real app, you'd calculate this from actual quiz attempts)
    const analytics = {
      // Key metrics
      totalAttempts: Math.floor(Math.random() * 1000) + 100,
      averageScore: Math.floor(Math.random() * 30) + 60,
      passRate: Math.floor(Math.random() * 20) + 70,
      averageTime: Math.floor(Math.random() * 20) + 15,

      // Changes from previous period
      attemptsChange: Math.floor(Math.random() * 40) - 20,
      scoreChange: Math.floor(Math.random() * 20) - 10,
      passRateChange: Math.floor(Math.random() * 15) - 7,
      timeChange: Math.floor(Math.random() * 10) - 5,

      // Score distribution
      scoreDistribution: [
        { range: '0-20%', count: Math.floor(Math.random() * 50) + 10 },
        { range: '21-40%', count: Math.floor(Math.random() * 80) + 20 },
        { range: '41-60%', count: Math.floor(Math.random() * 120) + 40 },
        { range: '61-80%', count: Math.floor(Math.random() * 150) + 80 },
        { range: '81-100%', count: Math.floor(Math.random() * 100) + 60 },
      ],

      // Performance over time (last 7 days)
      performanceOverTime: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.floor(Math.random() * 40) + 60,
        };
      }),

      // Quiz performance
      quizPerformance: quizzes.map(quiz => ({
        quizTitle: quiz.quizTitle,
        category: quiz.category,
        attempts: Math.floor(Math.random() * 200) + 20,
        averageScore: Math.floor(Math.random() * 30) + 60,
        passRate: Math.floor(Math.random() * 20) + 70,
        averageTime: Math.floor(Math.random() * 20) + 15,
      })),

      // Top performers
      topPerformers: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          quizzesTaken: Math.floor(Math.random() * 20) + 5,
          averageScore: Math.floor(Math.random() * 20) + 80,
          bestScore: Math.floor(Math.random() * 10) + 90,
          totalTime: Math.floor(Math.random() * 300) + 100,
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          quizzesTaken: Math.floor(Math.random() * 20) + 5,
          averageScore: Math.floor(Math.random() * 20) + 80,
          bestScore: Math.floor(Math.random() * 10) + 90,
          totalTime: Math.floor(Math.random() * 300) + 100,
        },
        {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          quizzesTaken: Math.floor(Math.random() * 20) + 5,
          averageScore: Math.floor(Math.random() * 20) + 80,
          bestScore: Math.floor(Math.random() * 10) + 90,
          totalTime: Math.floor(Math.random() * 300) + 100,
        },
        {
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          quizzesTaken: Math.floor(Math.random() * 20) + 5,
          averageScore: Math.floor(Math.random() * 20) + 80,
          bestScore: Math.floor(Math.random() * 10) + 90,
          totalTime: Math.floor(Math.random() * 300) + 100,
        },
        {
          name: 'David Brown',
          email: 'david@example.com',
          quizzesTaken: Math.floor(Math.random() * 20) + 5,
          averageScore: Math.floor(Math.random() * 20) + 80,
          bestScore: Math.floor(Math.random() * 10) + 90,
          totalTime: Math.floor(Math.random() * 300) + 100,
        },
      ],

      // Available quizzes for filter
      quizzes: quizzes,
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 