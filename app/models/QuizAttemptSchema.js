import mongoose, { Schema } from 'mongoose';

const answerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, required: false }, // Made optional
  questionText: { type: String, required: true },
  studentAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  points: { type: Number, required: true },
  timeSpent: { type: Number, default: 0 },
  isCorrect: { type: Boolean, required: true },
});

const quizAttemptSchema = new Schema({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userId: { type: String, required: true }, // Clerk user ID or email
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  storeName: { type: String, default: '' }, // Store name for employee identification
  score: { 
    type: Number, 
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100'],
    default: 0, // Add default value
    validate: {
      validator: function(v) {
        // More lenient validation for Vercel
        if (v === null || v === undefined) return false;
        const num = Number(v);
        return !isNaN(num) && isFinite(num) && num >= 0 && num <= 100;
      },
      message: 'Score must be a valid number between 0 and 100'
    }
  },
  passed: { type: Boolean, required: true, default: false },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
  answers: [answerSchema],
}, { timestamps: true });

// Simplified pre-save middleware for Vercel compatibility
quizAttemptSchema.pre('save', function(next) {
  console.log('Saving quiz attempt:', {
    quizId: this.quizId,
    userName: this.userName,
    score: this.score,
    scoreType: typeof this.score,
    isNaN: isNaN(this.score),
    passed: this.passed,
    answersCount: this.answers?.length || 0
  });
  
  // Ensure score is a valid number
  if (this.score !== null && this.score !== undefined) {
    const numScore = Number(this.score);
    if (!isNaN(numScore) && isFinite(numScore)) {
      this.score = Math.max(0, Math.min(100, numScore));
    } else {
      this.score = 0; // Default to 0 if invalid
    }
  } else {
    this.score = 0; // Default to 0 if null/undefined
  }
  
  next();
});

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;