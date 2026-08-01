// Button actions
document.getElementById("goLive").addEventListener("click", () => {
  alert("Live streaming feature coming soon!");
});

document.getElementById("makeMoment").addEventListener("click", () => {
  alert("Create your special moment!");
});

document.getElementById("joinFun").addEventListener("click", () => {
  alert("Join funny activities!");
});

document.getElementById("beStar").addEventListener("click", () => {
  alert("Profile building feature coming soon!");
});

// Service worker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch(error => console.error("Service Worker Registration Failed:", error));
}
