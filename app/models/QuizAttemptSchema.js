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
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
  answers: [answerSchema],
}, { timestamps: true });

// Add pre-save middleware for debugging
quizAttemptSchema.pre('save', function(next) {
  console.log('Saving quiz attempt:', {
    quizId: this.quizId,
    userName: this.userName,
    score: this.score,
    passed: this.passed,
    answersCount: this.answers.length
  });
  next();
});

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;