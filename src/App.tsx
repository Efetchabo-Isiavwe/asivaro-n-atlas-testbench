import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileJson,
  FlaskConical,
  Languages,
  LoaderCircle,
  Plus,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@appdeploy/client';
import './index.css';

type LangCode = 'yo' | 'ha' | 'ig' | 'en';
type Language = 'Yoruba' | 'Hausa' | 'Igbo' | 'Nigerian-accented English';
type TestCase = {
  id: string;
  title: string;
  code: LangCode;
  language: Language;
  prompt: string;
  custom: boolean;
};
type Run = {
  id: string;
  testId: string;
  title: string;
  language: Language;
  prompt: string;
  output: string;
  model: string;
  latencyMs: number;
  createdAt: string;
  accuracy: number;
  languageScore: number;
  instructions: number;
  notes: string;
};
type Notice = { kind: 'info' | 'error' | 'success'; text: string };
type RequestFailure = {
  message?: string;
  response?: { data?: { message?: string } };
};

const TESTS_KEY = 'asivaro-testbench-tests-v1';
const RUNS_KEY = 'asivaro-testbench-runs-v1';
const languages: { code: LangCode; name: Language }[] = [
  { code: 'yo', name: 'Yoruba' },
  { code: 'ha', name: 'Hausa' },
  { code: 'ig', name: 'Igbo' },
  { code: 'en', name: 'Nigerian-accented English' },
];
const starters: TestCase[] = [
  {
    id: 'yo-solar',
    title: 'Explain solar energy to a child',
    code: 'yo',
    language: 'Yoruba',
    prompt:
      'Ṣàlàyé agbára oòrùn fún ọmọ ọdún mẹ́wàá ní èdè Yorùbá. Lo gbolohun kúkúrú mẹ́ta sí márùn-ún.',
    custom: false,
  },
  {
    id: 'ha-solar',
    title: 'Explain solar energy to a child',
    code: 'ha',
    language: 'Hausa',
    prompt:
      'Ka bayyana makamashin rana ga yaro mai shekara goma da Hausa mai sauƙi. Yi amfani da jimloli uku zuwa biyar.',
    custom: false,
  },
  {
    id: 'ig-solar',
    title: 'Explain solar energy to a child',
    code: 'ig',
    language: 'Igbo',
    prompt:
      'Kọwaa ike anyanwụ n’Igbo dị mfe nke nwatakịrị dị afọ iri ga-aghọta. Jiri ahịrịokwu atọ ruo ise.',
    custom: false,
  },
  {
    id: 'en-solar',
    title: 'Explain solar energy to a child',
    code: 'en',
    language: 'Nigerian-accented English',
    prompt:
      'Explain solar energy to a ten-year-old in simple Nigerian English. Use three to five short sentences and one everyday example.',
    custom: false,
  },
];

function readStore<T>(key: string, fallback: T): T {
  try {
    const text = localStorage.getItem(key);
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}
function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
function dateLabel(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function App() {
  const [tests, setTests] = useState<TestCase[]>(() =>
    readStore(TESTS_KEY, starters)
  );
  const [runs, setRuns] = useState<Run[]>(() => readStore(RUNS_KEY, []));
  const [selectedId, setSelectedId] = useState(
    () => readStore<TestCase[]>(TESTS_KEY, starters)[0]?.id ?? starters[0].id
  );
  const [gateway, setGateway] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('NCAIR1/N-ATLaS');
  const [running, setRunning] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftLang, setDraftLang] = useState<LangCode>('en');
  const [notice, setNotice] = useState<Notice>({
    kind: 'info',
    text: 'Connect an authorised N-ATLAS gateway to run live tests. This workspace does not generate mock model answers.',
  });

  useEffect(() => {
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  }, [tests]);
  useEffect(() => {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  }, [runs]);

  const selected = useMemo(
    () => tests.find(item => item.id === selectedId) ?? tests[0],
    [tests, selectedId]
  );
  const latestRun = runs.find(run => run.testId === selectedId);
  const reviewedCount = runs.filter(
    run => run.accuracy && run.languageScore && run.instructions
  ).length;

  function addTest() {
    if (!draftTitle.trim() || !draftPrompt.trim()) {
      setNotice({
        kind: 'error',
        text: 'Enter a test title and prompt before saving.',
      });
      return;
    }
    const lang =
      languages.find(item => item.code === draftLang) ?? languages[3];
    const item: TestCase = {
      id: 'custom-' + Date.now().toString(36),
      title: draftTitle.trim(),
      code: lang.code,
      language: lang.name,
      prompt: draftPrompt.trim(),
      custom: true,
    };
    setTests(old => [...old, item]);
    setSelectedId(item.id);
    setDraftTitle('');
    setDraftPrompt('');
    setShowNew(false);
    setNotice({
      kind: 'success',
      text: 'Test saved in this browser. It has not been sent to N-ATLAS.',
    });
  }

  async function runTest() {
    if (!selected) return;
    const baseUrl = gateway.trim().replace(/\/+$/, '');
    if (!baseUrl || !/^https:\/\//i.test(baseUrl)) {
      setNotice({
        kind: 'error',
        text: 'Enter the HTTPS base URL of an authorised N-ATLAS-compatible gateway.',
      });
      return;
    }
    if (!apiKey.trim()) {
      setNotice({
        kind: 'error',
        text: 'Enter the API key issued for the gateway.',
      });
      return;
    }
    setRunning(true);
    setNotice({
      kind: 'info',
      text: 'Sending the selected prompt to the configured gateway…',
    });
    try {
      const response = await api.post('/api/natlas/run', {
        baseUrl,
        apiKey: apiKey.trim(),
        model: model.trim() || 'NCAIR1/N-ATLaS',
        language: selected.code,
        prompt: selected.prompt,
      });
      const data = response.data as {
        output: string;
        model: string;
        latencyMs: number;
        createdAt: string;
      };
      const run: Run = {
        id: 'run-' + Date.now().toString(36),
        testId: selected.id,
        title: selected.title,
        language: selected.language,
        prompt: selected.prompt,
        output: data.output,
        model: data.model || model,
        latencyMs: data.latencyMs,
        createdAt: data.createdAt || new Date().toISOString(),
        accuracy: 0,
        languageScore: 0,
        instructions: 0,
        notes: '',
      };
      setRuns(old => [run, ...old].slice(0, 200));
      setNotice({
        kind: 'success',
        text: 'Live response received. Review the actual output before marking the test complete.',
      });
    } catch (failure) {
      const err = failure as RequestFailure;
      setNotice({
        kind: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'Request failed. Check gateway access and try again.',
      });
    } finally {
      setRunning(false);
    }
  }

  function updateRun(
    id: string,
    field: 'accuracy' | 'languageScore' | 'instructions' | 'notes',
    value: number | string
  ) {
    setRuns(old =>
      old.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  }
  function deleteTest(item: TestCase) {
    if (!item.custom) return;
    const next = tests.filter(test => test.id !== item.id);
    setTests(next);
    setSelectedId(next[0]?.id ?? starters[0].id);
    setNotice({ kind: 'info', text: 'Custom test removed from this browser.' });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={20} />
          </div>
          <div>
            <div className="brand-name">
              asivaro<span>.</span>
            </div>
            <div className="brand-caption">N-ATLAS TESTBENCH</div>
          </div>
        </div>
        <div className="header-actions">
          <span className="badge">
            <span className="badge-dot" /> Developer Infrastructure
          </span>
          <a
            href="https://ncair.nitda.gov.ng/naic/"
            target="_blank"
            rel="noreferrer"
          >
            Challenge brief <ArrowUpRight size={13} />
          </a>
        </div>
      </header>
      <main className="main">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <Sparkles size={14} /> REPEATABLE EVALUATION
            </div>
            <h1>
              Test with evidence.
              <br />
              <span>Build with confidence.</span>
            </h1>
            <p>
              A developer workspace for repeatable prompts, Nigerian-language
              response review and evidence export against an authorised
              N-ATLAS-compatible gateway.
            </p>
            <div className="hero-points">
              <span>
                <Languages size={14} /> 4 language starters
              </span>
              <span>
                <ShieldCheck size={14} /> No saved API keys
              </span>
              <span>
                <FileJson size={14} /> Exportable evidence
              </span>
            </div>
          </div>
          <div className="status-card">
            <div className="status-top">
              <span>BUILD STATUS</span>
              <b>Gateway not connected</b>
            </div>
            <h2>Your test workspace</h2>
            <div className="stats">
              <div>
                <strong>{tests.length}</strong>
                <span>Test cases</span>
              </div>
              <div>
                <strong>{runs.length}</strong>
                <span>Live runs</span>
              </div>
              <div>
                <strong>{reviewedCount}</strong>
                <span>Reviewed</span>
              </div>
            </div>
            <p>
              <span className="status-line" /> Live testing requires an
              authorised gateway and credentials.
            </p>
          </div>
        </section>
        {notice && (
          <div className={'notice notice-' + notice.kind} role="status">
            {notice.kind === 'success' ? (
              <Check size={16} />
            ) : notice.kind === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <CircleHelp size={16} />
            )}
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss notice">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="workspace">
          <aside className="panel sidebar">
            <div className="panel-heading">
              <div>
                <div className="eyebrow small">WORKSPACE</div>
                <h2>Test suite</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowNew(open => !open)}
                aria-label="Create new test"
              >
                <Plus size={17} />
              </button>
            </div>
            {showNew && (
              <div className="new-test">
                <label>
                  Test title
                  <input
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    placeholder="e.g. Explain solar power"
                  />
                </label>
                <label>
                  Language
                  <select
                    value={draftLang}
                    onChange={e => setDraftLang(e.target.value as LangCode)}
                  >
                    {languages.map(item => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Prompt
                  <textarea
                    rows={3}
                    value={draftPrompt}
                    onChange={e => setDraftPrompt(e.target.value)}
                    placeholder="Enter exact prompt…"
                  />
                </label>
                <div className="row-actions">
                  <button className="btn primary" onClick={addTest}>
                    Save test
                  </button>
                  <button
                    className="btn quiet"
                    onClick={() => setShowNew(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="list-label">
              <span>STARTER PROMPTS</span>
              <span>{tests.length} total</span>
            </div>
            <div className="test-list">
              {tests.map(item => (
                <div
                  key={item.id}
                  className={
                    'test-row ' + (item.id === selectedId ? 'active' : '')
                  }
                >
                  <button
                    className="test-select"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="lang-chip">{item.code.toUpperCase()}</span>
                    <span className="test-titles">
                      <strong>{item.title}</strong>
                      <small>{item.language}</small>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                  {item.custom && (
                    <button
                      className="delete-test"
                      onClick={() => deleteTest(item)}
                      aria-label={'Delete ' + item.title}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="side-note">
              <BookOpen size={17} />
              <div>
                <strong>Keep tests repeatable</strong>
                <p>
                  Reuse the same prompt after changes and record evidence, not
                  impressions.
                </p>
              </div>
            </div>
          </aside>
          <section className="center-column">
            <div className="panel case-panel">
              <div className="case-top">
                <span>
                  <FlaskConical size={15} /> TEST CASE
                </span>
                <b>{selected?.language ?? 'No test'}</b>
              </div>
              <h2>{selected?.title ?? 'Add a test'}</h2>
              <p className="muted">
                A consistent prompt is a small benchmark. Run it, review the
                output, and record what changes.
              </p>
              <div className="prompt-card">
                <div>
                  <strong>Prompt</strong>
                  <small>UTF-8 · exact text</small>
                </div>
                <p>{selected?.prompt}</p>
              </div>
              <div className="section-divider" />
              <div className="section-top">
                <div>
                  <div className="eyebrow small">LIVE CONNECTION</div>
                  <h3>Connect an authorised gateway</h3>
                </div>
                <RadioTower size={20} />
              </div>
              <p className="helper">
                Use the HTTPS base URL and API key supplied by your N-ATLAS
                provider. The base URL should not include /chat/completions.
                Keys are not saved in this workspace.
              </p>
              <label>
                Gateway base URL
                <input
                  type="url"
                  value={gateway}
                  onChange={e => setGateway(e.target.value)}
                  placeholder="https://your-authorised-gateway.example"
                />
              </label>
              <label>
                API key
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  autoComplete="off"
                  placeholder="Enter gateway API key"
                />
              </label>
              <label>
                Model identifier
                <input
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="NCAIR1/N-ATLaS"
                />
              </label>
              <p className="key-note">
                <ShieldCheck size={14} /> API key stays out of browser storage
                and is forwarded with each request.
              </p>
              <button
                className="btn primary run-btn"
                onClick={runTest}
                disabled={running || !selected}
              >
                {running ? (
                  <>
                    <LoaderCircle className="spin" size={16} /> Running live
                    test…
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Run on N-ATLAS <ChevronRight size={16} />
                  </>
                )}
              </button>
              <div className="access-note">
                <span>
                  <CircleHelp size={14} /> Need access?
                </span>
                <a
                  href="https://ncair.nitda.gov.ng/naic/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Review the challenge access details <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
            <div className="panel results-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow small">EVALUATION</div>
                  <h2>Response review</h2>
                </div>
                <span className="sub-badge">
                  {latestRun ? 'Response available' : 'Awaiting live run'}
                </span>
              </div>
              {!latestRun ? (
                <div className="empty">
                  <div className="empty-icon">
                    <Activity size={22} />
                  </div>
                  <strong>No live response yet</strong>
                  <p>
                    A successful configured N-ATLAS request will appear here. No
                    synthetic model responses are used.
                  </p>
                </div>
              ) : (
                <>
                  <div className="run-meta">
                    <span>
                      <Check size={13} /> Gateway response received
                    </span>
                    <span>
                      <Clock3 size={13} />{' '}
                      {(latestRun.latencyMs / 1000).toFixed(2)}s
                    </span>
                    <span>{latestRun.model}</span>
                  </div>
                  <div className="output-text">{latestRun.output}</div>
                  <div className="review-heading">
                    Human review{' '}
                    <small>Rate the actual response from 1 to 5</small>
                  </div>
                  <div className="ratings">
                    {(
                      [
                        ['accuracy', 'Accuracy'],
                        ['languageScore', 'Language quality'],
                        ['instructions', 'Instruction following'],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field}>
                        {label}
                        <select
                          value={latestRun[field]}
                          onChange={e =>
                            updateRun(
                              latestRun.id,
                              field,
                              Number(e.target.value)
                            )
                          }
                        >
                          <option value={0}>Not rated</option>
                          <option value={1}>1 — Poor</option>
                          <option value={2}>2 — Weak</option>
                          <option value={3}>3 — Acceptable</option>
                          <option value={4}>4 — Good</option>
                          <option value={5}>5 — Excellent</option>
                        </select>
                      </label>
                    ))}
                  </div>
                  <label>
                    Evaluator notes
                    <textarea
                      rows={2}
                      value={latestRun.notes}
                      onChange={e =>
                        updateRun(latestRun.id, 'notes', e.target.value)
                      }
                      placeholder="Record factual issues, fluency concerns or missing instructions…"
                    />
                  </label>
                </>
              )}
            </div>
          </section>
          <aside className="right-column">
            <div className="panel side-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow small">ACTIVITY</div>
                  <h2>Run history</h2>
                </div>
                <Clock3 size={17} />
              </div>
              {runs.length === 0 ? (
                <div className="history-empty">
                  <Clock3 size={17} />
                  <p>
                    Successful live runs appear here with timestamps and
                    ratings.
                  </p>
                </div>
              ) : (
                <div className="history-list">
                  {runs.slice(0, 8).map(run => (
                    <button
                      key={run.id}
                      onClick={() => setSelectedId(run.testId)}
                      className="history-row"
                    >
                      <span className="history-check">
                        <Check size={11} />
                      </span>
                      <span>
                        <strong>{run.title}</strong>
                        <small>
                          {run.language} · {dateLabel(run.createdAt)}
                        </small>
                        <small>
                          {(run.latencyMs / 1000).toFixed(2)}s · {run.model}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="exports">
                <button
                  className="btn secondary"
                  onClick={() =>
                    downloadJson('asivaro-testbench-cases.json', {
                      product: 'Asivaro N-ATLAS TestBench',
                      exportedAt: new Date().toISOString(),
                      tests,
                    })
                  }
                >
                  <ArrowDownToLine size={15} /> Export test pack
                </button>
                <button
                  className="btn quiet"
                  onClick={() =>
                    downloadJson('asivaro-testbench-run-report.json', {
                      product: 'Asivaro N-ATLAS TestBench',
                      exportedAt: new Date().toISOString(),
                      runs,
                    })
                  }
                >
                  <FileJson size={15} /> Export run report
                </button>
              </div>
              <p className="privacy-note">
                <ShieldCheck size={14} /> Test cases and outputs are stored in
                this browser. API keys are not persisted by the app.
              </p>
            </div>
            <div className="panel side-panel readiness">
              <div className="eyebrow small">SUBMISSION READINESS</div>
              <h3>Required before claiming a valid submission</h3>
              <div>
                <span>
                  <Check size={10} />
                </span>{' '}
                Authorised endpoint and credentials
              </div>
              <div>
                <span>
                  <Check size={10} />
                </span>{' '}
                Live integration evidence
              </div>
              <div>
                <span>
                  <Check size={10} />
                </span>{' '}
                Two external beta testers for PS1
              </div>
              <div>
                <span>
                  <Check size={10} />
                </span>{' '}
                Technical notes and 3–5 minute demo
              </div>
              <p>
                This is an MVP scaffold until live integration and independent
                testing are completed.
              </p>
            </div>
          </aside>
        </div>
        <footer className="footer">
          <span>Asivaro · Evidence-first developer tooling</span>
          <span>
            N-ATLaS is an initiative of the Federal Ministry of Communications,
            Innovation and Digital Economy, powered by Awarri Technologies.
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
