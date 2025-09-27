// A: GoogleレビューURL（固定）
const REVIEW_URL = "https://g.page/r/CdhE7fwALR7kEBM/review";
// 送信先（どちらか1つを使う。/api/submitを自前API、GASを使うなら下を採用）
const API_ENDPOINT = "/api/submit";
// const API_ENDPOINT = "＜あなたのGASデプロイURL（/exec）＞";

const form = document.getElementById("form");
const after = document.getElementById("after");
const copyText = document.getElementById("copyText");
const msg = document.getElementById("msg");
const googleBtn = document.getElementById("googleBtn");
const copyBtn = document.getElementById("copyBtn");
const sendClinicBtn = document.getElementById("sendClinicBtn");

let lastPayload = null;

// 星数に応じてボタン表示/非表示を切り替える
function updateButtonsByStars(stars) {
  const hide = stars <= 3;

  // ユーティリティ：存在すればdisplay切り替え
  const setVis = (el, visible) => { if (el) el.style.display = visible ? "" : "none"; };

  setVis(copyBtn, !hide);
  setVis(sendClinicBtn, !hide);
  setVis(googleBtn, !hide);
}

// 送信 → サンクス画面切替
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(form);
  const stars = Number(fd.get("stars")); // ラジオ name="stars"
  const comment = (document.getElementById("comment")?.value || "").trim();
  const ua = navigator.userAgent;

  if (!stars || stars < 1 || stars > 5) {
    alert("満足度（星1〜5）を選択してください。");
    return;
  }

  // 送信中の二重押下防止
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  // 1) APIへ送信（成功/失敗に関わらず先へ進む）
  lastPayload = { stars, comment, ua };
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastPayload),
    });
  } catch (err) {
    console.warn("submit failed", err);
  }

  // 2) サマリ表示
  copyText.textContent = `★${stars}\n${comment || "（コメントなし）"}`;

  // 3) メッセージ
  if (stars <= 3) {
    msg.innerHTML =
      'この度は貴重なご意見をいただきありがとうございました。<br>いただいた内容は院内で共有し、改善に努めて参ります。';
  } else {
    msg.innerHTML =
      'この度は貴重なご意見をいただきありがとうございました。<br>よろしければ、今の内容を <strong>Googleクチコミ</strong> にもご投稿いただけると励みになります。<br>個人情報は入れないようご注意ください。';
  }

  // 4) サンクス画面に切り替え
  googleBtn.href = REVIEW_URL;
  after.hidden = false;
  form.hidden = true;

  // 5) ★ここで星数に応じてボタン出し分け
  updateButtonsByStars(stars);

  if (submitBtn) submitBtn.disabled = false;
});

// 「内容をコピー」
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyText.textContent);
      const orig = copyBtn.textContent;
      copyBtn.textContent = "コピーしました";
      setTimeout(() => (copyBtn.textContent = orig), 1500);
    } catch {}
  });
}

// 「医院に送る」（手動の追送）
if (sendClinicBtn) {
  sendClinicBtn.addEventListener("click", async () => {
    if (!lastPayload) return;
    sendClinicBtn.disabled = true;
    try {
      await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastPayload),
      });
      sendClinicBtn.textContent = "医院へ送信しました";
    } catch (e) {
      sendClinicBtn.disabled = false;
      alert("送信に失敗しました。ネットワークをご確認ください。");
    }
  });
}

// 「Googleに投稿」：必ず新しいタブで開く（送信成否に関わらず開く）
googleBtn.addEventListener("click", (e) => {
  e.preventDefault();
  // 送信をこのタイミングでも保険で飛ばしたい場合は↓をコメントアウト解除（待たない）:
  // if (lastPayload) fetch(API_ENDPOINT, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(lastPayload) }).catch(()=>{});
  window.open(googleBtn.href || REVIEW_URL, "_blank", "noopener");
});
