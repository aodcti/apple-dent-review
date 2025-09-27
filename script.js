// A: GoogleレビューURL（そのままOK）
const REVIEW_URL = "https://g.page/r/CdhE7fwALR7kEBM/review";

const form = document.getElementById('form');
const after = document.getElementById('after');
const copyText = document.getElementById('copyText');
const msg = document.getElementById('msg');
const googleBtn = document.getElementById('googleBtn');
const copyBtn = document.getElementById('copyBtn');
const sendClinicBtn = document.getElementById('sendClinicBtn');

let lastPayload = null;

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const stars = Number((new FormData(form)).get('stars'));
  const comment = document.getElementById('comment').value.trim();

  // 送信（全評価を医院共有）※まずはAPIへ
  try{
    await fetch('/api/submit', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ stars, comment })
    });
  }catch(err){ console.warn('submit failed', err); }

  // プレビュー
  copyText.textContent = `★${stars}\n${comment || '（コメントなし）'}`;

  // 文言：コピーは出し分け。導線は常に両方表示
  if(stars <= 3){
    msg.innerHTML = 'いただいた内容は院内で共有し、改善に努めます。<br>もしよろしければ、同じ内容を <strong>Googleクチコミ</strong> にもご投稿いただけると助かります。';
  }else{
    msg.innerHTML = 'よろしければ、今の内容を <strong>Googleクチコミ</strong> にもご投稿いただけると励みになります。<br>個人情報は入れないようご注意ください。';
  }

  googleBtn.href = REVIEW_URL;
  after.hidden = false;
  form.hidden = true;
  lastPayload = { stars, comment };
});

// コピー
copyBtn.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(copyText.textContent);
    copyBtn.textContent = 'コピーしました';
    setTimeout(()=> copyBtn.textContent='内容をコピー', 1500);
  }catch{}
});

// 医院に送る（手動追送・任意）
sendClinicBtn.addEventListener('click', async ()=>{
  if(!lastPayload) return;
  sendClinicBtn.disabled = true;
  await fetch('/api/submit', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(lastPayload)
  });
  sendClinicBtn.textContent = '医院へ送信しました';
});

document.getElementById("googleBtn").addEventListener("click", async (e) => {
  e.preventDefault(); // <a>の通常遷移を止める

  // 1. 入力済みのデータを取得
  const stars = document.querySelector("input[name='stars']:checked")?.value;
  const comment = document.getElementById("comment")?.value || "";
  const ua = navigator.userAgent;

  // 2. GASのdoPostに送信
  try {
    await fetch("＜あなたのGASデプロイURL＞", {
      method: "POST",
      body: JSON.stringify({ stars, comment, ua }),
      headers: { "Content-Type": "application/json" }
    });
    console.log("医院に送信完了");
  } catch (err) {
    console.error("医院への送信エラー:", err);
  }

  // 3. Googleクチコミページを新しいタブで開く
  const url = e.target.href; // <a>タグに書いた固定URLを利用
  window.open(url, "_blank", "noopener");
});
