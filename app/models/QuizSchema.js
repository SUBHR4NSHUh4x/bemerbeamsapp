import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const choiceSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

const questionSchema = new Schema({
  type: {
    type: String,
    enum: ['mcq', 'text', 'true_false', 'fill_blank'],
    default: 'mcq',
  },
  question: {
    type: String,
    required: true,
  },
  choices: [choiceSchema],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  points: {
    type: Number,
    default: 1,
  },
  timeLimit: {
    type: Number, // in seconds
    default: 30,
  },
  answeredResult: {
    type: Number,
    default: -1,
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
    },
    incorrectAttempts: {
      type: Number,
      default: 0,
    },
  },
});

const quizSchema = new Schema({
  quizTitle: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  timeLimit: {
    type: Number, // total time in minutes
    default: 30,
  },
  passingScore: {
    type: Number,
    default: 70, // percentage
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String, // Clerk user ID
    required: true,
  },
  quizQuestions: [questionSchema],
  tags: [String],
  metadata: {
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update metadata before saving
quizSchema.pre('save', function(next) {
  this.metadata.totalQuestions = this.quizQuestions.length;
  this.metadata.totalPoints = this.quizQuestions.reduce((total, q) => total + q.points, 0);
  this.updatedAt = Date.now();
  next();
});

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

export default Quiz;
