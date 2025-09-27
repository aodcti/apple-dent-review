// A: GoogleレビューURL（固定）
const REVIEW_URL = "https://g.page/r/CdhE7fwALR7kEBM/review";
// 送信先（どちらか1つを使う）
// const API_ENDPOINT = "＜あなたのGASデプロイURL（/exec）＞";
const API_ENDPOINT = "/api/submit";

const form = document.getElementById("form");
const after = document.getElementById("after");
const msg = document.getElementById("msg");
const googleBtn = document.getElementById("googleBtn");
const copyBtn = document.getElementById("copyBtn");
const sendClinicBtn = document.getElementById("sendClinicBtn");
const starsPreview = document.getElementById("starsPreview");
const commentPreview = document.getElementById("commentPreview");

let lastPayload = null;

// 星数に応じてボタン表示/非表示を切り替える（★1〜3は全ボタン非表示）
function updateButtonsByStars(stars) {
  const hide = stars <= 3;
  const setVis = (el, visible) => { if (el) el.style.display = visible ? "" : "none"; };
  setVis(copyBtn, !hide);
  setVis(sendClinicBtn, !hide);
  setVis(googleBtn, !hide);
}

// 送信 → サンクス画面切替
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(form);
  const stars = Number(fd.get("stars"));         // name="stars"
  const comment = (document.getElementById("comment")?.value || "").trim();
  const ua = navigator.userAgent;

  if (!stars || stars < 1 || stars > 5) {
    alert("満足度（星1〜5）を選択してください。");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  // APIへ送信（成功/失敗に関わらず先へ進む）
  lastPayload = { stars, comment, ua };
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastPayload),
      keepalive: true,
    });
  } catch (err) {
    console.warn("submit failed", err);
  }

  // プレビュー反映（星とコメントは別枠）
  if (starsPreview) starsPreview.textContent = `★${stars}`;
  if (commentPreview) commentPreview.textContent = comment || "（コメントなし）";

  // メッセージ
  if (stars <= 3) {
    msg.innerHTML = 'この度は貴重なご意見をいただきありがとうございました。<br>いただいた内容は院内で共有し、改善に努めて参ります。';
  } else {
    msg.innerHTML = 'この度は貴重なご意見をいただきありがとうございました。<br>よろしければ、今の内容を <strong>Googleクチコミ</strong> にもご投稿いただけると励みになります。<br>個人情報は入れないようご注意ください。';
  }

  // サンクス画面に切り替え
  if (googleBtn) googleBtn.href = REVIEW_URL;
  after.hidden = false;
  form.hidden = true;

  // ★ ボタン出し分け（1〜3は全部隠す）
  updateButtonsByStars(stars);

  // ★ 星4以上：コメントを自動コピー → 3秒後に自動で新規タブを開く
  if (stars >= 4) {
    // コピー（失敗しても続行）
    if (comment) {
      navigator.clipboard.writeText(comment).then(
        () => { /* 成功時なにもしない */ },
        () => { console.warn("clipboard copy failed"); }
      );
    }
    // 案内を表示して3秒後にタブを自動オープン
    msg.insertAdjacentHTML(
      "beforeend",
      "<p class='note'>3秒後にGoogleクチコミ投稿ページが自動で開きます。<br>すぐに投稿する場合は下の「Googleに投稿」ボタンからも移動できます。</p>"
    );
    setTimeout(() => {
      window.open(REVIEW_URL, "_blank", "noopener");
    }, 3000);
  }

  if (submitBtn) submitBtn.disabled = false;
});

// （任意）ユーザーが自分で押した場合：そのまま新規タブを開く
if (googleBtn) {
  googleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(googleBtn.href || REVIEW_URL, "_blank", "noopener");
  });
}

// 「コメントをコピー」：コメントのみコピー（星4以上の時だけボタンは表示される）
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const text = (commentPreview?.textContent || "").trim();
    if (!text || text === "（コメントなし）") return;
    try {
      await navigator.clipboard.writeText(text);
      const orig = copyBtn.textContent;
      copyBtn.textContent = "コピーしました";
      setTimeout(() => (copyBtn.textContent = orig), 1500);
    } catch {
      alert("コピーに失敗しました。お手数ですが手動で選択してコピーしてください。");
    }
  });
}
