const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Web Push subscription object from browser
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },

  // Device info (for managing multiple devices)
  userAgent: { type: String, default: '' },
  deviceLabel: { type: String, default: 'Browser' },

  // Status
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now },
  failCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One subscription per endpoint per user
pushSubscriptionSchema.index(
  { userId: 1, 'subscription.endpoint': 1 },
  { unique: true }
);

// Clean up stale subscriptions (failed 3+ times)
pushSubscriptionSchema.statics.pruneStale = function () {
  return this.deleteMany({ failCount: { $gte: 3 } });
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
