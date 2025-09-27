// 設定
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

// ユーティリティ
const show = el => { if (el) el.hidden = false; };
const hide = el => { if (el) el.hidden = true; };

// ① 初期画面：星を選んだら分岐
starsForm.addEventListener("change", async (e) => {
  const v = Number(new FormData(starsForm).get("stars"));
  if (!v) return; // 念のため
  state.stars = v;

  // 星の選択イベントをサーバに共有（任意。不要なら削除OK）
  try {
    navigator.sendBeacon
      ? navigator.sendBeacon(API_ENDPOINT, new Blob([JSON.stringify({ stars: v, ua: state.ua })], {type: "application/json"}))
      : await fetch(API_ENDPOINT, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ stars: v, ua: state.ua }), keepalive: true });
  } catch (_) {}

  // 分岐表示
  hide(starsForm);
  if (v <= 3) {
    show(lowFlow);
  } else {
    // ★4〜5：Google誘導＋3.5秒で自動オープン
    if (googleBtn) googleBtn.href = REVIEW_URL;
    show(highFlow);
    if (autoOpenNote) autoOpenNote.textContent = "数秒後にGoogleレビュー投稿ページが自動で開きます。";

    setTimeout(() => {
      window.open(REVIEW_URL, "_blank", "noopener");
    }, 3500);

    // クリックでも開ける
    if (googleBtn) {
      googleBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open(REVIEW_URL, "_blank", "noopener");
      }, { once: true });
    }
  }
});

// ② 低評価フロー：コメント送信 → 完了表示
lowSendBtn?.addEventListener("click", async () => {
  const comment = (detailInput?.value || "").trim().slice(0, 1000);
  state.comment = comment;

  // 送信（失敗しても完了画面へ進む）
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ stars: state.stars, comment, ua: state.ua }),
      keepalive: true
    });
  } catch (_) {}

  hide(lowFlow);
  show(lowThanks);
});
