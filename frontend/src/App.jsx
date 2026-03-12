import { useEffect, useMemo, useRef, useState } from "react";
import { api, setTokens, clearTokens, getToken } from "./api";

const DEFAULT_DIFFICULTY = "MEDIUM";

const TEXT_BANK = {
  EN: {
    EASY: [
      "typing every day helps your fingers remember common patterns and stay relaxed while you write",
      "focus on smooth rhythm first and speed will come after your hands feel stable on the keyboard",
      "short sessions with clear goals often work better than long sessions without attention to detail",
    ],
    MEDIUM: [
      "a reliable typing habit is built from repeatable actions, clean hand position, and consistent breathing during each run",
      "when you miss a key, recover quickly and continue moving forward instead of freezing on one small mistake in the line",
      "good accuracy saves more time than aggressive speed because corrections break your flow and reduce confident movement",
    ],
    HARD: [
      "precision under pressure means reading ahead, controlling tempo, and adapting to symbols like commas, dashes, and quotes.",
      "in advanced practice, numbers and punctuation such as 17, 42, and 99 should feel as familiar as letters in common words.",
      "train with varied structures: short clauses, long phrases, mixed case, and technical terms to improve real world performance.",
    ],
  },
  RU: {
    EASY: [
      "ровный ритм и спокойные движения помогают печатать быстрее и с меньшим количеством ошибок",
      "лучше тренироваться каждый день понемногу чем редко и слишком долго без концентрации",
      "смотри на текст заранее и не задерживайся на одной ошибке чтобы не терять темп",
    ],
    MEDIUM: [
      "уверенная печать строится на точности, правильной посадке и привычке держать руки в исходной позиции во время упражнения",
      "если символ пропущен, продолжай набор и исправляй только после завершения попытки, чтобы сохранять рабочий ритм",
      "скорость растет естественно, когда ты стабильно контролируешь попадания по клавишам и не зажимаешь кисти",
    ],
    HARD: [
      "сложный режим добавляет знаки препинания, цифры 3 7 9 и более длинные конструкции, где важно заранее видеть структуру фразы.",
      "при высокой нагрузке удерживай одинаковый темп: резкие рывки почти всегда снижают итоговую точность и портят результат.",
      "работай с разными формами текста: короткое предложение, длинная мысль, кавычки, двоеточие и сложные словосочетания.",
    ],
  },
  LV: {
    EASY: [
      "regulāri treniņi palīdz pirkstiem iegaumēt taustiņu secības un rakstīt mierīgāk",
      "sāc ar precizitāti un vienmērīgu tempu tad ātrums pieaugs dabiski bez lieka stresa",
      "īsi bet bieži vingrinājumi parasti dod labāku rezultātu nekā reti un ļoti gari mēģinājumi",
    ],
    MEDIUM: [
      "stabils rakstīšanas progress rodas no pareizas pozas, mierīgas elpošanas un uzmanīgas skatīšanās uz nākamo vārdu",
      "ja pieļauj kļūdu, turpini rakstīt un neatgriezies pie katras zīmes, lai nezaudētu plūdumu un ritmu",
      "precizitāte ilgtermiņā ietaupa vairāk laika nekā pārāk straujš temps ar biežu labošanas nepieciešamību",
    ],
    HARD: [
      "grūtajā režīmā tekstā ir komati, domuzīmes, cipari 12 48 73 un garākas konstrukcijas ar sarežģītāku ritmu.",
      "lai noturētu kvalitāti, lasa uz priekšu, saglabā vienmērīgu ātrumu un pielāgo kustības katrai frāzes daļai.",
      "trenējies ar dažādiem rakstiem: īsi teikumi, gari posmi, jaukts reģistrs un netipiski vārdu savienojumi.",
    ],
  },
};

const TARGET_TEXT_LENGTHS = {
  30: { EASY: 120, MEDIUM: 160, HARD: 210 },
  60: { EASY: 220, MEDIUM: 300, HARD: 380 },
  120: { EASY: 380, MEDIUM: 520, HARD: 680 },
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildPracticeText(language, difficulty, mode) {
  const langPack = TEXT_BANK[language] || TEXT_BANK.EN;
  const pool = langPack[difficulty] || langPack[DEFAULT_DIFFICULTY];
  const targetLen = TARGET_TEXT_LENGTHS[mode]?.[difficulty] || 720;

  const chunks = [];
  let currentLen = 0;
  let prev = "";

  while (currentLen < targetLen) {
    let next = pickRandom(pool);
    if (pool.length > 1 && next === prev) next = pickRandom(pool);
    chunks.push(next);
    currentLen += next.length + 1;
    prev = next;
  }

  return chunks.join(" ");
}

export default function App() {
  const [tab, setTab] = useState("game"); 
  const [mode, setMode] = useState(60);
  const [language, setLanguage] = useState("EN");
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [text, setText] = useState(() => buildPracticeText("EN", DEFAULT_DIFFICULTY, 60));

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [typed, setTyped] = useState("");
  const inputRef = useRef(null);

  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");

  // формы
  const [reg, setReg] = useState({ username: "", email: "", password: "" });
  const [log, setLog] = useState({ username: "", password: "" });

  // лидерборд
  const [lb, setLb] = useState(null);

  function showErr(e) {
    setMsg("❌ " + (e?.message || String(e)));
  }

  function showOk(s) {
    setMsg("✅ " + s);
  }

  function reset(silent = true, refreshText = false) {
    if (refreshText) {
      setText(buildPracticeText(language, difficulty, mode));
    }
    setStarted(false);
    setFinished(false);
    setTimeLeft(mode);
    setTyped("");
    if (!silent) setMsg("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // при смене режима/языка/сложности
  useEffect(() => {
    reset(true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, mode, difficulty]);

  // проверить токен на старте
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

  // таймер
  useEffect(() => {
    if (!started || finished) return;

    if (timeLeft <= 0) {
      setFinished(true);
      setStarted(false);
      return;
    }

    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [started, finished, timeLeft]);

  // метрики
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

    return { totalChars, correctChars, errors, wpm, accuracy, elapsed };
  }, [typed, text, mode, timeLeft]);

  function onChange(e) {
    const v = e.target.value;

    // старт по первому символу
    if (!started && !finished && v.length > 0) {
      setStarted(true);
      setTimeLeft(mode);
    }

    // защита от огромного ввода
    setTyped(v.slice(0, text.length + 40));
  }

  async function doRegister() {
    setMsg("");
    try {
      await api.register(reg);
      showOk("Registered. Now login.");
      setTab("auth");
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

  async function saveResult() {
    setMsg("");
    try {
      await api.saveResult({
        mode_seconds: mode,
        language,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        errors: metrics.errors,
        total_chars: metrics.totalChars,
        correct_chars: metrics.correctChars,
      });
      showOk("Result saved!");
    } catch (e) {
      showErr(e);
    }
  }

  async function loadLeaderboard() {
    try {
      const data = await api.leaderboard(mode, language, 20);
      setLb(data);
    } catch (e) {
      showErr(e);
    }
  }

  useEffect(() => {
    if (tab === "leaderboard") loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mode, language]);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.topRow}>
          <div style={S.brand}>
            <div>
              <div style={S.brandTitle}>Typing King</div>
              <div style={S.brandSub}>Type clean. Type fast.</div>
            </div>
          </div>

          <div style={S.nav}>
            <NavBtn active={tab === "game"} onClick={() => setTab("game")} text="Game" />
            <NavBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} text="Leaderboard" />
            <NavBtn active={tab === "auth"} onClick={() => setTab("auth")} text="Auth" />
          </div>

          <div style={S.userBox}>
            {me ? (
              <>
                <span style={S.userTag}>@{me.username}</span>
                <button style={S.btnGhost} onClick={doLogout}>Logout</button>
              </>
            ) : (
              <span style={S.userGuest}>Guest</span>
            )}
          </div>
        </div>

        <div style={S.controls}>
          <div style={S.controlsLeft}>
            <select value={mode} onChange={(e) => setMode(parseInt(e.target.value, 10))} style={S.select} disabled={started}>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>120s</option>
            </select>

            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={S.select} disabled={started}>
              <option value="EN">EN</option>
              <option value="RU">RU</option>
              <option value="LV">LV</option>
            </select>

            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={S.selectWide} disabled={started}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <button style={S.btn} onClick={() => reset(false, true)}>Reset</button>
          </div>

          <div style={S.controlsRight}>
            <MiniStat label="Time" value={`${timeLeft}s`} />
            <MiniStat label="WPM" value={finished ? metrics.wpm : "—"} />
            <MiniStat label="Acc" value={finished ? `${metrics.accuracy}%` : "—"} />
          </div>
        </div>

        {msg && (
          <div style={{ ...S.msg, ...(msg.startsWith("❌") ? S.msgErr : S.msgOk) }}>
            {msg}
          </div>
        )}

        {tab === "game" && (
          <GameView
            text={text}
            typed={typed}
            onChange={onChange}
            inputRef={inputRef}
            finished={finished}
            started={started}
            metrics={metrics}
            me={me}
            saveResult={saveResult}
          />
        )}

        {tab === "auth" && (
          <AuthView
            reg={reg}
            setReg={setReg}
            log={log}
            setLog={setLog}
            doRegister={doRegister}
            doLogin={doLogin}
          />
        )}

        {tab === "leaderboard" && <LeaderboardView lb={lb} />}
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, text }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.navBtn,
        ...(active ? S.navBtnActive : null),
      }}
    >
      {text}
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={S.miniStat}>
      <div style={S.miniStatLabel}>{label}</div>
      <div style={S.miniStatValue}>{value}</div>
    </div>
  );
}

function GameView({ text, typed, onChange, inputRef, finished, metrics, me, saveResult }) {
  const targetChars = text.split("");

  return (
    <>
      <div style={S.textBox} onClick={() => inputRef.current?.focus()}>
        {targetChars.map((ch, idx) => {
          const typedCh = typed[idx];
          let st = S.ch;

          if (typedCh === undefined) st = { ...st, opacity: 0.7 };
          else if (typedCh === ch) st = { ...st, color: "#9fffb3" };
          else st = { ...st, color: "#ff8a8a", textDecoration: "underline" };

          const isCaret = !finished && idx === typed.length;

          return (
            <span key={idx} style={{ position: "relative" }}>
              {isCaret && <span style={S.caret} />}
              <span style={st}>{ch === " " ? "·" : ch}</span>
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={onChange}
        disabled={finished}
        style={S.hiddenInput}
        autoFocus
      />

      {!finished && (
        <div style={S.hint}>Кликни по тексту и печатай — таймер стартует автоматически.</div>
      )}

      {finished && (
        <div style={S.result}>
          <div style={S.resultTitle}>Результат</div>

          <div style={S.resultGrid}>
            <ResultRow label="WPM" value={metrics.wpm} />
            <ResultRow label="Accuracy" value={`${metrics.accuracy}%`} />
            <ResultRow label="Errors" value={metrics.errors} />
            <ResultRow label="Total chars" value={metrics.totalChars} />
            <ResultRow label="Correct chars" value={metrics.correctChars} />
            <ResultRow label="Time" value={`${metrics.elapsed}s`} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            {me ? (
              <button style={S.btn} onClick={saveResult}>Save result</button>
            ) : (
              <div style={{ opacity: 0.7, fontSize: 13 }}>Войдите, чтобы сохранять результаты.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AuthView({ reg, setReg, log, setLog, doRegister, doLogin }) {
  return (
    <div style={S.authGrid}>
      <div style={S.authBox}>
        <div style={S.authTitle}>Register</div>
        <input style={S.inp} placeholder="Username" value={reg.username} onChange={(e) => setReg({ ...reg, username: e.target.value })} />
        <input style={S.inp} placeholder="Email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
        <input style={S.inp} placeholder="Password" type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} />
        <button style={S.btn} onClick={doRegister}>Create account</button>
      </div>

      <div style={S.authBox}>
        <div style={S.authTitle}>Login</div>
        <input style={S.inp} placeholder="Username" value={log.username} onChange={(e) => setLog({ ...log, username: e.target.value })} />
        <input style={S.inp} placeholder="Password" type="password" value={log.password} onChange={(e) => setLog({ ...log, password: e.target.value })} />
        <button style={S.btn} onClick={doLogin}>Login</button>
      </div>
    </div>
  );
}

function LeaderboardView({ lb }) {
  if (!lb) return <div style={{ opacity: 0.7, marginTop: 16 }}>Loading...</div>;

  return (
    <div style={S.lb}>
      <div style={S.lbTitle}>
        Top — {lb.mode_seconds}s / {lb.language}
      </div>

      <div style={S.lbTable}>
        <div style={{ ...S.lbRow, fontWeight: 800, opacity: 0.8 }}>
          <div>#</div>
          <div>User</div>
          <div>WPM</div>
          <div>Acc</div>
          <div>Date</div>
        </div>

        {lb.top.length === 0 && <div style={{ opacity: 0.7, padding: 10 }}>No results yet</div>}

        {lb.top.map((r, i) => (
          <div key={i} style={S.lbRow}>
            <div>{i + 1}</div>
            <div>@{r.username}</div>
            <div>{Math.round(r.wpm)}</div>
            <div>{Math.round(r.accuracy * 10) / 10}%</div>
            <div style={{ opacity: 0.7 }}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultRow({ label, value }) {
  return (
    <div style={S.resultRow}>
      <div style={S.resultLabel}>{label}</div>
      <div style={S.resultValue}>{value}</div>
    </div>
  );
}

const S = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "var(--bg-canvas)",
    color: "var(--text-main)",
    fontFamily: "\"Manrope\", \"Segoe UI\", Tahoma, sans-serif",
    padding: "clamp(8px, 1.2vw, 14px)",
    overflow: "hidden",
  },
  card: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(165deg, var(--panel-top) 0%, var(--panel-bottom) 100%)",
    border: "1px solid var(--line-soft)",
    borderRadius: 18,
    padding: "clamp(10px, 1.4vw, 18px)",
    boxShadow: "0 24px 80px rgba(2, 8, 24, 0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(6px)",
    animation: "appFadeUp .45s ease both",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  brand: { display: "flex", gap: 12, alignItems: "center", paddingRight: 8 },
  brandIcon: { fontSize: 22, filter: "drop-shadow(0 4px 10px rgba(255,196,107,0.35))" },
  brandTitle: { fontWeight: 800, fontSize: "clamp(20px, 1.7vw, 30px)", letterSpacing: "-0.02em", lineHeight: 1 },
  brandSub: {
    fontSize: 10,
    color: "var(--text-muted)",
    marginTop: 3,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  nav: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    padding: 3,
    border: "1px solid var(--line-soft)",
    borderRadius: 12,
    background: "rgba(13,21,40,0.4)",
    flexWrap: "wrap",
  },
  navBtn: {
    padding: "7px 12px",
    borderRadius: 9,
    border: "1px solid transparent",
    color: "var(--text-main)",
    cursor: "pointer",
    background: "transparent",
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: "0.01em",
  },
  navBtnActive: {
    background: "linear-gradient(180deg, rgba(107,171,255,0.24), rgba(81,127,255,0.12))",
    border: "1px solid rgba(130,176,255,0.36)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), 0 10px 22px rgba(43,93,209,0.22)",
  },
  userBox: { display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" },
  userTag: {
    opacity: 0.95,
    fontWeight: 600,
    padding: "7px 10px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--line-soft)",
    fontSize: 14,
  },
  userGuest: { opacity: 0.72, fontWeight: 600, fontSize: 14 },

  controls: { display: "flex", gap: 8, alignItems: "stretch", marginTop: 10, flexWrap: "wrap" },
  controlsLeft: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  controlsRight: { marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" },
  select: {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid var(--line-soft)",
    background: "rgba(9,16,31,0.86)",
    color: "var(--text-main)",
    fontWeight: 600,
    minWidth: 72,
    fontSize: 14,
    outline: "none",
  },
  selectWide: {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid var(--line-soft)",
    background: "rgba(9,16,31,0.86)",
    color: "var(--text-main)",
    fontWeight: 600,
    minWidth: 106,
    fontSize: 14,
    outline: "none",
  },
  btn: {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid var(--line-soft)",
    background: "linear-gradient(180deg, rgba(36,62,109,0.7), rgba(20,33,62,0.7))",
    color: "var(--text-main)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  btnGhost: {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid var(--line-soft)",
    background: "rgba(255,255,255,0.02)",
    color: "var(--text-main)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  miniStat: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    border: "1px solid var(--line-soft)",
    minWidth: 84,
  },
  miniStatLabel: { opacity: 0.74, fontSize: 11, marginBottom: 4 },
  miniStatValue: { fontWeight: 800, fontSize: "clamp(20px, 1.8vw, 28px)", lineHeight: 1 },

  msg: {
    marginTop: 8,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid var(--line-soft)",
    fontSize: 12,
    background: "rgba(255,255,255,0.03)",
  },
  msgOk: { border: "1px solid rgba(108,232,170,0.36)", background: "rgba(108,232,170,0.12)" },
  msgErr: { border: "1px solid rgba(255,138,138,0.36)", background: "rgba(255,138,138,0.12)" },

  textBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(9,15,29,0.82), rgba(6,11,22,0.92))",
    border: "1px solid var(--line-soft)",
    fontSize: "clamp(14px, 1.35vw, 22px)",
    lineHeight: 1.45,
    userSelect: "none",
    cursor: "text",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    letterSpacing: "0.01em",
  },
  ch: { fontFamily: "\"JetBrains Mono\", \"Cascadia Mono\", Consolas, monospace" },
  caret: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 2,
    height: "1.2em",
    background: "#ffffff",
    opacity: 0.95,
    boxShadow: "0 0 10px rgba(255,255,255,0.9)",
    animation: "caretPulse 1s steps(1) infinite",
  },
  hiddenInput: { position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 },

  hint: { marginTop: 8, opacity: 0.78, fontSize: 12, color: "var(--text-muted)" },

  result: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid var(--line-soft)",
    background: "rgba(255,255,255,0.03)",
  },
  resultTitle: { fontWeight: 900, marginBottom: 8, fontSize: 15, letterSpacing: "0.01em" },
  resultGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 },
  resultRow: {
    padding: 8,
    borderRadius: 10,
    background: "rgba(9,16,31,0.86)",
    border: "1px solid var(--line-soft)",
  },
  resultLabel: { opacity: 0.72, fontSize: 11, marginBottom: 4 },
  resultValue: { fontWeight: 800, fontSize: 15, lineHeight: 1.1 },

  authGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 10 },
  authBox: {
    padding: 10,
    borderRadius: 12,
    background: "rgba(9,16,31,0.86)",
    border: "1px solid var(--line-soft)",
  },
  authTitle: { fontWeight: 900, marginBottom: 8, fontSize: 15 },
  inp: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid var(--line-soft)",
    background: "rgba(6,12,24,0.9)",
    color: "var(--text-main)",
    marginBottom: 8,
    outline: "none",
    fontSize: 14,
  },

  lb: { marginTop: 10 },
  lbTitle: { fontWeight: 900, marginBottom: 8, letterSpacing: "0.01em", fontSize: 15 },
  lbTable: { borderRadius: 12, overflow: "hidden", border: "1px solid var(--line-soft)" },
  lbRow: {
    display: "grid",
    gridTemplateColumns: "40px minmax(120px, 1fr) 70px 70px 150px",
    gap: 8,
    padding: "8px 10px",
    background: "rgba(9,16,31,0.86)",
    borderBottom: "1px solid var(--line-soft)",
    minWidth: 0,
    fontSize: 12,
  },
};
