// ==== 設定 ====
const REVIEW_URL   = "https://g.page/r/CdhE7fwALR7kEBM/review";
// const API_ENDPOINT = "＜あなたのGASデプロイURL（/exec）＞";
const API_ENDPOINT = "/api/submit";

// ==== 要素参照（1回だけ取得）====
const starsForm    = document.getElementById("starsForm");
const lowFlow      = document.getElementById("lowFlow");
const lowThanks    = document.getElementById("lowThanks");
const highFlow     = document.getElementById("highFlow");
const googleBtn    = document.getElementById("googleBtn");
const lowSendBtn   = document.getElementById("lowSendBtn");
const detailInput  = document.getElementById("detailComment");
const autoOpenNote = document.getElementById("autoOpenNote");

const state = { stars: null, ua: navigator.userAgent };

// ==== ユーティリティ ====
const show = (el) => { if (el && el.hidden) el.hidden = false; };
const hide = (el) => { if (el && !el.hidden) el.hidden = true; };

// fetchを「UIを止めずに」送る。sendBeacon優先、だめなら非同期fetch（待たない）
function fireAndForget(url, data) {
  try {
    const body = JSON.stringify(data);
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    // 送信はするが待たない（keepaliveでタブ遷移にも強い）
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch (_) {}
}

// ==== 初期画面：「次へ」で分岐 ====
starsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = Number(new FormData(starsForm).get("stars"));
  if (!v) { alert("満足度をお選びください"); return; }
  state.stars = v;

  hide(starsForm);

  if (v <= 3) {
    // 低評価フローへ（UI先行）
    show(lowFlow);
  } else {
    // 高評価フロー：UI先行→自動オープン
    if (googleBtn) googleBtn.href = REVIEW_URL;
    show(highFlow);
    if (autoOpenNote) autoOpenNote.textContent = "数秒後にGoogleクチコミ投稿ページが自動で開きます。開かない場合は上のボタンをタップしてください";

    // ★ 星だけサーバ共有（UIは待たない）
    fireAndForget(API_ENDPOINT, { stars: v, ua: state.ua });

    // 3.5秒後に新規タブ
    setTimeout(() => { window.open(REVIEW_URL, "_blank", "noopener"); }, 3500);
  }
}, { passive: false });

// ==== 低評価：送信（コメント任意） ====
lowSendBtn?.addEventListener("click", () => {
  // UIは即時にサンクスへ
  hide(lowFlow);
  show(lowThanks);

  // 通信は後追いで非同期送信（UIをブロックしない）
  const comment = (detailInput?.value || "").trim().slice(0, 1000);
  fireAndForget(API_ENDPOINT, { stars: state.stars, comment, ua: state.ua });
}, { passive: true });

// ==== Googleボタン：クリックでも即タブ ====
googleBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  window.open(REVIEW_URL, "_blank", "noopener");
}, { passive: false });
