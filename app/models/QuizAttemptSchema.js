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
    validate: {
      validator: function(v) {
        return typeof v === 'number' && !isNaN(v) && isFinite(v);
      },
      message: 'Score must be a valid number'
    }
  },
  passed: { type: Boolean, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
  answers: [answerSchema],
}, { timestamps: true });

// Add pre-save middleware for debugging and validation
quizAttemptSchema.pre('save', function(next) {
  console.log('Saving quiz attempt:', {
    quizId: this.quizId,
    userName: this.userName,
    score: this.score,
    scoreType: typeof this.score,
    isNaN: isNaN(this.score),
    passed: this.passed,
    answersCount: this.answers.length
  });
  
  // Ensure score is valid before saving
  if (typeof this.score !== 'number' || isNaN(this.score) || !isFinite(this.score)) {
    console.error('Invalid score detected in pre-save hook:', this.score);
    return next(new Error('Invalid score value'));
  }
  
  // Ensure score is within bounds
  if (this.score < 0 || this.score > 100) {
    console.error('Score out of bounds in pre-save hook:', this.score);
    return next(new Error('Score must be between 0 and 100'));
  }
  
  next();
});

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;