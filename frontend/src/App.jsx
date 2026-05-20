import { useEffect, useRef, useState } from "react";
import { api, setToken, clearTokens, getToken } from "./api";

// --- Словари слов для каждого языка ---
const WORDS = {
  EN: [
    "follow", "now", "this", "life", "through", "should", "late", "school", "say", "another",
    "fact", "great", "in", "their", "most", "go", "high", "from", "make", "year",
    "when", "if", "as", "hold", "between", "house", "real", "she", "open", "work",
    "people", "govern", "increase", "water", "around", "story", "young", "part", "system", "while",
    "place", "number", "during", "small", "group", "might", "again", "point", "world", "hand",
    "home", "family", "under", "problem", "country", "large", "always", "without", "example", "begin",
  ],
  RU: [
    "пример", "время", "через", "жизнь", "факт", "маленький", "голова", "вечер", "точно", "слово",
    "открыть", "утро", "рука", "сейчас", "если", "между", "дом", "реальный", "вода", "история",
    "мир", "семья", "страна", "начать", "конец", "всегда", "проблема", "система", "группа", "большой",
    "снова", "работа", "город", "улица", "место", "почему", "потому", "важно", "быстро", "просто",
    "вместе", "народ", "право", "сила", "жить", "видеть", "думать", "часть", "новый", "старый",
    "первый", "только", "очень", "здесь", "после", "знать", "число", "путь", "свет", "дать",
  ],
  LV: [
    "tagad", "dzīve", "cauri", "skola", "teikt", "cits", "fakts", "cilvēks", "gads", "kad",
    "ja", "starp", "māja", "īsts", "atvērt", "vēlu", "ūdens", "stāsts", "pasaule", "ģimene",
    "valsts", "piemērs", "sākt", "beigas", "vienmēr", "problēma", "sistēma", "grupa", "mazs", "liels",
    "atkal", "punkts", "darbs", "pilsēta", "iela", "vārds", "laiks", "vieta", "roka", "galva",
    "diena", "nakts", "gaisma", "krāsa", "skaitlis", "ceļš", "daba", "zeme", "jūra", "kalns",
    "bērns", "vecāki", "draugs", "skaitīt", "rakstīt", "lasīt", "runāt", "dzīvot", "strādāt", "doties",
  ],
};

const MODES = [15, 30, 60, 120];
const LANGUAGES = [["EN", "english"], ["RU", "russian"], ["LV", "latvian"]];

// Берет словарь выбранного языка и собирает длинный текст из случайных слов.
// Эту строку потом пользователь набирает во время игры.
function generateWords(language, count = 120) {
  const pool = WORDS[language] || WORDS.EN;
  const words = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    words.push(pool[randomIndex]);
  }

  return words.join(" ");
}

// Сравнивает введенный текст с правильным текстом посимвольно.
// Возвращает количество символов, которые пользователь набрал правильно.
function countCorrectChars(text, typed) {
  let correct = 0;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correct++;
  }

  return correct;
}

// Главная формула статистики игры.
// На основе правильных символов и потраченного времени считает WPM, accuracy и ошибки.
function calculateStats(text, typed, modeSeconds, timeLeft) {
  const correctChars = countCorrectChars(text, typed);
  const typedChars = typed.length;
  const secondsUsed = modeSeconds - timeLeft;
  const minutesUsed = Math.max(secondsUsed / 60, 1 / 60);
  const errors = typedChars - correctChars;

  // В typing tests 1 word = 5 correct characters.
  const wpm = Math.round((correctChars / 5) / minutesUsed);
  const accuracy = typedChars === 0 ? 0 : Math.round((correctChars / typedChars) * 1000) / 10;

  return {
    wpm,
    accuracy,
    elapsed: secondsUsed,
    correct: correctChars,
    total: typedChars,
    errors,
    incorrect: errors,
  };
}

export default function App() {
  // --- Навигация ---
  const [tab, setTab] = useState("game");

  // --- Настройки игры ---
  const [mode, setMode] = useState(30);        // продолжительность: 15 / 30 / 60 / 120 сек
  const [language, setLanguage] = useState("EN");

  // --- Состояние игры ---
  const [text, setText] = useState(generateWords("EN", 120)); // текст для набора
  const [typed, setTyped] = useState("");      // что пользователь уже напечатал
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const inputRef = useRef(null);
  const alreadySavedRef = useRef(false); // флаг: результат уже сохранён

  // --- Авторизация ---
  const [user, setUser] = useState(null); // null = гость

  // --- Формы авторизации ---
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // --- Лидерборд ---
  const [leaderboard, setLeaderboard] = useState(null);

  // --- Статусное сообщение ---
  const [msg, setMsg] = useState("");

  function showError(e) {
    // Все ошибки показываем в одном месте, чтобы не дублировать setMsg в каждом catch.
    setMsg("Error: " + (e?.message || String(e)));
  }

  // Сбрасывает раунд: очищает ввод, ставит новый таймер и генерирует новый текст.
  // Используется при restart, смене режима и смене языка.
  function resetRound(nextMode = mode, nextLanguage = language) {
    setStarted(false);
    setFinished(false);
    setTimeLeft(nextMode);
    setTyped("");
    setText(generateWords(nextLanguage, 120));
    alreadySavedRef.current = false;
    setMsg("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function changeMode(nextMode) {
    // При смене времени сразу начинаем новый раунд с этим временем.
    setMode(nextMode);
    resetRound(nextMode, language);
  }

  function changeLanguage(nextLanguage) {
    // При смене языка сразу генерируем текст из словаря нового языка.
    setLanguage(nextLanguage);
    resetRound(mode, nextLanguage);
  }

  // При загрузке страницы — проверяем, есть ли сохранённый токен
  useEffect(() => {
    if (!getToken()) return;
    api.me()
      .then(setUser)
      .catch(() => { clearTokens(); setUser(null); });
  }, []);

  // Таймер — тикает каждую секунду пока идёт игра
  useEffect(() => {
    if (!started || finished) return;

    if (timeLeft <= 0) {
      setFinished(true);
      setStarted(false);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [started, finished, timeLeft]);

  // Считаем WPM, accuracy и ошибки на основе напечатанного текста
  const stats = calculateStats(text, typed, mode, timeLeft);

  // Вызывается при каждом нажатии клавиши
  function handleTyping(e) {
    const value = e.target.value;

    // Первый символ — запускаем таймер
    if (!started && !finished && value.length > 0) {
      setStarted(true);
      setTimeLeft(mode);
    }

    // Не даём напечатать больше, чем длина текста
    setTyped(value.slice(0, text.length));
  }

  // --- Авторизация ---

  async function register() {
    // Отправляем форму регистрации на backend.
    // Backend проверяет username/email и сохраняет пользователя в базе.
    setMsg("");
    try {
      await api.register(registerForm);
      setMsg("Registered. Now login.");
    } catch (e) {
      showError(e);
    }
  }

  async function login() {
    // Backend возвращает JWT token.
    // Token сохраняем в localStorage и используем для защищенных запросов.
    setMsg("");
    try {
      const tokens = await api.login(loginForm);
      setToken(tokens.access_token);
      const u = await api.me();
      setUser(u);
      setMsg("Logged in as " + u.username);
      setTab("game");
    } catch (e) {
      showError(e);
    }
  }

  function logout() {
    // При выходе удаляем tokens из браузера и снова считаем пользователя гостем.
    clearTokens();
    setUser(null);
    setMsg("Logged out");
  }

  // Сохраняем результат на сервер и обновляем лидерборд
  async function saveResult() {
    // Результат сохраняется только через backend, чтобы leaderboard брал данные из базы.
    try {
      await api.saveResult({
        mode_seconds: mode,
        language,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        errors: stats.errors,
        total_chars: stats.total,
        correct_chars: stats.correct,
      });
      const data = await api.leaderboard(mode, language, 20);
      setLeaderboard(data);
      setMsg("Saved to leaderboard");
    } catch (e) {
      showError(e);
    }
  }

  // Загружаем лидерборд при открытии вкладки или смене фильтров
  useEffect(() => {
    if (tab !== "leaderboard") return;
    setLeaderboard(null);
    api.leaderboard(mode, language, 20)
      .then(setLeaderboard)
      .catch((e) => setMsg("Error: " + (e?.message || String(e))));
  }, [tab, mode, language]);

  // Когда игра заканчивается — авто-сохраняем результат
  useEffect(() => {
    if (!finished) return;
    if (alreadySavedRef.current) return;
    alreadySavedRef.current = true;

    if (!user) {
      setMsg("Login to save results");
      return;
    }

    saveResult();
  }, [finished, user]);

  return (
    <div style={S.page}>
      {/* Шапка: название, навигация, имя пользователя */}
      <div style={S.topBar}>
        <span style={S.brand}>Typing King</span>

        <div style={S.topNav}>
          <NavBtn active={tab === "game"} onClick={() => setTab("game")} text="Game" />
          <NavBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} text="Leaderboard" />
          <NavBtn active={tab === "auth"} onClick={() => setTab("auth")} text="Auth" />
        </div>

        <div style={S.userBox}>
          {user ? (
            <>
              <span style={{ color: "#94a3b8" }}>@{user.username}</span>
              <button style={S.smallBtn} onClick={logout}>Logout</button>
            </>
          ) : (
            <span style={{ color: "#94a3b8" }}>Guest</span>
          )}
        </div>
      </div>

      {/* === ИГРА === */}
      {tab === "game" && (
        <>
          {!finished && (
            <>
              {/* Кнопки выбора режима и языка */}
              <div style={S.controlsBar}>
                {MODES.map((m) => (
                  <button key={m} style={mode === m ? S.modeBtnActive : S.modeBtn} onClick={() => changeMode(m)}>
                    {m}
                  </button>
                ))}

                <div style={S.sep} />

                {LANGUAGES.map(([code, label]) => (
                  <button key={code} style={language === code ? S.modeBtnActive : S.modeBtn} onClick={() => changeLanguage(code)}>
                    {label}
                  </button>
                ))}

                <div style={S.sep} />

                <button style={S.modeBtn} onClick={() => resetRound()}>restart</button>
              </div>

              {/* Живая статистика */}
              <div style={S.statsRow}>
                <Stat label="time" value={timeLeft} />
                <Stat label="wpm" value={stats.wpm} />
                <Stat label="acc" value={stats.accuracy + "%"} />
              </div>

              {msg && <div style={S.msg}>{msg}</div>}

              {/* Текст для набора — клик фокусирует скрытый инпут */}
              <div style={S.typingWrap} onClick={() => inputRef.current?.focus()}>
                <TypingText text={text} typed={typed} finished={finished} />
              </div>

              {/* Скрытый инпут — перехватывает все нажатия клавиш */}
              <input
                ref={inputRef}
                value={typed}
                onChange={handleTyping}
                disabled={finished}
                style={S.hiddenInput}
                autoFocus
              />
            </>
          )}

          {/* Экран результатов */}
          {finished && (
            <div style={S.resultScreen}>
              {msg && <div style={S.msg}>{msg}</div>}

              <div style={S.resultHeader}>
                <div style={S.resultMain}>
                  <div style={S.resultMainLabel}>WPM</div>
                  <div style={S.resultMainValue}>{stats.wpm}</div>
                </div>
                <div style={S.resultMain}>
                  <div style={S.resultMainLabel}>Accuracy</div>
                  <div style={S.resultMainValue}>{stats.accuracy}%</div>
                </div>
              </div>

              <div style={S.resultGrid}>
                <ResultCard label="Time" value={`${stats.elapsed}s`} />
                <ResultCard label="Errors" value={stats.errors} />
                <ResultCard label="Correct chars" value={stats.correct} />
                <ResultCard label="Incorrect chars" value={stats.incorrect} />
                <ResultCard label="Total chars" value={stats.total} />
                <ResultCard label="Language" value={language} />
              </div>

              <div style={S.resultActions}>
                <button style={S.primaryBtn} onClick={() => resetRound()}>Try again</button>
                <button style={S.smallBtn} onClick={() => setTab("leaderboard")}>Open leaderboard</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* === АВТОРИЗАЦИЯ === */}
      {tab === "auth" && (
        <>
          {msg && <div style={S.msg}>{msg}</div>}
          <div style={S.authGrid}>
            <div style={S.authBox}>
              <div style={S.authTitle}>Register</div>
              <input style={S.input} placeholder="Username" value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} />
              <input style={S.input} placeholder="Email" value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
              <input style={S.input} placeholder="Password" type="password" value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
              <button style={S.primaryBtn} onClick={register}>Create account</button>
            </div>

            <div style={S.authBox}>
              <div style={S.authTitle}>Login</div>
              <input style={S.input} placeholder="Username" value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
              <input style={S.input} placeholder="Password" type="password" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              <button style={S.primaryBtn} onClick={login}>Login</button>
            </div>
          </div>
        </>
      )}

      {/* === ЛИДЕРБОРД === */}
      {tab === "leaderboard" && (
        <>
          {msg && <div style={S.msg}>{msg}</div>}

          <div style={S.lbFilters}>
            {MODES.map((m) => (
              <button key={m} style={mode === m ? S.modeBtnActive : S.modeBtn} onClick={() => changeMode(m)}>
                {m}
              </button>
            ))}
            <div style={S.sep} />
            {["EN", "RU", "LV"].map((code) => (
              <button key={code} style={language === code ? S.modeBtnActive : S.modeBtn} onClick={() => changeLanguage(code)}>
                {code}
              </button>
            ))}
          </div>

          <div style={S.lbWrap}>
            <div style={S.lbTitle}>Leaderboard — {mode}s / {language}</div>

            {!leaderboard ? (
              <div style={{ color: "#94a3b8" }}>Loading...</div>
            ) : leaderboard.top.length === 0 ? (
              <div style={{ color: "#94a3b8" }}>No results yet</div>
            ) : (
              <div style={S.lbTable}>
                <div style={{ ...S.lbRow, fontWeight: 700 }}>
                  <div>#</div>
                  <div>User</div>
                  <div>WPM</div>
                  <div>Accuracy</div>
                  <div>Date</div>
                </div>
                {leaderboard.top.map((row, i) => (
                  <div key={i} style={S.lbRow}>
                    <div>{i + 1}</div>
                    <div>@{row.username}</div>
                    <div>{Math.round(row.wpm)}</div>
                    <div>{Math.round(row.accuracy * 10) / 10}%</div>
                    <div>{new Date(row.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function countTypedWords(text, typed) {
  // Считаем пробелы в уже введенной части текста.
  // Так понимаем, на каком слове сейчас находится пользователь.
  let currentWord = 0;

  for (let i = 0; i < typed.length; i++) {
    if (text[i] === " ") currentWord++;
  }

  return currentWord;
}

function getVisibleText(text, typed) {
  // Показываем не весь большой текст, а только часть вокруг текущего слова.
  // Так интерфейс похож на typing-тренажер и не перегружает экран.
  const words = text.split(" ");
  const currentWord = countTypedWords(text, typed);
  const startWord = Math.max(0, currentWord - 8);
  const visibleWords = words.slice(startWord, startWord + 24);
  const visibleText = visibleWords.join(" ");

  let startChar = 0;
  for (let i = 0; i < startWord; i++) {
    startChar += words[i].length + 1; // +1 because there is a space after each word
  }

  return { visibleText, startChar };
}

function getCharColor(expectedChar, typedChar) {
  // Серый - символ еще не набран, белый - правильно, красный - ошибка.
  if (typedChar === undefined) return "#8b92a6";
  if (typedChar === expectedChar) return "#e5e7eb";
  return "#ef4444";
}

// Отображает текст для набора с цветовой подсветкой.
function TypingText({ text, typed, finished }) {
  const { visibleText, startChar } = getVisibleText(text, typed);

  return (
    <div style={S.textArea}>
      {visibleText.split("").map((ch, idx) => {
        const realIndex = startChar + idx;
        const typedChar = typed[realIndex];
        const color = getCharColor(ch, typedChar);
        const isCaret = !finished && realIndex === typed.length;

        return (
          <span key={idx} style={{ position: "relative" }}>
            {isCaret && <span style={S.caret} />}
            <span style={{ ...S.char, color }}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
}

// Кнопка вкладки в навбаре
function NavBtn({ active, onClick, text }) {
  return (
    <button onClick={onClick} style={active ? S.navBtnActive : S.navBtn}>
      {text}
    </button>
  );
}

// Один блок живой статистики (время / wpm / accuracy)
function Stat({ label, value }) {
  return (
    <div style={S.bigStat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

// Карточка с одним показателем в экране результатов
function ResultCard({ label, value }) {
  return (
    <div style={S.resultCard}>
      <div style={S.resultCardLabel}>{label}</div>
      <div style={S.resultCardValue}>{value}</div>
    </div>
  );
}

// --- Стили ---
const S = {
  page: {
    minHeight: "100vh",
    background: "#1f2430",
    color: "#e5e7eb",
    fontFamily: "system-ui, sans-serif",
    padding: "24px 56px",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 34,
  },

  brand: {
    fontSize: 28,
    fontWeight: 700,
    color: "#f8fafc",
  },

  topNav: {
    display: "flex",
    gap: 12,
  },

  navBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
  },

  navBtnActive: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
  },

  userBox: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  controlsBar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#2b3242",
    padding: "14px 18px",
    borderRadius: 12,
    width: "fit-content",
    margin: "0 auto 28px auto",
  },

  modeBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
  },

  modeBtnActive: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
  },

  sep: {
    width: 4,
    height: 28,
    background: "#3b4252",
    borderRadius: 999,
  },

  statsRow: {
    display: "flex",
    gap: 40,
    justifyContent: "center",
    marginBottom: 24,
  },

  bigStat: {
    minWidth: 120,
    textAlign: "center",
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: 18,
  },

  statValue: {
    color: "#60a5fa",
    fontSize: 42,
    fontWeight: 700,
    lineHeight: 1.1,
  },

  msg: {
    maxWidth: 1000,
    margin: "0 auto 20px auto",
    color: "#facc15",
    fontSize: 18,
  },

  typingWrap: {
    maxWidth: 1420,
    margin: "0 auto",
    minHeight: 260,
    cursor: "text",
  },

  textArea: {
    fontFamily: "monospace",
    fontSize: 64,
    lineHeight: 1.45,
    color: "#8b92a6",
    wordBreak: "break-word",
    userSelect: "none",
    height: "calc(64px * 4.35)",
    overflow: "hidden",
  },

  char: {
    whiteSpace: "pre-wrap",
  },

  caret: {
    position: "absolute",
    left: 0,
    top: 8,
    width: 3,
    height: 62,
    background: "#60a5fa",
    borderRadius: 4,
  },

  hiddenInput: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
    width: 1,
    height: 1,
  },

  resultScreen: {
    maxWidth: 1100,
    margin: "30px auto 0 auto",
    background: "#2b3242",
    borderRadius: 18,
    padding: 28,
  },

  resultHeader: {
    display: "flex",
    gap: 24,
    marginBottom: 24,
  },

  resultMain: {
    flex: 1,
    background: "#232938",
    borderRadius: 16,
    padding: 20,
  },

  resultMainLabel: {
    color: "#94a3b8",
    fontSize: 18,
    marginBottom: 10,
  },

  resultMainValue: {
    color: "#f8fafc",
    fontSize: 52,
    fontWeight: 800,
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },

  resultCard: {
    background: "#232938",
    borderRadius: 14,
    padding: 18,
  },

  resultCardLabel: {
    color: "#94a3b8",
    fontSize: 15,
    marginBottom: 8,
  },

  resultCardValue: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: 700,
  },

  resultActions: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },

  primaryBtn: {
    background: "#60a5fa",
    color: "#0f172a",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 700,
  },

  smallBtn: {
    background: "transparent",
    color: "#e5e7eb",
    border: "1px solid #4b5563",
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 16,
  },

  authGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 22,
    maxWidth: 1200,
    margin: "0 auto",
  },

  authBox: {
    background: "#2b3242",
    borderRadius: 16,
    padding: 24,
  },

  authTitle: {
    fontSize: 26,
    color: "#f8fafc",
    marginBottom: 18,
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#232938",
    border: "1px solid #3b4252",
    color: "#f8fafc",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 18,
    marginBottom: 14,
    outline: "none",
  },

  lbFilters: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#2b3242",
    padding: "14px 18px",
    borderRadius: 12,
    width: "fit-content",
    margin: "0 auto 20px auto",
  },

  lbWrap: {
    maxWidth: 1200,
    margin: "0 auto",
    background: "#2b3242",
    borderRadius: 16,
    padding: 24,
  },

  lbTitle: {
    color: "#f8fafc",
    fontSize: 28,
    marginBottom: 18,
  },

  lbTable: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  lbRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr 120px 120px 260px",
    gap: 16,
    background: "#232938",
    borderRadius: 12,
    padding: "14px 16px",
    alignItems: "center",
  },
};
