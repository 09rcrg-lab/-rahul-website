/* Rahul Social Hub - Referral Reward
   Reward: 5,000 Free Views
   5 Videos × 1,000 Views
*/

(function () {
  "use strict";

  const REWARD_KEY = "rahul_free_view_reward";
  const REFERRAL_KEY = "rahul_joined_referral";

  const REWARD = {
    totalViews: 5000,
    videos: 5,
    viewsPerVideo: 1000,
    status: "pending"
  };

  // Get referral code saved by referral.js
  function getReferralCode() {
    return localStorage.getItem(REFERRAL_KEY) || "";
  }

  // Check whether this visitor came from a referral
  function hasReferral() {
    return getReferralCode() !== "";
  }

  // Give the 5,000-view reward
  function giveReward() {
    const oldReward = localStorage.getItem(REWARD_KEY);

    if (oldReward) {
      return JSON.parse(oldReward);
    }

    const reward = {
      totalViews: REWARD.totalViews,
      videos: REWARD.videos,
      viewsPerVideo: REWARD.viewsPerVideo,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(REWARD_KEY, JSON.stringify(reward));

    return reward;
  }

  // Get current reward
  function getReward() {
    const saved = localStorage.getItem(REWARD_KEY);

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      return null;
    }
  }

  // Mark reward as used
  function useReward() {
    const reward = getReward();

    if (!reward) {
      return false;
    }

    reward.status = "used";
    reward.usedAt = new Date().toISOString();

    localStorage.setItem(REWARD_KEY, JSON.stringify(reward));

    return true;
  }

  // Public functions
  window.RahulReferralReward = {
    referralCode: getReferralCode,
    hasReferral: hasReferral,
    giveReward: giveReward,
    getReward: getReward,
    useReward: useReward,
    totalViews: 5000,
    videos: 5,
    viewsPerVideo: 1000
  };

})();