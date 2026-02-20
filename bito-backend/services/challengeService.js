const cron = require('node-cron');
const webPush = require('web-push');
const Challenge = require('../models/Challenge');
const Activity = require('../models/Activity');
const PushSubscription = require('../models/PushSubscription');

// Reuse VAPID config from notifications route
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@bfrnd.io';
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try { webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); } catch {}
}

/**
 * ChallengeService — runs an hourly cron job to transition challenge statuses:
 *   upcoming → active  (when startDate passes)
 *   active → completed (when endDate passes)
 *
 * Also generates feed events for transitions so the activity feed
 * shows "Challenge X has started!" / "Challenge X has ended!" automatically.
 * Sends push notifications to all participants on transitions.
 */
class ChallengeService {
  constructor() {
    this.job = null;
  }

  start() {
    // Run every hour at :00
    this.job = cron.schedule('0 * * * *', () => this.transitionChallenges(), {
      scheduled: true,
    });
    console.log('🏆 Challenge status cron job started (every hour)');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('🏆 Challenge status cron job stopped');
    }
  }

  async transitionChallenges() {
    try {
      const now = new Date();

      // 1. upcoming → active
      const toActivate = await Challenge.find({
        status: 'upcoming',
        startDate: { $lte: now },
      });

      for (const challenge of toActivate) {
        challenge.status = 'active';
        await challenge.save();

        // Feed event: challenge started
        await Activity.create({
          workspaceId: challenge.workspaceId,
          userId: challenge.createdBy,
          type: 'challenge_started',
          data: {
            challengeId: challenge._id,
            challengeName: challenge.title,
            challengeType: challenge.type,
            message: `Challenge "${challenge.title}" has started!`,
          },
          visibility: 'workspace',
        });

        // Push notification
        await this._notifyParticipants(challenge, {
          title: '🏆 Challenge Started!',
          body: `"${challenge.title}" is now active. Go!`,
          tag: `challenge-start-${challenge._id}`,
        });
      }

      // 2. active → completed (endDate passed)
      const toComplete = await Challenge.find({
        status: 'active',
        endDate: { $lte: now },
      });

      for (const challenge of toComplete) {
        challenge.status = 'completed';
        await challenge.save();

        // Feed event: challenge ended
        await Activity.create({
          workspaceId: challenge.workspaceId,
          userId: challenge.createdBy,
          type: 'challenge_completed',
          data: {
            challengeId: challenge._id,
            challengeName: challenge.title,
            challengeType: challenge.type,
            message: `Challenge "${challenge.title}" has ended!`,
            metadata: {
              participantCount: challenge.stats.participantCount,
              completedCount: challenge.stats.completedCount,
              averageProgress: challenge.stats.averageProgress,
            },
          },
          visibility: 'workspace',
        });

        // Push notification
        await this._notifyParticipants(challenge, {
          title: '🏁 Challenge Complete!',
          body: `"${challenge.title}" has ended. ${challenge.stats.completedCount} finished!`,
          tag: `challenge-end-${challenge._id}`,
        });
      }

      if (toActivate.length > 0 || toComplete.length > 0) {
        console.log(`🏆 Challenge transitions: ${toActivate.length} activated, ${toComplete.length} completed`);
      }
    } catch (error) {
      console.error('Challenge transition error:', error);
    }
  }

  /**
   * Send a push notification to all participants of a challenge.
   */
  async _notifyParticipants(challenge, { title, body, tag }) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

    const participantIds = challenge.participants.map((p) => p.userId?._id || p.userId);

    const subs = await PushSubscription.find({
      userId: { $in: participantIds },
      isActive: true,
    });

    const payload = JSON.stringify({
      title,
      body,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: tag || `challenge-${challenge._id}`,
      data: { url: `/app/groups/${challenge.workspaceId}`, challengeId: challenge._id.toString() },
    });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }
  }
}

module.exports = new ChallengeService();
