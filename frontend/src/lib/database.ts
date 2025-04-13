import mongoose from 'mongoose';

// Переменная для хранения соединения
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  // Если соединение уже установлено, используем его
  if (cachedConnection) {
    return cachedConnection;
  }
}

// Определение схемы для пользователей и рефералов
const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  referrals: [{
    type: String,
    ref: 'User'
  }],
  referredBy: {
    type: String,
    default: null
  },
  points: {
    type: Number,
    default: 0
  },
  hasPurchasedNft: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Создаем и экспортируем модель User, если она еще не существует
export const User = mongoose.models.User || mongoose.model('User', userSchema);

// Определение схемы для логирования реферальных переходов
const referralLogSchema = new mongoose.Schema({
  referrerAddress: {
    type: String,
    required: true,
    index: true
  },
  userAddress: {
    type: String,
    required: true,
    index: true
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Создаем и экспортируем модель ReferralLog
export const ReferralLog = mongoose.models.ReferralLog || 
                          mongoose.model('ReferralLog', referralLogSchema); 