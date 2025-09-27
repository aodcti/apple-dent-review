const REVIEW_URL   = "https://g.page/r/CdhE7fwALR7kEBM/review";
// const API_ENDPOINT = "＜あなたのGASデプロイURL（/exec）＞";
const API_ENDPOINT = "/api/submit";

const starsForm   = document.getElementById("starsForm");
const lowFlow     = document.getElementById("lowFlow");
const lowThanks   = document.getElementById("lowThanks");
const highFlow    = document.getElementById("highFlow");
const googleBtn   = document.getElementById("googleBtn");
const lowSendBtn  = document.getElementById("lowSendBtn");
const detailInput = document.getElementById("detailComment");
const autoOpenNote= document.getElementById("autoOpenNote");

let state = { stars: null, comment: "", ua: navigator.userAgent };

// ★「次へ」ボタンで進む
starsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = Number(new FormData(starsForm).get("stars"));
  if (!v) {
    alert("満足度をお選びください");
    return;
  }
  state.stars = v;

  // 初期画面を隠す
  starsForm.hidden = true;

  if (v <= 3) {
    // ★1〜3 → コメント入力へ
    lowFlow.hidden = false;
  } else {
    // ★4〜5 → Google誘導
    highFlow.hidden = false;
    if (googleBtn) googleBtn.href = REVIEW_URL;
    if (autoOpenNote) autoOpenNote.textContent = "数秒後にGoogleクチコミ投稿ページが自動で開きます。";

    setTimeout(() => {
      window.open(REVIEW_URL, "_blank", "noopener");
    }, 3500);
  }
});

// ★1〜3：コメント送信ボタン
lowSendBtn?.addEventListener("click", async () => {
  const comment = (detailInput?.value || "").trim().slice(0, 1000);
  state.comment = comment;

  // サーバ送信（省略可）
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ stars: state.stars, comment, ua: state.ua }),
      keepalive: true
    });
  } catch (_) {}

  lowFlow.hidden = true;
  lowThanks.hidden = false;
});

// Googleボタン：クリックで新規タブ
googleBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  window.open(REVIEW_URL, "_blank", "noopener");
});
