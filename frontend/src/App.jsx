import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";

const TOPIC_COLORS = {
  "DP": "#f97316",
  "Graphs": "#22d3ee",
  "Binary Search": "#818cf8",
  "Arrays": "#34d399",
  "Strings": "#f472b6",
  "Trees": "#a3e635",
  "Recursion": "#fb923c",
  "Stack/Queue": "#e879f9",
};

function getColor(topic) {
  for (const key of Object.keys(TOPIC_COLORS)) {
    if (topic?.toLowerCase().includes(key.toLowerCase())) return TOPIC_COLORS[key];
  }
  return "#34d399";
}

// ─── SECTION DETECTOR ────────────────────────────────────────────────────────
const SECTION_CONFIG = {
  "PROGRESSIVE QUESTIONS": {
    icon: "01",
    color: "#34d399",
    bg: "rgba(52,211,153,0.04)",
    border: "rgba(52,211,153,0.15)",
    accent: "#34d399",
    label: "PROGRESSIVE QUESTIONS",
    desc: "Easy → Medium → Hard",
  },
  "TRAP QUESTION": {
    icon: "02",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.04)",
    border: "rgba(245,158,11,0.15)",
    accent: "#f59e0b",
    label: "TRAP QUESTION",
    desc: "Watch out for these",
  },
  "COMMON MISTAKES": {
    icon: "03",
    color: "#f87171",
    bg: "rgba(248,113,113,0.04)",
    border: "rgba(248,113,113,0.15)",
    accent: "#f87171",
    label: "COMMON MISTAKES",
    desc: "Don't fall into these traps",
  },
  "LEARNING ROADMAP": {
    icon: "04",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.04)",
    border: "rgba(129,140,248,0.15)",
    accent: "#818cf8",
    label: "LEARNING ROADMAP",
    desc: "Your path to 80%+ accuracy",
  },
};

function detectSection(line) {
  for (const key of Object.keys(SECTION_CONFIG)) {
    if (line.toUpperCase().includes(key)) return SECTION_CONFIG[key];
  }
  return null;
}

// ─── INLINE RENDERER ─────────────────────────────────────────────────────────
function renderInline(text, baseColor = "#94a3b8") {
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={last} style={{ color: baseColor }}>{text.slice(last, match.index)}</span>);
    }
    const m = match[0];
    if (m.startsWith("`")) {
      parts.push(
        <code key={match.index} style={{
          background: "#0f172a", color: "#34d399",
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9em",
          padding: "2px 7px", borderRadius: 5,
          border: "1px solid rgba(52,211,153,0.2)",
          letterSpacing: 0,
        }}>{m.slice(1, -1)}</code>
      );
    } else if (m.startsWith("**")) {
      parts.push(<strong key={match.index} style={{ color: "#f1f5f9", fontWeight: 700 }}>{m.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={match.index} style={{ color: "#94a3b8", fontStyle: "italic" }}>{m.slice(1, -1)}</em>);
    }
    last = match.index + m.length;
  }
  if (last < text.length) parts.push(<span key={last} style={{ color: baseColor }}>{text.slice(last)}</span>);
  return parts.length ? parts : text;
}

// ─── CONTENT BLOCK ────────────────────────────────────────────────────────────
function ContentBlock({ line, sectionColor }) {
  const c = sectionColor || "#94a3b8";

  if (line.startsWith("#### ")) {
    return (
      <h4 style={{
        color: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: 3, margin: "20px 0 8px", textTransform: "uppercase",
      }}>{line.slice(5)}</h4>
    );
  }
  if (line.startsWith("### ")) {
    return (
      <h3 style={{
        color: "#e2e8f0", fontSize: 18, fontWeight: 700,
        fontFamily: "'Clash Display', 'Syne', sans-serif",
        margin: "20px 0 10px", lineHeight: 1.3,
      }}>{line.slice(4)}</h3>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 style={{
        color: c, fontSize: 17, fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        margin: "24px 0 12px", letterSpacing: 1,
      }}>
        <span style={{ opacity: 0.5, marginRight: 8 }}>//</span>
        {line.slice(3)}
      </h2>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h1 style={{
        color: "#f1f5f9", fontSize: 22, fontWeight: 800,
        fontFamily: "'Clash Display', 'Syne', sans-serif",
        margin: "0 0 16px",
      }}>{line.slice(2)}</h1>
    );
  }
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <div style={{ display: "flex", gap: 12, margin: "8px 0", alignItems: "flex-start" }}>
        <span style={{
          color: c, fontSize: 8, marginTop: 7, flexShrink: 0,
          background: c + "22", borderRadius: "50%",
          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>●</span>
        <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.75, margin: 0 }}>
          {renderInline(line.slice(2), "#94a3b8")}
        </p>
      </div>
    );
  }
  if (/^\d+\.\s/.test(line)) {
    const num = line.match(/^(\d+)\./)[1];
    const content = line.replace(/^\d+\.\s/, "");
    return (
      <div style={{ display: "flex", gap: 14, margin: "10px 0", alignItems: "flex-start" }}>
        <span style={{
          color: c, fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700, flexShrink: 0, marginTop: 2,
          background: c + "15", borderRadius: 6,
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
        }}>{num}</span>
        <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.75, margin: 0 }}>
          {renderInline(content, "#94a3b8")}
        </p>
      </div>
    );
  }
  if (line.trim() === "---") {
    return <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #1e293b, transparent)", margin: "20px 0" }} />;
  }
  if (line.trim() === "") return <div style={{ height: 6 }} />;

  return (
    <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.8, margin: "6px 0" }}>
      {renderInline(line, "#94a3b8")}
    </p>
  );
}

// ─── AI TEST RENDERER ────────────────────────────────────────────────────────
function AITestDisplay({ content, topic, username }) {
  const lines = content.split("\n");

  // Parse into sections
  const sections = [];
  let currentSection = null;
  let currentLines = [];

  for (const line of lines) {
    const sectionMatch = detectSection(line);
    const isHeader = line.startsWith("## ") || line.startsWith("# ") || line.startsWith("### ");
    const isSectionHeader = sectionMatch && isHeader;

    if (isSectionHeader) {
      if (currentSection || currentLines.length > 0) {
        sections.push({ config: currentSection, lines: currentLines });
      }
      currentSection = sectionMatch;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    sections.push({ config: currentSection, lines: currentLines });
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #0a0f1e 100%)",
        border: "1px solid #1e293b",
        borderRadius: 20, padding: "36px 40px", marginBottom: 32,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, right: 0, width: 300, height: 300,
          background: `radial-gradient(circle, ${getColor(topic)}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#34d39915", border: "1px solid #34d39930",
              borderRadius: 999, padding: "5px 14px", marginBottom: 16,
            }}>
              <span style={{ color: "#34d399", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>
                ◆ GEMINI AI GENERATED
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Clash Display', 'Syne', sans-serif",
              fontSize: 32, fontWeight: 800, color: "#f1f5f9",
              margin: "0 0 8px", lineHeight: 1.1,
            }}>
              Adaptive Test Plan
            </h1>
            <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
              Personalized for <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>@{username}</span>
              {" · "}Targeting <span style={{ color: getColor(topic), fontWeight: 600 }}>{topic}</span>
            </p>
          </div>
          <div style={{
            background: getColor(topic) + "15",
            border: `1px solid ${getColor(topic)}30`,
            borderRadius: 14, padding: "16px 20px", textAlign: "center",
          }}>
            <p style={{ color: "#475569", fontSize: 10, letterSpacing: 2, margin: "0 0 4px", fontFamily: "monospace" }}>FOCUS AREA</p>
            <p style={{ color: getColor(topic), fontSize: 20, fontWeight: 800, margin: 0, fontFamily: "'Syne', sans-serif" }}>{topic}</p>
          </div>
        </div>

        {/* Section nav dots */}
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {Object.values(SECTION_CONFIG).map((cfg, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 999, padding: "4px 10px",
            }}>
              <span style={{ color: cfg.color, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{cfg.icon}</span>
              <span style={{ color: cfg.color, fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, si) => {
        const cfg = section.config;
        if (!cfg) {
          // Unsectioned content at top
          if (section.lines.every(l => l.trim() === "")) return null;
          return (
            <div key={si} style={{ marginBottom: 24 }}>
              {section.lines.map((line, li) => (
                <ContentBlock key={li} line={line} sectionColor="#94a3b8" />
              ))}
            </div>
          );
        }

        return (
          <div key={si} style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderLeft: `4px solid ${cfg.color}`,
            borderRadius: 16, marginBottom: 24,
            overflow: "hidden",
            animation: `fadeUp 0.4s ease ${si * 0.08}s both`,
          }}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "20px 28px",
              borderBottom: `1px solid ${cfg.border}`,
              background: `linear-gradient(90deg, ${cfg.color}08, transparent)`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg.color + "20",
                border: `1px solid ${cfg.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13, fontWeight: 700, color: cfg.color,
              }}>{cfg.icon}</div>
              <div>
                <p style={{
                  color: cfg.color, fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700, letterSpacing: 2, margin: "0 0 2px",
                }}>{cfg.label}</p>
                <p style={{ color: "#334155", fontSize: 14, margin: 0 }}>{cfg.desc}</p>
              </div>
            </div>

            {/* Section content */}
            <div style={{ padding: "24px 28px" }}>
              {section.lines.map((line, li) => (
                <ContentBlock key={li} line={line} sectionColor={cfg.color} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RADAR CHART ─────────────────────────────────────────────────────────────
function RadarChart({ topics }) {
  if (!topics?.length) return null;
  const size = 260, cx = 130, cy = 130, r = 90;
  const n = topics.length;
  const pts = topics.map((t, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    const v = t.weakness;
    return {
      x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a),
      lx: cx + (r + 32) * Math.cos(a), ly: cy + (r + 32) * Math.sin(a),
      topic: t.topic, weakness: t.weakness, color: getColor(t.topic),
    };
  });
  const polygon = pts.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(l => (
        <polygon key={l} fill="none" stroke="#1e293b" strokeWidth="1"
          points={Array.from({ length: n }, (_, i) => {
            const a = (i / n) * 2 * Math.PI - Math.PI / 2;
            return `${cx + r * l * Math.cos(a)},${cy + r * l * Math.sin(a)}`;
          }).join(" ")} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#1e293b" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill="url(#rg)" stroke="#34d399" strokeWidth="2" strokeOpacity="0.7" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={p.color} />
          <circle cx={p.x} cy={p.y} r={10} fill={p.color} opacity={0.15} />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 9, fill: p.color, fontFamily: "monospace", fontWeight: 600 }}>
            {p.topic.length > 9 ? p.topic.slice(0, 8) + "…" : p.topic}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────
function HomeScreen({ onSearch }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [loading]);

  async function handleSubmit() {
    if (!input.trim()) return setError("Please enter a LeetCode username");
    setLoading(true); setError("");
    try {
      await axios.get(`${API}/analyze/${input.trim()}`);
      onSearch(input.trim());
    } catch {
      setError(`Could not find "${input}". Check the username.`);
      setLoading(false);
    }
  }

  return (
    <div style={s.homeWrap}>
      <div style={s.bgGrid} />
      <div style={s.bgGlow1} />
      <div style={s.bgGlow2} />
      <div style={s.homeInner}>
        <div style={s.homeLeft}>
          <div style={s.homeBadge}>AI-POWERED DSA ANALYSIS</div>
          <h1 style={s.homeHeading}>
            Know your<br />
            <span style={s.homeAccent}>weak spots.</span><br />
            Fix them fast.
          </h1>
          <p style={s.homeSubtitle}>
            Enter your LeetCode handle. Get a real-time ML analysis of your DSA weaknesses, curated problem recommendations, and a Gemini AI study plan.
          </p>
          <div style={s.inputCard}>
            <div style={s.inputLabel}>LEETCODE USERNAME</div>
            <div style={s.inputRow}>
              <span style={s.atSign}>@</span>
              <input style={s.input} type="text" placeholder="your_username"
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} autoFocus />
            </div>
            {error && <p style={s.errMsg}>{error}</p>}
            <button style={{ ...s.analyzeBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit} disabled={loading}>
              {loading ? `Analyzing${".".repeat(dots)}` : "Analyze My Profile →"}
            </button>
            <div style={s.tryRow}>
              <span style={{ color: "#334155", fontSize: 12 }}>Try: </span>
              {["neal_wu", "example_id"].map(u => (
                <span key={u} onClick={() => setInput(u)} style={s.tryChip}>{u}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={s.homeRight}>
          {[
            { icon: "◈", color: "#34d399", title: "Weakness Detection", desc: "ML-powered analysis across 8 DSA topics using your real submission data" },
            { icon: "◉", color: "#818cf8", title: "Smart Recommendations", desc: "Problems curated to your weakest areas — Easy, Medium, and Hard" },
            { icon: "◆", color: "#f472b6", title: "Gemini AI Study Plan", desc: "Progressive questions, trap problems, and a personalized 3-week roadmap" },
            { icon: "▲", color: "#fb923c", title: "Radar Visualization", desc: "See your skill distribution across all 8 topics at a glance" },
          ].map((f, i) => (
            <div key={i} style={{ ...s.featureCard, borderColor: f.color + "22" }}>
              <span style={{ color: f.color, fontSize: 18, marginRight: 12 }}>{f.icon}</span>
              <div>
                <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{f.title}</p>
                <p style={{ color: "#475569", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ username, onBack }) {
  const [data, setData] = useState(null);
  const [llm, setLlm] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [tab, setTab] = useState("weakness");

  useEffect(() => {
    axios.get(`${API}/analyze/${username}`).then(r => setData(r.data));
  }, [username]);

  async function generateTest() {
    setLlmLoading(true); setTab("test");
    try {
      const r = await axios.post(`${API}/generate/${username}`);
      setLlm(r.data.content);
    } catch { setLlm("Error generating content. Please try again."); }
    finally { setLlmLoading(false); }
  }

  const topics = data?.ranked_topics || [];
  const recs = data?.recommendations || [];

  return (
    <div style={s.dashWrap}>
      <div style={s.bgGlow1} />
      <header style={s.topNav}>
        <div style={s.navBrand}>
          <span style={s.navLogo}>⚡</span>
          <span style={s.navTitle}>DSA Mentor AI</span>
        </div>
        <div style={s.navTabs}>
          {[
            { id: "weakness", label: "Weakness" },
            { id: "recommendations", label: "Recommendations" },
            { id: "test", label: "AI Test" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              ...s.navTab,
              color: tab === t.id ? "#f1f5f9" : "#475569",
              borderBottom: tab === t.id ? "2px solid #34d399" : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={s.navRight}>
          <span style={s.navUser}>@{username}</span>
          {data && <span style={s.navSolved}>{data.total_solved} solved</span>}
          <button onClick={onBack} style={s.navBack}>← Back</button>
        </div>
      </header>

      <main style={s.dashMain}>

        {/* WEAKNESS TAB */}
        {tab === "weakness" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.pageTitle}>Weakness Analysis</h2>
                <p style={s.pageSub}>ML-powered breakdown across 8 DSA topics</p>
              </div>
              {data && (
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { label: "Easy", val: data.easy_solved, color: "#34d399" },
                    { label: "Medium", val: data.medium_solved, color: "#fbbf24" },
                    { label: "Hard", val: data.hard_solved, color: "#f87171" },
                  ].map(st => (
                    <div key={st.label} style={s.statPill}>
                      <span style={{ color: st.color, fontWeight: 700, fontSize: 18 }}>{st.val}</span>
                      <span style={{ color: "#475569", fontSize: 13, marginTop: 2 }}>{st.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!data ? (
              <div style={s.loading}><div style={s.spinner} /></div>
            ) : (
              <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {topics.map((t, i) => (
                    <div key={t.topic} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace",
                            background: i === 0 ? "#ff000022" : i === 1 ? "#ff880022" : "#ffffff11",
                            color: i === 0 ? "#f87171" : i === 1 ? "#fbbf24" : "#475569",
                          }}>#{i + 1}</span>
                          <span style={{ color: getColor(t.topic), fontSize: 16, fontWeight: 600 }}>{t.topic}</span>
                        </div>
                        <span style={{ color: "#475569", fontSize: 12, fontFamily: "monospace" }}>
                          {(t.weakness * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={s.barTrack}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          width: `${t.weakness * 100}%`,
                          background: `linear-gradient(90deg, ${getColor(t.topic)}66, ${getColor(t.topic)})`,
                          boxShadow: `0 0 12px ${getColor(t.topic)}33`,
                          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ width: 280, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  <RadarChart topics={topics} />
                  {data && (
                    <div style={{
                      background: "#0f172a", border: "1px solid #1e293b",
                      borderRadius: 12, padding: "16px 20px", textAlign: "center", width: "100%",
                    }}>
                      <p style={{ color: "#475569", fontSize: 13, margin: "0 0 4px", letterSpacing: 1 }}>WEAKEST TOPIC</p>
                      <p style={{ color: getColor(data.weakest_topic), fontSize: 20, fontWeight: 700, margin: 0 }}>
                        {data.weakest_topic}
                      </p>
                      <p style={{ color: "#334155", fontSize: 11, margin: "4px 0 0", fontFamily: "monospace" }}>
                        {(data.accuracy_on_weakest * 100).toFixed(1)}% accuracy · {data.solved_in_weakest} solved
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {tab === "recommendations" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.pageTitle}>Problem Recommendations</h2>
                <p style={s.pageSub}>
                  Curated for <span style={{ color: getColor(data?.weakest_topic), fontWeight: 600 }}>{data?.weakest_topic}</span>
                </p>
              </div>
            </div>
            {!data ? <div style={s.loading}><div style={s.spinner} /></div> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                  {recs.map((r, i) => {
                    const dc = r.difficulty === "Easy" ? "#34d399" : r.difficulty === "Medium" ? "#fbbf24" : "#f87171";
                    return (
                      <div key={r.title} style={{
                        background: "#0f172a", border: "1px solid #1e293b",
                        borderTop: `3px solid ${dc}`, borderRadius: 12, padding: "20px",
                        animation: `fadeUp 0.3s ease ${i * 0.08}s both`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                            fontFamily: "monospace", letterSpacing: 1,
                            background: dc + "22", color: dc, border: `1px solid ${dc}44`,
                          }}>{r.difficulty.toUpperCase()}</span>
                          <span style={{ color: "#1e293b", fontSize: 11, fontFamily: "monospace" }}>#{i + 1}</span>
                        </div>
                        <p style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600, marginBottom: 16, lineHeight: 1.4 }}>
                          {r.title}
                        </p>
                        <a href={`https://leetcode.com/problems/${r.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                          target="_blank" rel="noreferrer"
                          style={{ color: "#34d399", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
                          Open on LeetCode →
                        </a>
                      </div>
                    );
                  })}
                </div>
                <button style={s.aiBtn} onClick={generateTest}>◆ Generate AI Adaptive Test</button>
              </>
            )}
          </div>
        )}

        {/* AI TEST TAB */}
        {tab === "test" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {llmLoading && (
              <div style={s.loading}>
                <div style={s.spinner} />
                <p style={{ color: "#475569", marginTop: 16, fontSize: 14 }}>
                  Generating your personalized test plan...
                </p>
              </div>
            )}
            {!llmLoading && !llm && (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: "#f472b615", border: "1px solid #f472b630",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px", fontSize: 24,
                }}>◆</div>
                <p style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Generate Your AI Test Plan
                </p>
                <p style={{ color: "#334155", marginBottom: 32, fontSize: 14 }}>
                  Personalized questions, trap problems, and a 3-week roadmap — powered by Gemini AI
                </p>
                <button style={{ ...s.aiBtn, maxWidth: 320, margin: "0 auto" }} onClick={generateTest}>
                  ◆ Generate AI Adaptive Test
                </button>
              </div>
            )}
            {llm && (
              <AITestDisplay
                content={llm}
                topic={data?.weakest_topic || "DSA"}
                username={username}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; }
      body { background: #020817; color: #94a3b8; font-family: 'DM Sans', sans-serif; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #020817; }
      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      input::placeholder { color: #1e293b; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return username
    ? <Dashboard username={username} onBack={() => setUsername(null)} />
    : <HomeScreen onSearch={setUsername} />;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  homeWrap: {
    minHeight: "100vh", background: "#020817",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 24px", position: "relative", overflow: "hidden",
  },
  bgGrid: {
    position: "fixed", inset: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
    maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
  },
  bgGlow1: {
    position: "fixed", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)",
    top: "-200px", right: "-100px", pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)",
    bottom: "-100px", left: "-100px", pointerEvents: "none",
  },
  homeInner: { display: "flex", gap: 64, alignItems: "center", maxWidth: 1100, width: "100%", position: "relative" },
  homeLeft: { flex: 1, minWidth: 0 },
  homeBadge: {
    display: "inline-block", background: "#34d39915", color: "#34d399",
    border: "1px solid #34d39930", borderRadius: 999,
    padding: "4px 14px", fontSize: 11, fontWeight: 600, letterSpacing: 2, marginBottom: 24,
  },
  homeHeading: { fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1, marginBottom: 20 },
  homeAccent: { background: "linear-gradient(135deg, #34d399, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  homeSubtitle: { color: "#475569", fontSize: 18, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 },
  inputCard: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "28px", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" },
  inputLabel: { color: "#334155", fontSize: 11, letterSpacing: 2, marginBottom: 10, fontFamily: "monospace" },
  inputRow: { display: "flex", alignItems: "center", gap: 10, background: "#020817", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px", marginBottom: 16 },
  atSign: { color: "#34d399", fontFamily: "monospace", fontSize: 18, fontWeight: 700 },
  input: { flex: 1, background: "transparent", border: "none", color: "#f1f5f9", fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none" },
  errMsg: { color: "#f87171", fontSize: 12, marginBottom: 12 },
  analyzeBtn: { width: "100%", background: "linear-gradient(135deg, #34d399, #059669)", color: "#020817", border: "none", borderRadius: 10, padding: "14px", fontSize: 17, fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 24px rgba(52,211,153,0.3)" },
  tryRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tryChip: { background: "#1e293b", color: "#475569", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  homeRight: { width: 320, display: "flex", flexDirection: "column", gap: 12 },
  featureCard: { background: "#0f172a", border: "1px solid", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "flex-start" },
  dashWrap: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#020817", position: "relative" },
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "#0a0f1e", borderBottom: "1px solid #0f172a", position: "sticky", top: 0, zIndex: 100 },
  navBrand: { display: "flex", alignItems: "center", gap: 8 },
  navLogo: { fontSize: 20 },
  navTitle: { color: "#f1f5f9", fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 16 },
  navTabs: { display: "flex", height: "100%" },
  navTab: { background: "none", border: "none", borderBottom: "2px solid transparent", padding: "0 20px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" },
  navRight: { display: "flex", alignItems: "center", gap: 12 },
  navUser: { color: "#475569", fontSize: 15, fontFamily: "monospace" },
  navSolved: { background: "#34d39915", color: "#34d399", border: "1px solid #34d39930", borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600 },
  navBack: { background: "transparent", border: "1px solid #1e293b", color: "#475569", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  dashMain: { flex: 1, padding: "40px 48px", maxWidth: 1000, width: "100%", margin: "0 auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  pageTitle: { color: "#f1f5f9", fontSize: 27, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 6 },
  pageSub: { color: "#475569", fontSize: 16 },
  statPill: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 16px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 },
  barTrack: { background: "#0f172a", borderRadius: 4, height: 8, overflow: "hidden" },
  aiBtn: { width: "100%", background: "linear-gradient(135deg, #34d399, #059669)", color: "#020817", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 24px rgba(52,211,153,0.2)" },
  loading: { textAlign: "center", padding: "80px 0" },
  spinner: { width: 36, height: 36, border: "3px solid #1e293b", borderTop: "3px solid #34d399", borderRadius: "50%", margin: "0 auto", animation: "spin 0.8s linear infinite" },
};  