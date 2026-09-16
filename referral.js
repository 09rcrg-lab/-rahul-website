/* Rahul Social Hub - Share & Earn
   Reward: 5,000 Free Views
*/

(function () {
  "use strict";

  const REF_KEY = "rahul_referral_code";
  const JOINED_REF_KEY = "rahul_joined_referral";
  const REWARD_KEY = "rahul_free_view_reward";

  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "RSH-";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
  }

  let myCode = localStorage.getItem(REF_KEY);

  if (!myCode) {
    myCode = makeCode();
    localStorage.setItem(REF_KEY, myCode);
  }

  // Check whether visitor arrived through somebody's referral link
  const params = new URLSearchParams(window.location.search);
  const incomingRef = params.get("ref");

  if (incomingRef && incomingRef !== myCode) {
    localStorage.setItem(JOINED_REF_KEY, incomingRef);
  }

  function getShareLink() {
    return window.location.origin +
      window.location.pathname +
      "?ref=" +
      encodeURIComponent(myCode);
  }

  function shareWebsite() {
    const link = getShareLink();

    const text =
      "Rahul Social Hub Instagram Services 🚀\n\n" +
      "Followers, Likes, Views और Instagram Services उपलब्ध हैं.\n\n" +
      "Website:\n" +
      link +
      "\n\n" +
      "मेरे referral link से order करने पर मुझे 5,000 Free Views का reward मिलेगा ❤️";

    if (navigator.share) {
      navigator.share({
        title: "Rahul Social Hub",
        text: text,
        url: link
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(link).then(() => {
        alert("Referral link copy हो गया ✅\nअब इसे WhatsApp या Instagram पर share करें.");
      }).catch(() => {
        prompt("अपना referral link copy करें:", link);
      });
    }
  }

  function createShareBox() {
    if (document.getElementById("rahul-share-earn")) return;

    const box = document.createElement("div");
    box.id = "rahul-share-earn";

    box.innerHTML = `
      <div style="
        background:#111;
        border:1px solid #20d46b;
        border-radius:16px;
        padding:18px;
        margin:18px 0;
        color:#fff;
        font-family:Arial,sans-serif;
        text-align:center;
        box-shadow:0 0 15px rgba(32,212,107,.15);
      ">
        <div style="font-size:22px;font-weight:bold;margin-bottom:8px;">
          🎁 Share & Earn
        </div>

        <div style="font-size:15px;line-height:1.5;color:#ddd;">
          अपनी referral link share करें।
          <br>
          आपके link से कोई successful order करता है,
          <br>
          तो आपको <b style="color:#20d46b;">5,000 Free Views</b> मिलेंगे!
        </div>

        <button id="rahul-share-btn" style="
          margin-top:15px;
          width:100%;
          padding:13px;
          border:0;
          border-radius:10px;
          background:#20d46b;
          color:#000;
          font-size:16px;
          font-weight:bold;
          cursor:pointer;
        ">
          📤 Share Website
        </button>

        <div style="
          margin-top:10px;
          font-size:12px;
          color:#888;
          word-break:break-all;
        ">
          Referral Code: ${myCode}
        </div>
      </div>
    `;

    const main =
      document.querySelector("main") ||
      document.querySelector(".container") ||
      document.body;

    main.prepend(box);

    document
      .getElementById("rahul-share-btn")
      .addEventListener("click", shareWebsite);
  }

  // Store reward information locally
  function setReward() {
    localStorage.setItem(
      REWARD_KEY,
      JSON.stringify({
        totalViews: 5000,
        videos: 5,
        viewsPerVideo: 1000,
        status: "pending"
      })
    );
  }

  // Make reward available for the order/referral system
  window.RahulShareEarn = {
    referralCode: myCode,
    referralLink: getShareLink,
    joinedReferral: localStorage.getItem(JOINED_REF_KEY),
    rewardViews: 5000,
    videos: 5,
    viewsPerVideo: 1000,
    setReward: setReward,
    share: shareWebsite
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createShareBox);
  } else {
    createShareBox();
  }

})();