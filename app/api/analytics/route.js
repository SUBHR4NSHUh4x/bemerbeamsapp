import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import Quiz from '@/app/models/QuizSchema';
import QuizAttempt from '@/app/models/QuizAttemptSchema';

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
    const quizQuery = quizId !== 'all' ? { _id: quizId } : {};
    const attemptQuery = {
      ...(quizId !== 'all' ? { quizId } : {}),
      createdAt: { $gte: startDate },
    };

    // Fetch quizzes
    const quizzes = await Quiz.find(quizQuery).select('quizTitle category metadata');
    const attempts = await QuizAttempt.find(attemptQuery);

    // Key metrics
    const totalAttempts = attempts.length;
    const averageScore = attempts.length ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(2) : 0;
    const passRate = attempts.length ? (attempts.filter(a => a.passed).length / attempts.length * 100).toFixed(2) : 0;
    const averageTime = attempts.length ? (attempts.reduce((sum, a) => sum + a.duration, 0) / attempts.length / 60).toFixed(2) : 0;

    // Score distribution
    const scoreDistribution = [
      { range: '0-20%', count: attempts.filter(a => a.score <= 20).length },
      { range: '21-40%', count: attempts.filter(a => a.score > 20 && a.score <= 40).length },
      { range: '41-60%', count: attempts.filter(a => a.score > 40 && a.score <= 60).length },
      { range: '61-80%', count: attempts.filter(a => a.score > 60 && a.score <= 80).length },
      { range: '81-100%', count: attempts.filter(a => a.score > 80).length },
    ];

    // Performance over time (last 7 days)
    const performanceOverTime = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayAttempts = attempts.filter(a => {
        const d = new Date(a.createdAt);
        return d.toDateString() === date.toDateString();
      });
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: dayAttempts.length ? (dayAttempts.reduce((sum, a) => sum + a.score, 0) / dayAttempts.length).toFixed(2) : 0,
      };
    });

    // Quiz performance
    const quizPerformance = quizzes.map(quiz => {
      const quizAttempts = attempts.filter(a => a.quizId.toString() === quiz._id.toString());
      return {
        quizTitle: quiz.quizTitle,
        category: quiz.category,
        attempts: quizAttempts.length,
        averageScore: quizAttempts.length ? (quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length).toFixed(2) : 0,
        passRate: quizAttempts.length ? (quizAttempts.filter(a => a.passed).length / quizAttempts.length * 100).toFixed(2) : 0,
        averageTime: quizAttempts.length ? (quizAttempts.reduce((sum, a) => sum + a.duration, 0) / quizAttempts.length / 60).toFixed(2) : 0,
        _id: quiz._id,
      };
    });

    // Top performers
    const userStats = {};
    attempts.forEach(a => {
      if (!userStats[a.userEmail]) {
        userStats[a.userEmail] = {
          name: a.userName,
          email: a.userEmail,
          quizzesTaken: 0,
          averageScore: 0,
          bestScore: 0,
          totalTime: 0,
        };
      }
      userStats[a.userEmail].quizzesTaken += 1;
      userStats[a.userEmail].averageScore += a.score;
      userStats[a.userEmail].bestScore = Math.max(userStats[a.userEmail].bestScore, a.score);
      userStats[a.userEmail].totalTime += a.duration;
    });
    const topPerformers = Object.values(userStats).map(u => ({
      ...u,
      averageScore: (u.averageScore / u.quizzesTaken).toFixed(2),
    })).sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);

    // Compose analytics object
    const analytics = {
      totalAttempts: totalAttempts,
      averageScore: averageScore,
      passRate: passRate,
      averageTime: averageTime,
      attemptsChange: 0, // Not implemented
      scoreChange: 0, // Not implemented
      passRateChange: 0, // Not implemented
      timeChange: 0, // Not implemented
      scoreDistribution,
      performanceOverTime,
      quizPerformance,
      topPerformers,
      quizzes,
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