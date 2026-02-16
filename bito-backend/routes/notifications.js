const express = require('express');
const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const weeklyReportService = require('../services/weeklyReportService');

const router = express.Router();

// ── VAPID configuration ────────────────────────────────────
// Keys should be set via env vars. Generate once with:
//   npx web-push generate-vapid-keys
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@bito.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log('🔔 Web Push VAPID configured');
} else {
  console.warn('⚠️  VAPID keys not set — push notifications disabled. Set VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY env vars.');
}

// All routes require authentication
router.use(authenticateJWT);

// ── GET /api/notifications/vapid-public-key ─────────────
// Returns the VAPID public key so the frontend can subscribe
router.get('/vapid-public-key', (req, res) => {
  if (!VAPID_PUBLIC) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications not configured on this server',
    });
  }
  res.json({ success: true, publicKey: VAPID_PUBLIC });
});

// ── POST /api/notifications/subscribe ───────────────────
// Save a push subscription for the authenticated user
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, deviceLabel } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push subscription object',
      });
    }

    // Upsert — update if same endpoint exists
    const doc = await PushSubscription.findOneAndUpdate(
      { userId: req.user._id, 'subscription.endpoint': subscription.endpoint },
      {
        userId: req.user._id,
        subscription,
        userAgent: req.headers['user-agent'] || '',
        deviceLabel: deviceLabel || 'Browser',
        isActive: true,
        failCount: 0,
        lastUsed: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mark user preference
    await User.findByIdAndUpdate(req.user._id, {
      'preferences.pushNotifications': true,
    });

    res.json({ success: true, subscriptionId: doc._id });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to save subscription' });
  }
});

// ── DELETE /api/notifications/unsubscribe ───────────────
// Remove a push subscription
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (endpoint) {
      await PushSubscription.deleteOne({ userId: req.user._id, 'subscription.endpoint': endpoint });
    } else {
      // Remove all subscriptions for this user
      await PushSubscription.deleteMany({ userId: req.user._id });
    }

    // Check if user has any remaining subscriptions
    const remaining = await PushSubscription.countDocuments({ userId: req.user._id, isActive: true });
    if (remaining === 0) {
      await User.findByIdAndUpdate(req.user._id, {
        'preferences.pushNotifications': false,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove subscription' });
  }
});

// ── POST /api/notifications/test ────────────────────────
// Send a test push notification to the authenticated user
router.post('/test', async (req, res) => {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return res.status(503).json({ success: false, message: 'Push not configured' });
    }

    const subs = await PushSubscription.find({ userId: req.user._id, isActive: true });

    if (subs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active push subscriptions found. Enable notifications first.',
      });
    }

    const payload = JSON.stringify({
      title: 'Bito',
      body: '🎉 Push notifications are working! You\'ll get habit reminders here.',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: 'test',
      data: { url: '/app/dashboard' },
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub.subscription, payload);
        sent++;
        sub.lastUsed = new Date();
        await sub.save();
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired — remove it
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          sub.failCount += 1;
          await sub.save();
        }
      }
    }

    res.json({ success: true, sent, total: subs.length });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

// ── GET /api/notifications/status ───────────────────────
// Get notification status for the current user
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const subscriptions = await PushSubscription.find({ userId: req.user._id, isActive: true })
      .select('deviceLabel lastUsed createdAt')
      .lean();

    res.json({
      success: true,
      data: {
        pushEnabled: user?.preferences?.pushNotifications ?? false,
        emailEnabled: user?.preferences?.emailNotifications ?? true,
        dailyDigest: user?.preferences?.dailyDigestEmail ?? false,
        devices: subscriptions.map(s => ({
          id: s._id,
          label: s.deviceLabel,
          lastUsed: s.lastUsed,
          registeredAt: s.createdAt,
        })),
        vapidConfigured: !!(VAPID_PUBLIC && VAPID_PRIVATE),
      },
    });
  } catch (error) {
    console.error('Notification status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

// ── PATCH /api/notifications/preferences ────────────────
// Update notification preferences
router.patch('/preferences', async (req, res) => {
  try {
    const { emailNotifications, dailyDigestEmail } = req.body;
    const update = {};

    if (emailNotifications !== undefined) {
      update['preferences.emailNotifications'] = !!emailNotifications;
    }
    if (dailyDigestEmail !== undefined) {
      update['preferences.dailyDigestEmail'] = !!dailyDigestEmail;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No preferences to update' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).lean();

    res.json({
      success: true,
      data: {
        emailNotifications: user.preferences?.emailNotifications,
        dailyDigestEmail: user.preferences?.dailyDigestEmail,
        pushNotifications: user.preferences?.pushNotifications,
      },
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

// ── POST /api/notifications/test-weekly-report ──────────
// Send a weekly report to the current user immediately (for testing)
router.post('/test-weekly-report', async (req, res) => {
  try {
    const result = await weeklyReportService.sendNow(req.user._id);
    res.json({
      success: true,
      message: 'Weekly report sent — check your email!',
      data: result,
    });
  } catch (error) {
    console.error('Test weekly report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
