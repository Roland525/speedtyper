import { useEffect, useMemo, useRef, useState } from "react";
import { api, setTokens, clearTokens, getToken } from "./api";

const WORDS = {
  EN: [
    "follow", "now", "this", "life", "through", "should", "late", "school", "say", "another",
    "fact", "great", "in", "should", "through", "go", "high", "from", "person", "year",
    "when", "if", "as", "hold", "between", "house", "real", "she", "open", "late",
    "person", "govern", "increase", "water", "around", "story", "young", "part", "system", "while",
    "place", "number", "during", "small", "group", "might", "again", "point", "world", "hand",
    "home", "family", "under", "problem", "country", "large", "always", "without", "example", "begin"
  ],
  RU: [
    "пример", "время", "через", "жизнь", "факт", "маленький", "голова", "вечер", "точно", "слово",
    "открыть", "утро", "рука", "сейчас", "если", "между", "дом", "реальный", "вода", "история",
    "мир", "семья", "страна", "начать", "конец", "всегда", "проблема", "система", "группа", "большой",
    "снова", "работа", "город", "улица", "место", "почему", "потому", "важно", "быстро", "просто"
  ],
  LV: [
    "tagad", "dzīve", "cauri", "skola", "teikt", "cits", "fakts", "cilvēks", "gads", "kad",
    "ja", "starp", "māja", "īsts", "atvērt", "vēlu", "ūdens", "stāsts", "pasaule", "ģimene",
    "valsts", "piemērs", "sākt", "beigas", "vienmēr", "problēma", "sistēma", "grupa", "mazs", "liels",
    "atkal", "punkts", "darbs", "pilsēta", "iela", "vārds", "laiks", "vieta", "roka", "galva"
  ]
};

function generateWords(language, count = 120) {
  const pool = WORDS[language] || WORDS.EN;
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return arr.join(" ");
}

export default function App() {
  const [tab, setTab] = useState("game");
  const [mode, setMode] = useState(30);
  const [language, setLanguage] = useState("EN");

  const [text, setText] = useState(generateWords("EN", 120));
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [typed, setTyped] = useState("");
  const inputRef = useRef(null);

  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");

  const [reg, setReg] = useState({ username: "", email: "", password: "" });
  const [log, setLog] = useState({ username: "", password: "" });

  const [lb, setLb] = useState(null);
  const autoSavedRef = useRef(false);

  function showErr(e) {
    setMsg("❌ " + (e?.message || String(e)));
  }

  function showOk(s) {
    setMsg("✅ " + s);
  }

  function reset(silent = true) {
    setStarted(false);
    setFinished(false);
    setTimeLeft(mode);
    setTyped("");
    setText(generateWords(language, 120));
    autoSavedRef.current = false;
    if (!silent) setMsg("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  useEffect(() => {
    setText(generateWords(language, 120));
    setStarted(false);
    setFinished(false);
    setTimeLeft(mode);
    setTyped("");
    autoSavedRef.current = false;
  }, [language, mode]);

  useEffect(() => {
    (async () => {
      if (!getToken()) return;
      try {
        const u = await api.me();
        setMe(u);
      } catch {
        clearTokens();
        setMe(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!started || finished) return;

    if (timeLeft <= 0) {
      setFinished(true);
      setStarted(false);
      return;
    }

    const id = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [started, finished, timeLeft]);

  const metrics = useMemo(() => {
    const target = text;
    const input = typed;

    const totalChars = input.length;
    let correctChars = 0;
    let errors = 0;

    for (let i = 0; i < input.length; i++) {
      if (i >= target.length) {
        errors++;
        continue;
      }
      if (input[i] === target[i]) correctChars++;
      else errors++;
    }

    const elapsed = mode - timeLeft;
    const minutes = Math.max(elapsed / 60, 1 / 60);
    const wpm = Math.round((correctChars / 5) / minutes);
    const accuracy =
      totalChars === 0 ? 0 : Math.round((correctChars / totalChars) * 1000) / 10;

    return {
      totalChars,
      correctChars,
      errors,
      wpm,
      accuracy,
      elapsed,
      incorrectChars: Math.max(totalChars - correctChars, 0),
    };
  }, [typed, text, mode, timeLeft]);

  function onChange(e) {
    const v = e.target.value;

    if (!started && !finished && v.length > 0) {
      setStarted(true);
      setTimeLeft(mode);
    }

    setTyped(v.slice(0, text.length));
  }

  async function doRegister() {
    setMsg("");
    try {
      await api.register(reg);
      showOk("Registered. Now login.");
    } catch (e) {
      showErr(e);
    }
  }

  async function doLogin() {
    setMsg("");
    try {
      const t = await api.login(log);
      setTokens(t.access_token, t.refresh_token);
      const u = await api.me();
      setMe(u);
      showOk("Logged in as " + u.username);
      setTab("game");
    } catch (e) {
      showErr(e);
    }
  }

  function doLogout() {
    clearTokens();
    setMe(null);
    showOk("Logged out");
  }

  async function saveResult(auto = false) {
    try {
      const payload = {
        mode_seconds: Number(mode),
        language: String(language),
        wpm: Number(metrics.wpm),
        accuracy: Number(metrics.accuracy),
        errors: Number(metrics.errors),
        total_chars: Number(metrics.totalChars),
        correct_chars: Number(metrics.correctChars),
      };

      await api.saveResult(payload);

      const data = await api.leaderboard(Number(mode), String(language), 20);
      setLb(data);

      if (auto) showOk("Saved to leaderboard");
      else showOk("Result saved");
    } catch (e) {
      showErr(e);
    }
  }

  async function loadLeaderboard() {
    try {
      const data = await api.leaderboard(Number(mode), String(language), 20);
      setLb(data);
    } catch (e) {
      showErr(e);
    }
  }

  useEffect(() => {
    if (tab === "leaderboard") loadLeaderboard();
  }, [tab, mode, language]);

  useEffect(() => {
    if (!finished) return;
    if (autoSavedRef.current) return;

    if (!me) {
      setMsg("ℹ️ Login to save results");
      autoSavedRef.current = true;
      return;
    }

    autoSavedRef.current = true;
    saveResult(true);
  }, [finished, me]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <div style={S.brandWrap}>
          <span style={S.logo}>👑</span>
          <span style={S.brand}>Typing King</span>
        </div>

        <div style={S.topNav}>
          <NavBtn active={tab === "game"} onClick={() => setTab("game")} text="Game" />
          <NavBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} text="Leaderboard" />
          <NavBtn active={tab === "auth"} onClick={() => setTab("auth")} text="Auth" />
        </div>

        <div style={S.userBox}>
          {me ? (
            <>
              <span style={{ color: "#94a3b8" }}>@{me.username}</span>
              <button style={S.smallBtn} onClick={doLogout}>Logout</button>
            </>
          ) : (
            <span style={{ color: "#94a3b8" }}>Guest</span>
          )}
        </div>
      </div>

      {tab === "game" && (
        <>
          {!finished && (
            <>
              <div style={S.controlsBar}>
                <button style={mode === 15 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(15)}>15</button>
                <button style={mode === 30 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(30)}>30</button>
                <button style={mode === 60 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(60)}>60</button>
                <button style={mode === 120 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(120)}>120</button>

                <div style={S.sep} />

                <button style={language === "EN" ? S.modeBtnActive : S.modeBtn} onClick={() => setLanguage("EN")}>english</button>
                <button style={language === "RU" ? S.modeBtnActive : S.modeBtn} onClick={() => setLanguage("RU")}>russian</button>
                <button style={language === "LV" ? S.modeBtnActive : S.modeBtn} onClick={() => setLanguage("LV")}>latvian</button>

                <div style={S.sep} />

                <button style={S.modeBtn} onClick={() => reset(false)}>restart</button>
              </div>

              <div style={S.statsRow}>
                <div style={S.bigStat}>
                  <div style={S.statLabel}>time</div>
                  <div style={S.statValue}>{timeLeft}</div>
                </div>
                <div style={S.bigStat}>
                  <div style={S.statLabel}>wpm</div>
                  <div style={S.statValue}>{metrics.wpm}</div>
                </div>
                <div style={S.bigStat}>
                  <div style={S.statLabel}>acc</div>
                  <div style={S.statValue}>{metrics.accuracy}%</div>
                </div>
              </div>

              {msg && <div style={S.msg}>{msg}</div>}

              <div style={S.typingWrap} onClick={() => inputRef.current?.focus()}>
                <ThreeLineText text={text} typed={typed} finished={finished} />
              </div>

              <input
                ref={inputRef}
                value={typed}
                onChange={onChange}
                disabled={finished}
                style={S.hiddenInput}
                autoFocus
              />
            </>
          )}

          {finished && (
            <div style={S.resultScreen}>
              {msg && <div style={S.msg}>{msg}</div>}

              <div style={S.resultHeader}>
                <div style={S.resultMain}>
                  <div style={S.resultMainLabel}>WPM</div>
                  <div style={S.resultMainValue}>{metrics.wpm}</div>
                </div>

                <div style={S.resultMain}>
                  <div style={S.resultMainLabel}>Accuracy</div>
                  <div style={S.resultMainValue}>{metrics.accuracy}%</div>
                </div>
              </div>

              <div style={S.resultGrid}>
                <ResultCard label="Time" value={`${metrics.elapsed}s`} />
                <ResultCard label="Errors" value={metrics.errors} />
                <ResultCard label="Correct chars" value={metrics.correctChars} />
                <ResultCard label="Incorrect chars" value={metrics.incorrectChars} />
                <ResultCard label="Total chars" value={metrics.totalChars} />
                <ResultCard label="Language" value={language} />
              </div>

              <div style={S.resultActions}>
                <button style={S.primaryBtn} onClick={() => reset(false)}>Try again</button>
                <button style={S.smallBtn} onClick={() => setTab("leaderboard")}>Open leaderboard</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "auth" && (
        <>
          {msg && <div style={S.msg}>{msg}</div>}
          <div style={S.authGrid}>
            <div style={S.authBox}>
              <div style={S.authTitle}>Register</div>
              <input
                style={S.input}
                placeholder="Username"
                value={reg.username}
                onChange={(e) => setReg({ ...reg, username: e.target.value })}
              />
              <input
                style={S.input}
                placeholder="Email"
                value={reg.email}
                onChange={(e) => setReg({ ...reg, email: e.target.value })}
              />
              <input
                style={S.input}
                placeholder="Password"
                type="password"
                value={reg.password}
                onChange={(e) => setReg({ ...reg, password: e.target.value })}
              />
              <button style={S.primaryBtn} onClick={doRegister}>Create account</button>
            </div>

            <div style={S.authBox}>
              <div style={S.authTitle}>Login</div>
              <input
                style={S.input}
                placeholder="Username"
                value={log.username}
                onChange={(e) => setLog({ ...log, username: e.target.value })}
              />
              <input
                style={S.input}
                placeholder="Password"
                type="password"
                value={log.password}
                onChange={(e) => setLog({ ...log, password: e.target.value })}
              />
              <button style={S.primaryBtn} onClick={doLogin}>Login</button>
            </div>
          </div>
        </>
      )}

      {tab === "leaderboard" && (
        <>
          {msg && <div style={S.msg}>{msg}</div>}

          <div style={S.lbFilters}>
            <button style={mode === 15 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(15)}>15</button>
            <button style={mode === 30 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(30)}>30</button>
            <button style={mode === 60 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(60)}>60</button>
            <button style={mode === 120 ? S.modeBtnActive : S.modeBtn} onClick={() => setMode(120)}>120</button>

            <div style={S.sep} />

            <button style={language === "EN" ? S.modeBtnActive : S.modeBtn} onClick={() => setLanguage("EN")}>EN</button>
            <button style={language === "RU" ? S.modeBtnActive : S.modeBtn} onClick={() => setLanguage("RU")}>RU</button>
            <button style={language === "LV" ? S.modeBtnActive : S.modeBtn} onClick={() => setLanguage("LV")}>LV</button>
          </div>

          <div style={S.lbWrap}>
            <div style={S.lbTitle}>Leaderboard — {mode}s / {language}</div>

            {!lb ? (
              <div style={{ color: "#94a3b8" }}>Loading...</div>
            ) : lb.top.length === 0 ? (
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

                {lb.top.map((r, i) => (
                  <div key={i} style={S.lbRow}>
                    <div>{i + 1}</div>
                    <div>@{r.username}</div>
                    <div>{Math.round(r.wpm)}</div>
                    <div>{Math.round(r.accuracy * 10) / 10}%</div>
                    <div>{new Date(r.created_at).toLocaleString()}</div>
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

function ThreeLineText({ text, typed, finished }) {
  const words = text.split(" ");
  let currentWordIndex = 0;

  for (let i = 0; i < typed.length; i++) {
    if (text[i] === " ") currentWordIndex++;
  }

  const visibleWordStart = Math.max(0, currentWordIndex - 8);
  const visibleWordEnd = visibleWordStart + 24;
  const visibleWords = words.slice(visibleWordStart, visibleWordEnd);
  const visibleText = visibleWords.join(" ");

  const startCharIndex =
    words.slice(0, visibleWordStart).join(" ").length +
    (visibleWordStart > 0 ? 1 : 0);

  const visibleChars = visibleText.split("");

  return (
    <div style={S.textArea}>
      {visibleChars.map((ch, idx) => {
        const realIndex = startCharIndex + idx;
        const typedCh = typed[realIndex];

        const style = {
          ...S.char,
          color:
            typedCh === undefined
              ? "#8b92a6"
              : typedCh === ch
              ? "#e5e7eb"
              : "#ef4444",
        };

        const isCaret = !finished && realIndex === typed.length;

        return (
          <span key={idx} style={{ position: "relative" }}>
            {isCaret && <span style={S.caret} />}
            <span style={style}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
}

function NavBtn({ active, onClick, text }) {
  return (
    <button onClick={onClick} style={active ? S.navBtnActive : S.navBtn}>
      {text}
    </button>
  );
}

function ResultCard({ label, value }) {
  return (
    <div style={S.resultCard}>
      <div style={S.resultCardLabel}>{label}</div>
      <div style={S.resultCardValue}>{value}</div>
    </div>
  );
}

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

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    fontSize: 22,
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