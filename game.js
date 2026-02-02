// ================= ELEMENTS =================
const container = document.querySelector(".container");
const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const confirmBtn = document.getElementById("confirmUsername");

const home = document.getElementById("home");
const levelSelect = document.getElementById("levelSelect");
const game = document.getElementById("game");
const gameOver = document.getElementById("gameOver");
const question = document.getElementById("question");
const answerInput = document.getElementById("answer");
const timeText = document.getElementById("timeText");
const scoreText = document.getElementById("scoreText");
const timeFill = document.getElementById("timeFill");
const finalScore = document.getElementById("finalScore");
const leaderboardBox = document.getElementById("leaderboardBox");
const leaderboardList = document.getElementById("leaderboardList");

// ================= CONFIG =================
const cfg = { easy:{max:10,time:12}, medium:{max:20,time:7}, hard:{max:45,time:5} };
let level, answer, score=0, timeLeft, timer;
let lbLevel = "easy";

// ================= USER =================
let username = localStorage.getItem("username");

// tampilkan modal username kalau belum ada
if (!username) {
    container.classList.add("hidden");
    usernameModal.style.display = "flex";
} else {
    usernameModal.style.display = "none";
    container.classList.remove("hidden");
}

const avatarURL = () => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

// ================= MODAL =================
confirmBtn.addEventListener("click", () => {
    const val = usernameInput.value.trim();
    if (!val) return;
    username = val.slice(0,10);
    localStorage.setItem("username", username);
    usernameModal.style.display = "none";
    container.classList.remove("hidden");
});

function showOptions() {
    document.getElementById("options-buttons").classList.remove("hidden");

    // sembunyikan tombol Play, Leaderboard, Options
    document.getElementById("play-btn").classList.add("hidden");
    document.getElementById("lb-btn").classList.add("hidden");
    document.getElementById("options-btn").classList.add("hidden"); // <-- ini penting
}

function hideOptions() {
    document.getElementById("options-buttons").classList.add("hidden");

    // munculkan tombol Play, Leaderboard, Options lagi
    document.getElementById("play-btn").classList.remove("hidden");
    document.getElementById("lb-btn").classList.remove("hidden");
    document.getElementById("options-btn").classList.remove("hidden"); // <-- ini juga penting
}


// ================= NAV =================
function goLevel(){ home.classList.add("hidden"); levelSelect.classList.remove("hidden"); }
function backHome(){ levelSelect.classList.add("hidden"); home.classList.remove("hidden"); }

// ================= GAME =================
function startGame(lv){
    level = lv; score=0;
    levelSelect.classList.add("hidden"); game.classList.remove("hidden");
    document.getElementById("levelTitle").innerText = lv.toUpperCase();
    nextQ();
}

function nextQ(){
    clearInterval(timer); 
    timeLeft = cfg[level].time;

    let a = r(), b = r();
    let ops = ["+","-","*"], op = ops[Math.floor(Math.random()*ops.length)];
    if(op==="*") b = Math.floor(Math.random()*3)+1;
    if(op==="-" && a<b) [a,b]=[b,a];

    answer = op==="+"? a+b : op==="-"? a-b : a*b;
    question.innerText = `${a} ${op==="*"?"×":op} ${b}`;
    answerInput.value = "";
    updateUI();

    timer = setInterval(tick,1000);
}

function tick(){ 
    timeLeft--; 
    updateUI(); 
    if(timeLeft <= 0) endGame(); 
}

function updateUI(){
    timeText.innerText = timeLeft;
    scoreText.innerText = score;
    timeFill.style.width = (timeLeft/cfg[level].time)*100 + "%";
}

function checkAnswer(){
    const val = answerInput.value.trim();
    if(val === ""){
        answerInput.classList.add("shake");
        answerInput.focus();
        setTimeout(()=>answerInput.classList.remove("shake"),500);
        return;
    }

    if(+val === answer){
        score++;
        nextQ();
    } else {
        endGame();
    }
}

function endGame(){
    clearInterval(timer);
    game.classList.add("hidden");
    gameOver.classList.remove("hidden");
    finalScore.innerText = score;
    saveScore();
}

function restart(){
    gameOver.classList.add("hidden");
    home.classList.remove("hidden");
}

// ================= RESET =================
function resetAccount(){
    if(!confirm("Yakin mau reset akun? Nama, foto, dan skor akan hilang!")) return;
    localStorage.removeItem("username");
    username = null;
    usernameModal.style.display = "flex";
    container.classList.add("hidden");
}

// ================= HELPER =================
function r(){ return Math.floor(Math.random()*cfg[level].max)+1; }

// ================= LEADERBOARD =================
function toggleLB(){ leaderboardBox.classList.toggle("hidden"); loadLB(); }
function switchLB(lv, btn){
    lbLevel = lv;
    document.querySelectorAll(".lb-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    loadLB();
}

// ================= FIREBASE =================
// DB hanya dari firebase.js, jangan declare lagi di sini
function saveScore(){
    const ref = db.ref(`scores/${level}/${username}`);
    ref.once("value", s=>{
        if(!s.exists() || score > s.val().score){
            ref.set({score, avatar:avatarURL()});
        }
    });
}

function loadLB(){
    leaderboardList.innerHTML = "";
    db.ref(`scores/${lbLevel}`).orderByChild("score").limitToLast(5).once("value", s=>{
        const arr = [];
        s.forEach(x=> arr.push({n:x.key, s:x.val().score}));
        arr.sort((a,b)=> b.s - a.s);
        arr.forEach((e,i)=>{
            const li = document.createElement("li");
            let medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
            const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${e.n}`;
            li.innerHTML = `
                <div class="lb-item ${e.n===username?"me":""}">
                    <div class="lb-left">
                        <img src="${avatar}" class="lb-avatar">
                        <div>
                            <div class="lb-name">${medal} ${e.n}${e.n===username?'<span class="kamu">(kamu)</span>':''}</div>
                            <div class="lb-score">⭐ ${e.s}</div>
                        </div>
                    </div>
                </div>`;
            leaderboardList.appendChild(li);
        });
    });
}