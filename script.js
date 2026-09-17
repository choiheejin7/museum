/* 박물관 유물 이름 맞추기, 퍼즐, 진짜 유물 찾기 미니게임 */

// 이 배열의 image 경로와 name만 바꾸면 유물 이름 맞추기 내용이 변경됩니다.
const artifactData = [
  { id: 1, name: "청동 거울", image: "assets/artifacts/mirror.svg" },
  { id: 2, name: "도자기 항아리", image: "assets/artifacts/pot.svg" },
  { id: 3, name: "금빛 왕관", image: "assets/artifacts/crown.svg" },
  { id: 4, name: "돌로 만든 잔", image: "assets/artifacts/vase.svg" }
];

// puzzleImage의 경로만 바꾸면 퍼즐 사진이 변경됩니다.
const puzzleData = { image: "assets/puzzle/puzzle-artifact.jpg", title: "박물관의 보물" };

// 문제마다 2~3개의 이미지를 넣고 isReal로 정답을 지정합니다.
const realFakeQuestions = [
  { question: 1, items: [{ image: "assets/realfake/item1.jpg", isReal: true }, { image: "assets/realfake/item2.jpg", isReal: false }, { image: "assets/realfake/item3.jpg", isReal: false }] },
  { question: 2, items: [{ image: "assets/realfake/item4.jpg", isReal: false }, { image: "assets/realfake/item5.jpg", isReal: true }] },
  { question: 3, items: [{ image: "assets/realfake/item6.jpg", isReal: false }, { image: "assets/realfake/item7.jpg", isReal: false }, { image: "assets/realfake/item8.jpg", isReal: true }] },
  { question: 4, items: [{ image: "assets/realfake/item9.jpg", isReal: true }, { image: "assets/realfake/item10.jpg", isReal: false }] },
  { question: 5, items: [{ image: "assets/realfake/item11.jpg", isReal: false }, { image: "assets/realfake/item12.jpg", isReal: true }, { image: "assets/realfake/item13.jpg", isReal: false }] }
];

const app = document.querySelector("#app");
const state = { screen: "start", matchSolved: new Set(), matchAssignments: {}, matchFeedback: "", puzzleOrder: [], puzzleDragging: null, realIndex: 0, realScore: 0, realAnswered: false };

// 이미지가 아직 없을 때도 화면이 깨지지 않도록 파일명 기반 placeholder를 표시합니다.
function placeholderImage(src) {
  const label = src.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><rect width="800" height="520" fill="#dce9df"/><circle cx="650" cy="110" r="100" fill="#eebc56" opacity=".65"/><path d="M120 430L290 240l95 95 70-80 225 175H120z" fill="#196f73" opacity=".8"/><text x="400" y="475" fill="#20353b" font-size="28" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function imageTag(src, alt, className = "") {
  return `<img class="${className}" src="${src}" alt="${alt}" onerror="this.onerror=null;this.src='${placeholderImage(src)}'">`;
}

function button(label, className, action, disabled = false) {
  return `<button class="${className}" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
}

function render() {
  if (state.screen === "start") renderStart();
  if (state.screen === "menu") renderMenu();
  if (state.screen === "match") renderMatch();
  if (state.screen === "puzzle") renderPuzzle();
  if (state.screen === "realfake") renderRealFake();
  bindActions();
}

function renderStart() {
  app.innerHTML = `<section class="screen center-screen"><div class="hero-mark">✦</div><div class="eyebrow">MUSEUM EXIT EXPERIENCE</div><h1>미니게임 3종</h1><p class="lead">오늘 만난 유물들을 재미있게 다시 만나 보세요</p>${button("START", "primary-button", "menu")}</section>`;
}

function renderMenu() {
  app.innerHTML = `<section class="screen center-screen"><div class="eyebrow">MUSEUM MINI GAMES</div><h2>게임을 선택해 주세요!</h2><div class="menu-list">${button('<span class="menu-number">1</span>유물 이름 맞추기', "menu-button", "match")}${button('<span class="menu-number">2</span>퍼즐 맞추기', "menu-button", "puzzle")}${button('<span class="menu-number">3</span>진짜 유물을 찾아라', "menu-button", "realfake")}</div></section>`;
}

function topbar(title, backAction = "menu") {
  return `<div class="topbar">${button("← 돌아가기", "back-button", backAction)}<div class="title-block"><div class="eyebrow">MUSEUM MINI GAME</div><h2>${title}</h2></div><div aria-hidden="true" style="width:104px"></div></div>`;
}

function renderMatch() {
  const allSolved = state.matchSolved.size === artifactData.length;
  if (allSolved) {
    app.innerHTML = `<section class="screen center-screen finish-panel"><div class="finish-icon">🏛</div><div class="eyebrow">MISSION COMPLETE</div><h2>모든 유물을 맞췄어요!</h2><p class="lead">${artifactData.length}개 모두 정답이에요.</p><div class="action-row">${button("게임 선택으로 돌아가기", "primary-button", "menu")}</div></section>`;
    return;
  }
  const assignedNames = Object.values(state.matchAssignments);
  app.innerHTML = `<section class="screen game-board">${topbar("유물 이름 맞추기")}<p class="game-hint">유물의 이름을 알맞은 사진에 연결한 뒤 정답을 확인해 보세요!</p><div class="match-layout"><div class="panel"><div class="panel-title">유물 사진</div><div class="artifact-grid">${artifactData.map(item => { const assignedId = state.matchAssignments[item.id]; const assignedItem = artifactData.find(nameItem => nameItem.id === assignedId); return `<div class="artifact-card" data-artifact-id="${item.id}">${imageTag(item.image, item.name)}<div class="artifact-label">${assignedItem ? assignedItem.name : "이곳에 놓아 주세요"}</div></div>`; }).join("")}</div></div><div class="panel"><div class="panel-title">유물 이름 카드</div><div class="name-list">${artifactData.filter(item => !assignedNames.includes(item.id)).map(item => `<button class="name-card" draggable="false" data-artifact-id="${item.id}">${item.name}</button>`).join("")}</div><div id="match-feedback" class="feedback">${state.matchFeedback || "카드를 사진 위로 끌어 보세요."}</div>${button("정답 확인", "next-button", "check-match", assignedNames.length !== artifactData.length)}</div></div></section>`;
  bindMatchDrag();
}

function renderPuzzle() {
  if (!state.puzzleOrder.length) state.puzzleOrder = shuffle([...Array(9).keys()]);
  const solved = state.puzzleOrder.every((value, index) => value === index);
  app.innerHTML = `<section class="screen game-board">${topbar("퍼즐 맞추기")}<p class="game-hint">흩어진 유물을 다시 완성해 보세요!</p><div class="puzzle-layout"><div class="puzzle-grid">${state.puzzleOrder.map((piece, index) => `<div class="puzzle-piece ${piece === index ? "correct" : ""}" data-position="${index}" data-piece="${piece}" style="--puzzle-image:url('${puzzleData.image}') ; background-position:${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%;"></div>`).join("")}</div><div class="puzzle-side panel">${solved ? `<div class="finish-icon">✨</div><h2>유물이 완성되었어요!</h2>${imageTag(puzzleData.image, puzzleData.title)}<div class="action-row">${button("다시 하기", "ghost-button", "puzzle-restart")}${button("게임 선택으로 돌아가기", "primary-button", "menu")}</div>` : `<h2>한 조각씩<br>자리를 찾아 주세요</h2><p>퍼즐 조각을 눌러 다른 조각과 자리를 바꿔 보세요.</p>`}</div></div></section>`;
  bindPuzzleDrag();
}

function renderRealFake() {
  if (state.realIndex >= realFakeQuestions.length) {
    app.innerHTML = `<section class="screen center-screen finish-panel"><div class="finish-icon">🏆</div><div class="eyebrow">MISSION COMPLETE</div><h2>${realFakeQuestions.length}문제 중 ${state.realScore}문제를 맞췄어요!</h2><p class="score-text">진짜 유물을 알아보는 눈이 생겼어요.</p><div class="action-row">${button("다시 도전하기", "primary-button", "realfake-restart")}${button("게임 선택으로 돌아가기", "ghost-button", "menu")}</div></section>`;
    return;
  }
  const current = realFakeQuestions[state.realIndex];
  app.innerHTML = `<section class="screen game-board">${topbar("진짜 유물을 찾아라")}<div class="question-count">${state.realIndex + 1} / ${realFakeQuestions.length}</div><p class="game-hint">박물관에서 본 진짜 유물은 무엇일까요?</p><div class="real-grid">${current.items.map((item, index) => `<button class="real-item" data-real-index="${index}">${imageTag(item.image, `유물 후보 ${index + 1}`)}<span>유물 후보 ${index + 1}</span></button>`).join("")}</div><div id="real-feedback" class="feedback"></div><div class="action-row">${button("다음 문제", "next-button", "real-next", true)}</div></section>`;
  bindRealFake();
}

function shuffle(array) { return array.sort(() => Math.random() - .5); }

function bindActions() {
  app.querySelectorAll("[data-action]").forEach(element => element.addEventListener("click", () => {
    const action = element.dataset.action;
    if (action === "menu") { state.screen = "menu"; }
    if (action === "match") { state.screen = "match"; state.matchSolved = new Set(); state.matchAssignments = {}; state.matchFeedback = ""; }
    if (action === "puzzle") { state.screen = "puzzle"; state.puzzleOrder = []; }
    if (action === "realfake") { state.screen = "realfake"; state.realIndex = 0; state.realScore = 0; state.realAnswered = false; }
    if (action === "puzzle-restart") { state.puzzleOrder = []; }
    if (action === "realfake-restart") { state.realIndex = 0; state.realScore = 0; state.realAnswered = false; }
    if (action === "real-next" && state.realAnswered) { state.realIndex += 1; state.realAnswered = false; }
    if (action === "check-match") { checkMatchAnswers(); return; }
    render();
  }));
}

// Pointer Events를 사용해 마우스와 태블릿 터치 드래그를 하나의 방식으로 처리합니다.
function bindMatchDrag() {
  let dragged = null;
  app.querySelectorAll(".name-card").forEach(card => {
    card.addEventListener("pointerdown", event => { dragged = card; card.classList.add("dragging"); card.setPointerCapture(event.pointerId); });
    card.addEventListener("pointerup", event => {
      if (!dragged) return;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".artifact-card");
      if (target) {
        const targetId = Number(target.dataset.artifactId);
        Object.keys(state.matchAssignments).forEach(artifactId => {
          if (state.matchAssignments[artifactId] === Number(dragged.dataset.artifactId)) delete state.matchAssignments[artifactId];
        });
        state.matchAssignments[targetId] = Number(dragged.dataset.artifactId);
        state.matchFeedback = "";
      }
      dragged.classList.remove("dragging"); dragged = null; render();
    });
  });
}

// 모든 이름 카드의 배치를 한 번에 채점하고, 오답이면 다시 배치할 수 있도록 초기화합니다.
function checkMatchAnswers() {
  const correctCount = artifactData.reduce((count, item) => count + (state.matchAssignments[item.id] === item.id ? 1 : 0), 0);
  const wrongCount = artifactData.length - correctCount;
  if (correctCount === artifactData.length) {
    state.matchSolved = new Set(artifactData.map(item => item.id));
    return render();
  }
  state.matchAssignments = {};
  state.matchFeedback = `정답 ${correctCount}개, 틀린 ${wrongCount}개예요. 다시 시도해 보세요!`;
  render();
}

function bindPuzzleDrag() {
  app.querySelectorAll(".puzzle-piece").forEach(piece => piece.addEventListener("pointerdown", event => {
    state.puzzleDragging = piece; piece.classList.add("dragging"); piece.setPointerCapture(event.pointerId);
  }));
  app.querySelectorAll(".puzzle-piece").forEach(piece => piece.addEventListener("pointerup", event => {
    if (!state.puzzleDragging || state.puzzleDragging === piece) { state.puzzleDragging?.classList.remove("dragging"); state.puzzleDragging = null; return; }
    const from = Number(state.puzzleDragging.dataset.position); const to = Number(piece.dataset.position);
    [state.puzzleOrder[from], state.puzzleOrder[to]] = [state.puzzleOrder[to], state.puzzleOrder[from]];
    state.puzzleDragging = null; render();
  }));
}

function bindRealFake() {
  const current = realFakeQuestions[state.realIndex];
  app.querySelectorAll(".real-item").forEach((card, index) => card.addEventListener("click", () => {
    if (state.realAnswered) return;
    state.realAnswered = true;
    const feedback = document.querySelector("#real-feedback");
    if (current.items[index].isReal) { state.realScore += 1; card.classList.add("correct"); feedback.textContent = "정답이에요! 박물관에서 본 유물이에요."; feedback.className = "feedback success"; }
    else { card.classList.add("wrong"); feedback.textContent = "가짜 유물이에요! 다시 한번 생각해 볼까요?"; feedback.className = "feedback"; }
    document.querySelector("[data-action='real-next']").disabled = false;
  }));
}

render();