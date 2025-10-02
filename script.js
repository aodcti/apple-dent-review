// ==== 設定 ====
const REVIEW_URL   = "https://g.page/r/CdhE7fwALR7kEBM/review";
// const API_ENDPOINT = "＜あなたのGASデプロイURL（/exec）＞";
const API_ENDPOINT = "/api/submit";

// ==== 要素参照 ====
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

// UIを止めずに送信（sendBeacon優先、不可なら非同期fetchでフォールバック）
function fireAndForget(url, data) {
  try {
    const body = JSON.stringify(data);
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
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

  // 初期画面を隠す
  hide(starsForm);

  if (v <= 3) {
    // ★1〜3 → コメント入力へ（UI先行）
    show(lowFlow);
  } else {
    // ★4〜5 → Google誘導
    show(highFlow);
    if (googleBtn) googleBtn.href = REVIEW_URL;
    if (autoOpenNote) autoOpenNote.textContent = "数秒後にGoogleクチコミ投稿ページが自動で開きます。";

    // ★ 星のみをサーバ共有（UIは待たない）
    fireAndForget(API_ENDPOINT, { stars: v, ua: state.ua });

    // ★ iPhone対策：ユーザー操作直後に空タブを確保 → 後でURL差し替え
    let popup = null;
    try {
      popup = window.open("about:blank", "_blank");
      if (popup && !popup.closed) {
        popup.document.write(
          "<!doctype html><title>Googleクチコミへ移動中...</title>" +
          "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
          "<p style='font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px'>Googleクチコミへ移動します…</p>"
        );
      }
    } catch (_) {
      popup = null; // 開けなかったら後続はボタンで開いてもらう
    }

    // 3.5秒後に先に開いたタブのURLを差し替え（開いていなければ何もしない）
    setTimeout(() => {
      if (popup && !popup.closed) {
        try { popup.location.replace(REVIEW_URL); }
        catch { popup.location.href = REVIEW_URL; }
      }
      // 失敗時のフォールバックは「Googleに投稿」ボタン（既に表示済み）
    }, 3500);
  }
}, { passive: false });

// ==== 低評価：送信（コメント任意） ====
lowSendBtn?.addEventListener("click", () => {
  // UIは即サンクスへ
  hide(lowFlow);
  show(lowThanks);

  // 通信は後追い（UIをブロックしない）
  const comment = (detailInput?.value || "").trim().slice(0, 1000);
  fireAndForget(API_ENDPOINT, { stars: state.stars, comment, ua: state.ua });
}, { passive: true });

// ==== Googleボタン：クリックでも即タブ ====
googleBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  window.open(REVIEW_URL, "_blank", "noopener");
}, { passive: false });
