import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { chooseComputerMove, findOutcome } from './gameLogic.js';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Copy, ExternalLink, Gamepad2,
  LoaderCircle, Pencil, Play, Plus, Save, Settings2, Share2,
  Sparkles, Trash2, Trophy, Volume2, X,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const storageKey = 'neon-arcade-games';
const templates = [
  { id: 'simple', name: 'EASY', note: 'Classic cabinet', mark: '01', style: 'simple' },
  { id: 'modern', name: 'MEDIUM', note: 'Arcade dashboard', mark: '02', style: 'modern' },
  { id: 'creative', name: 'HARD', note: 'Neon after-hours', mark: '03', style: 'creative' },
];
const emptyBoard = () => Array(9).fill('');

function readLocalGames() {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
  catch { return []; }
}

function writeLocalGames(games) {
  localStorage.setItem(storageKey, JSON.stringify(games));
}

async function saveGame(game) {
  if (supabase) {
    const { data, error } = await supabase.from('games').upsert(game).select().single();
    if (error) throw error;
    return data;
  }
  const games = readLocalGames().filter((entry) => entry.id !== game.id);
  writeLocalGames([game, ...games]);
  return game;
}

async function getGame(id) {
  if (supabase) {
    const { data, error } = await supabase.from('games').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }
  return readLocalGames().find((entry) => entry.id === id) || null;
}

async function getGames() {
  if (supabase) {
    const { data, error } = await supabase.from('games').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return readLocalGames();
}

async function deleteGame(id) {
  if (supabase) {
    const { error } = await supabase.from('games').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  writeLocalGames(readLocalGames().filter((entry) => entry.id !== id));
}

function ProfileForm({ game, onSaved, onCancel }) {
  const [form, setForm] = useState({
    username: game?.username || '', skills: (game?.skills || []).join(', '),
    player_x: game?.player_x || 'Player X', player_o: game?.player_o || 'Arcade AI',
    x_color: game?.x_color || '#39ff14', o_color: game?.o_color || '#cc00ff',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const next = {
      id: game?.id || crypto.randomUUID(),
      username: form.username.trim(),
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      player_x: form.player_x.trim() || 'Player X',
      player_o: form.player_o.trim() || 'Arcade AI',
      x_color: form.x_color,
      o_color: form.o_color,
      template: game?.template || 'simple',
      updated_at: new Date().toISOString(),
    };
    try { onSaved(await saveGame(next)); }
    catch (saveError) { setError(saveError.message || 'Could not save this game.'); }
    finally { setBusy(false); }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="form-heading"><span className="eyebrow">PLAYER PROFILE</span><h2>Make it yours.</h2><p>Your name, details, and colors travel with your game.</p></div>
      <label>Username<input autoFocus required maxLength={32} value={form.username} onChange={update('username')} placeholder="Your player name" /></label>
      <label>Skills <span className="optional">COMMA SEPARATED</span><input value={form.skills} onChange={update('skills')} placeholder="Strategy, Speed, Focus" /></label>
      <div className="form-divider"><span>GAME SETUP</span></div>
      <div className="two-fields"><label>Human name (X)<input maxLength={18} value={form.player_x} onChange={update('player_x')} /></label><label>AI name (O)<input maxLength={18} value={form.player_o} onChange={update('player_o')} /></label></div>
      <div className="color-fields"><label><span>X color</span><input aria-label="Player X color" type="color" value={form.x_color} onChange={update('x_color')} /></label><label><span>O color</span><input aria-label="Player O color" type="color" value={form.o_color} onChange={update('o_color')} /></label></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}Save & choose a style <ArrowRight size={16} /></button></div>
    </form>
  );
}

function MiniBoard({ style }) {
  return <div className={`mini-board mini-${style}`} aria-hidden="true">{['X', '', 'O', '', 'X', '', 'O', '', 'X'].map((mark, index) => <span key={index}>{mark}</span>)}</div>;
}

function Templates({ game, onSelect, onBack }) {
  return <section className="templates-page">
    <div className="page-topline"><button className="icon-button" onClick={onBack} aria-label="Back"><ArrowLeft size={18} /></button><span className="eyebrow">STEP 02 / PICK YOUR CABINET</span></div>
    <div className="section-title"><div><h2>Choose your world.</h2><p>Three game screens. One very personal arcade.</p></div><span className="saved-chip"><Check size={13} /> SAVED</span></div>
    <div className="template-grid">{templates.map((template) => <button key={template.id} className={`template-card template-${template.style}`} onClick={() => onSelect(template.id)}>
      <div className="template-card-head"><span className="template-number">{template.mark} / TEMPLATE</span><ArrowRight size={17} /></div>
      <MiniBoard style={template.style} />
      <div className="template-card-foot"><div><h3>{template.name}</h3><span>{template.note}</span></div><span className="select-circle"><ArrowRight size={16} /></span></div>
    </button>)}</div>
    <div className="template-note"><Sparkles size={15} /><span>Each style includes the full game, player profile, and shareable link.</span><span className="player-tag">{game.username}</span></div>
  </section>;
}

function SettingsModal({ game, setGame, sound, setSound, music, setMusic, close, backToMenu }) {
  const [names, setNames] = useState([game.player_x, game.player_o]);
  const [colors, setColors] = useState([game.x_color, game.o_color]);
  const [error, setError] = useState('');
  async function saveSettings() {
    const updated = { ...game, player_x: names[0].trim() || 'Player X', player_o: names[1].trim() || 'Arcade AI', x_color: colors[0], o_color: colors[1], updated_at: new Date().toISOString() };
    try { setGame(await saveGame(updated)); close(); }
    catch (saveError) { setError(saveError.message || 'Could not save settings.'); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div className="modal-title"><div><span className="eyebrow">CABINET CONTROLS</span><h2 id="settings-title">Settings</h2></div><button className="icon-button" onClick={close} aria-label="Close settings"><X size={18} /></button></div>
    <div className="toggle-row"><span><Volume2 size={17} /> Sound effects</span><button className={`switch ${sound ? 'on' : ''}`} role="switch" aria-checked={sound} onClick={() => setSound(!sound)}><span /></button></div>
    <div className="toggle-row"><span><Gamepad2 size={17} /> Arcade hum</span><button className={`switch ${music ? 'on' : ''}`} role="switch" aria-checked={music} onClick={() => setMusic(!music)}><span /></button></div>
    <div className="settings-names">{names.map((name, index) => <label key={index}>{index === 0 ? 'HUMAN · X' : 'AI · O'}<input value={name} maxLength={18} onChange={(event) => setNames((current) => current.map((entry, i) => i === index ? event.target.value : entry))} /></label>)}</div>
    <div className="settings-colors">{colors.map((color, index) => <label key={index}>{index === 0 ? 'X COLOR' : 'O COLOR'}<input type="color" value={color} onChange={(event) => setColors((current) => current.map((entry, i) => i === index ? event.target.value : entry))} /></label>)}</div>
    {error && <p className="form-error">{error}</p>}<div className="settings-actions"><button className="button button-quiet" onClick={() => { close(); backToMenu(); }}><ArrowLeft size={15} />Back to main menu</button><button className="button button-primary" onClick={saveSettings}><Check size={16} />Save settings</button></div>
  </section></div>;
}

function Game({ game, setGame, onHome, onEdit }) {
  const [mode, setMode] = useState('menu');
  const [board, setBoard] = useState(emptyBoard);
  const [current, setCurrent] = useState('X');
  const [winner, setWinner] = useState('');
  const [winningCells, setWinningCells] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [sound, setSound] = useState(false);
  const [music, setMusic] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);
  const style = game.template || 'simple';
  const templateName = templates.find((template) => template.id === style)?.name || 'EASY';

  function tone(frequency = 440, duration = 0.08, volume = 0.04) {
    if (!sound) return;
    try {
      const context = audioRef.current || new AudioContext();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration);
    } catch { /* Audio is an optional enhancement. */ }
  }

  useEffect(() => {
    if (!music) return undefined;
    let context;
    let oscillator;
    let gain;
    try {
      context = audioRef.current || new AudioContext();
      audioRef.current = context;
      oscillator = context.createOscillator(); gain = context.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = 55;
      gain.gain.value = 0.009; oscillator.connect(gain); gain.connect(context.destination); oscillator.start();
    } catch { return undefined; }
    return () => { try { oscillator?.stop(); gain?.disconnect(); } catch { /* Already stopped. */ } };
  }, [music]);

  useEffect(() => {
    if (mode !== 'play' || current !== 'O' || winner) return undefined;
    const move = chooseComputerMove(board, 'O', style === 'simple' ? 'easy' : 'hard');
    if (move === null) return undefined;
    const timeout = window.setTimeout(() => {
      const next = [...board];
      next[move] = 'O';
      setBoard(next);
      tone(380);
      const outcome = findOutcome(next);
      if (outcome?.winner) { setWinner('O'); setWinningCells(outcome.winningCells); setScores((score) => ({ ...score, O: score.O + 1 })); tone(760, 0.25, 0.06); }
      else if (outcome?.draw) { setWinner('draw'); setScores((score) => ({ ...score, draw: score.draw + 1 })); }
      else setCurrent('X');
    }, 420);
    return () => window.clearTimeout(timeout);
  }, [board, current, mode, sound, winner]);

  function play(index) {
    if (current !== 'X' || board[index] || winner) return;
    const next = [...board]; next[index] = current; setBoard(next); tone(current === 'X' ? 560 : 380);
    const outcome = findOutcome(next);
    if (outcome?.winner) { setWinner(outcome.winner); setWinningCells(outcome.winningCells); setScores((score) => ({ ...score, [outcome.winner]: score[outcome.winner] + 1 })); tone(760, 0.25, 0.06); }
    else if (outcome?.draw) { setWinner('draw'); setScores((score) => ({ ...score, draw: score.draw + 1 })); }
    else setCurrent('O');
  }

  function restart() { setBoard(emptyBoard()); setCurrent('X'); setWinner(''); setWinningCells([]); }
  function startGame() { restart(); setScores({ X: 0, O: 0, draw: 0 }); setMode('play'); }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setCopied(false); }
  }

  const status = winner === 'draw' ? "It's a draw." : winner ? `${winner === 'X' ? game.player_x : game.player_o} wins!` : current === 'X' ? `${game.player_x}'s turn (X)` : `${game.player_o} is thinking (O)`;
  return <main className={`game-page game-${style}`} style={{ '--x-color': game.x_color || '#39ff14', '--o-color': game.o_color || '#cc00ff' }}>
    <header className="game-topbar"><button className="icon-button" onClick={() => setConfirm(mode === 'menu' ? 'quit' : 'menu')} aria-label={mode === 'menu' ? 'Back to game builder' : 'Back to main menu'}><ArrowLeft size={18} /></button><div className="game-wordmark"><span className="wordmark-square">T</span><span>TIC TAC TOE game <small>/ {templateName}</small></span></div><div className="game-tools"><button className="icon-button" onClick={share} aria-label="Copy share link" title="Copy share link">{copied ? <Check size={18} /> : <Share2 size={18} />}</button><button className="icon-button" onClick={onEdit} aria-label="Edit player profile" title="Edit profile"><Pencil size={17} /></button><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Settings"><Settings2 size={18} /></button></div></header>
    {mode === 'menu' ? <section className="game-menu">
      <span className="menu-corner menu-corner-nw" aria-hidden="true"><i /><i /><i /><i /></span><span className="menu-corner menu-corner-ne" aria-hidden="true"><i /><i /><i /><i /></span><span className="menu-corner menu-corner-sw" aria-hidden="true"><i /><i /><i /><i /></span><span className="menu-corner menu-corner-se" aria-hidden="true"><i /><i /><i /><i /></span>
      <section className="menu-content"><div className="menu-status"><span className="live-indicator" /> PLAYER PROFILE LOADED <span className="menu-status-id">{game.username}</span></div><div className="menu-title"><span>TIC-TAC-</span><span>TOE<span className="menu-star">*</span></span></div><p className="menu-tagline">PLAYER X IS HUMAN / PLAYER O IS AI</p><div className="main-menu-actions"><button className="arcade-menu-button" onClick={startGame}><Play size={14} fill="currentColor" /><span>START GAME</span><ArrowRight size={15} /></button><button className="arcade-menu-button" onClick={() => setSettingsOpen(true)}><Settings2 size={14} /><span>SETTINGS</span><ArrowRight size={15} /></button><button className="arcade-menu-button quit-button" onClick={() => setConfirm('quit')}><X size={14} /><span>QUIT</span><ArrowRight size={15} /></button></div><div className="menu-credit"><span>PLAYER X · HUMAN <b style={{ color: game.x_color }}>{game.player_x}</b></span><span>PLAYER O · AI <b style={{ color: game.o_color }}>{game.player_o}</b></span><span className="menu-template">CABINET / {templateName}</span></div></section>
    </section> : <div className="game-content">
      <section className="arcade-info">
        <div className="profile-orb"><span>{game.username?.slice(0, 1).toUpperCase() || 'N'}</span></div>
        <span className="eyebrow">NOW PLAYING</span><h1>{game.username || 'Player'}<span className="title-dot">.</span></h1>
        <p className="arcade-subtitle">A little strategy. A lot of neon.</p>
        <div className="scoreboard"><div><span style={{ color: game.x_color }}>{game.player_x} · X</span><strong>{scores.X}</strong></div><span className="score-separator">:</span><div><span style={{ color: game.o_color }}>{game.player_o} · AI</span><strong>{scores.O}</strong></div></div>
        {game.skills?.length > 0 && <div className="skill-list">{game.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>}
        <button className="text-button" onClick={onEdit}><Pencil size={14} /> Edit player card</button>
      </section>
      <section className="cabinet">
        <div className="cabinet-top"><span className="cabinet-lights"><i /><i /><i /></span><span className="cabinet-round">ROUND 01</span></div>
        <div className={`game-status ${winner ? 'result' : ''}`} aria-live="polite"><span className={`turn-marker ${winner === 'draw' ? 'draw-marker' : ''}`} style={{ color: winner ? (winner === 'draw' ? '#ffe66d' : winner === 'X' ? game.x_color : game.o_color) : current === 'X' ? game.x_color : game.o_color }}>{winner === 'draw' ? '=' : winner ? winner : current}</span><strong>{status}</strong><span className="status-live"><i />{winner ? 'GAME OVER' : current === 'X' ? 'YOUR MOVE' : 'CPU THINKING'}</span></div>
        <div className="board" role="grid" aria-label="Tic-tac-toe board">{board.map((cell, index) => <button key={index} className={`cell ${cell ? `cell-${cell.toLowerCase()}` : ''} ${winningCells.includes(index) ? 'winning-cell' : ''}`} style={{ '--mark-color': cell === 'X' ? game.x_color : game.o_color }} onClick={() => play(index)} disabled={Boolean(cell || winner || current !== 'X')} aria-label={cell ? `Cell ${index + 1}: ${cell}` : `Play cell ${index + 1}`} role="gridcell">{cell}</button>)}</div>
        <div className="cabinet-bottom"><span>DRAWS <b>{scores.draw}</b></span>{winner ? <button className="button button-primary" onClick={restart}><Play size={14} fill="currentColor" /> Play again</button> : <span className="turn-hint">{current === 'X' ? 'YOU PLAY X' : 'AI THINKING · O'}</span>}<button className="cabinet-menu" onClick={() => setConfirm('menu')}>MAIN MENU <ArrowRight size={13} /></button></div>
      </section>
    </div>}
    <footer className="game-footer"><span><span className="footer-pixel">◆</span> TIC TAC TOE game</span><button onClick={share}>{copied ? 'LINK COPIED' : 'SHARE THIS GAME'} <Copy size={12} /></button></footer>
    {settingsOpen && <SettingsModal game={game} setGame={setGame} sound={sound} setSound={setSound} music={music} setMusic={setMusic} close={() => setSettingsOpen(false)} backToMenu={() => setMode('menu')} />}
    {confirm && <div className="modal-backdrop"><section className="confirm-modal" role="dialog" aria-modal="true"><span className="eyebrow">{confirm === 'quit' ? 'LEAVE THE CABINET?' : 'END THIS ROUND?'}</span><h2>{confirm === 'quit' ? 'Quit this game?' : 'Back to main menu?'}</h2><p>{confirm === 'quit' ? 'Return to the game builder? Your saved player card is safe.' : 'Your current round will end. You can start a fresh game from the menu.'}</p><div><button className="button button-quiet" onClick={() => setConfirm('')}>No, stay</button><button className="button button-primary" onClick={() => { const destination = confirm; setConfirm(''); if (destination === 'quit') onHome(); else { restart(); setMode('menu'); } }}>{confirm === 'quit' ? 'Yes, quit' : 'Main menu'} <ArrowRight size={15} /></button></div></section></div>}
  </main>;
}

function Manage({ onBack, onOpen, onEdit, refresh }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  useEffect(() => {
    let active = true;
    getGames().then((records) => { if (active) setGames(records); }).catch((loadError) => { if (active) setError(loadError.message || 'Could not load games.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  async function remove(id) {
    if (!window.confirm('Delete this player and game? This cannot be undone.')) return;
    setDeleting(id); setError('');
    try { await deleteGame(id); setGames((current) => current.filter((game) => game.id !== id)); }
    catch (deleteError) { setError(deleteError.message || 'Could not delete game.'); }
    finally { setDeleting(''); }
  }
  return <section className="manage-page"><div className="page-topline"><button className="icon-button" onClick={onBack} aria-label="Back"><ArrowLeft size={18} /></button><span className="eyebrow">THE PLAYER ROSTER</span></div><div className="section-title"><div><h2>Manage games.</h2><p>Every player card and game you have saved.</p></div><span className="saved-chip">{games.length} {games.length === 1 ? 'GAME' : 'GAMES'}</span></div>
    {error && <p className="form-error" role="alert">{error}</p>}{loading ? <div className="loading-state"><LoaderCircle className="spin" />Loading your roster...</div> : games.length === 0 ? <div className="empty-state"><Gamepad2 size={25} /><h3>No games in the arcade.</h3><p>Create a player card and your game will show up here.</p><button className="button button-primary" onClick={onBack}><Plus size={16} /> Create a game</button></div> : <div className="roster-list">{games.map((game) => <article className="roster-row" key={game.id}><div className="roster-avatar">{game.username?.slice(0, 1).toUpperCase()}</div><div className="roster-details"><strong>{game.username}</strong><span>{templates.find((item) => item.id === game.template)?.name || 'EASY'} template · {(game.skills || []).slice(0, 2).join(' / ') || 'No skills listed'}</span></div><button className="roster-action" onClick={() => onEdit(game)} aria-label={`Edit ${game.username}`} title="Edit"><Pencil size={16} /></button><button className="roster-action" onClick={() => onOpen(game)} aria-label={`Open ${game.username}`} title="Open game"><ExternalLink size={16} /></button><button className="roster-action delete-action" disabled={deleting === game.id} onClick={() => remove(game.id)} aria-label={`Delete ${game.username}`} title="Delete">{deleting === game.id ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}</button></article>)}</div>}
    <div className="database-note"><span className="db-light" /><span>{supabase ? 'Connected to Supabase cloud database' : 'Demo mode · saves on this device until Supabase is connected'}</span></div>
  </section>;
}

function AboutModal({ onClose }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="settings-modal about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
    <div className="modal-title"><div><span className="eyebrow">OUR TEAM</span><h2 id="about-title">About us</h2></div><button className="icon-button" onClick={onClose} aria-label="Close About Us"><X size={18} /></button></div>
    <p className="about-copy">TIC TAC TOE game is a little web arcade for creating and sharing your own tic-tac-toe game.</p>
    <div className="about-points"><div className="about-point"><span>01</span><strong>Caburnay Luisa Jean</strong></div><div className="about-point"><span>02</span><strong>Denoy Jay-Ann</strong></div><div className="about-point"><span>03</span><strong>Endona Fatima Grace</strong></div><div className="about-point"><span>04</span><strong>Java Gilian</strong></div></div>
    <button className="button button-primary full-button" onClick={onClose}>Close</button>
  </section></div>;
}

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const initialId = query.get('game');
  const [screen, setScreen] = useState(initialId ? 'loading' : 'home');
  const [game, setGame] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!initialId) return;
    let active = true;
    getGame(initialId).then((record) => {
      if (!active) return;
      if (record) { setGame({ ...record, template: query.get('template') || record.template || 'simple' }); setScreen('game'); }
      else { setError('That game link could not be found.'); setScreen('home'); }
    }).catch((loadError) => { if (active) { setError(loadError.message || 'Could not load that game.'); setScreen('home'); } });
    return () => { active = false; };
  }, []);

  function updateUrl(record, template = record.template) {
    const url = new URL(window.location.href);
    url.searchParams.set('game', record.id);
    url.searchParams.set('template', template);
    window.history.replaceState({}, '', url);
  }
  function startCreate() { setEditTarget(null); setError(''); setScreen('profile'); }
  function saved(record) { setGame(record); setEditTarget(null); setScreen('templates'); setRefresh((value) => value + 1); }
  async function selectTemplate(template) {
    try { const record = await saveGame({ ...game, template, updated_at: new Date().toISOString() }); setGame(record); updateUrl(record, template); setScreen('game'); }
    catch (saveError) { setError(saveError.message || 'Could not save this template.'); }
  }
  function openGame(record) { setGame(record); updateUrl(record); setScreen('game'); }
  function editGame(record) { setEditTarget(record); setGame(record); setScreen('profile'); }
  function goHome() { setError(''); setScreen('home'); setGame(null); setEditTarget(null); window.history.replaceState({}, '', window.location.pathname); }

  if (screen === 'game' && game) return <Game game={game} setGame={setGame} onHome={goHome} onEdit={() => editGame(game)} />;
  if (screen === 'loading') return <div className="loading-screen"><LoaderCircle className="spin" />Opening your game...</div>;
  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#home" onClick={(event) => { event.preventDefault(); goHome(); }}><span className="brand-mark"><Gamepad2 size={17} /></span><span>TIC TAC TOE <span className="brand-accent">game</span></span></a><nav><button onClick={() => setAboutOpen(true)}>ABOUT US</button><button onClick={() => { setScreen('manage'); setRefresh((value) => value + 1); }}>My games <ChevronDown size={13} /></button><span className="header-separator" /><span className="cloud-status"><i />{supabase ? 'CLOUD CONNECTED' : 'LOCAL PREVIEW'}</span></nav></header>
    {screen === 'home' && <main className="home-screen">
      <div className="hero-content"><div className="hero-kicker"><span className="live-indicator" />YOUR GAME. YOUR ARCADE.</div><h1>CAN YOU<br /><span>BEAT OUR UNBEATABLE AI?</span></h1><p className="hero-copy">Tic-tac-toe isn't luck. It's strategy, focus, and the will to WIN.</p><div className="hero-actions"><button className="button button-primary hero-button" onClick={startCreate}><Play size={15} fill="currentColor" />GET STARTED <ArrowRight size={16} /></button></div>{error && <p className="home-error" role="alert">{error}</p>}<div className="hero-footnote"><span><Trophy size={14} /> TWO PLAYERS, ONE WINNER</span><span className="footnote-divider" /><span><Share2 size={14} /> READY TO SHARE</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-index">FIG. 001<br />ARCADE SYSTEM</div><div className="hero-cabinet"><div className="hero-cabinet-top"><span>PLAYER 01</span><span className="hero-led" /></div><div className="hero-title">TIC<br /><span>TAC</span><br />TOE<span className="hero-asterisk">*</span></div><div className="hero-mini-grid"><span>X</span><span /><span>O</span><span /><span>X</span><span /><span>O</span><span /><span>X</span></div><div className="hero-start"><span>PRESS TO PLAY</span><span>↗</span></div></div><div className="art-caption"><span>NO. 01 — NEON NIGHTS</span><span>EST. YOUR TURN</span></div><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✳</span></div>
      <div className="home-bottom"><span>01 / MAKE YOUR PLAYER CARD</span><span>02 / PICK A CABINET</span><span>03 / PLAY & SHARE</span><span className="home-version">BUILT FOR THE NEXT MOVE <span>↗</span></span></div>
    </main>}
    {screen === 'profile' && <main className="flow-screen"><div className="flow-aside"><button className="back-link" onClick={() => editTarget ? setScreen('manage') : setScreen('home')}><ArrowLeft size={15} /> BACK</button><span className="eyebrow">STEP 01 / PLAYER CARD</span><h1>Set the<br />high score.</h1><p>Every great arcade has a name on the marquee. Make yours count.</p><div className="aside-coordinates">PLAYER PROFILE<br />SAVE STATE: READY</div></div><ProfileForm key={editTarget?.id || 'new'} game={editTarget} onSaved={saved} onCancel={() => editTarget ? setScreen('manage') : setScreen('home')} /></main>}
    {screen === 'templates' && game && <main className="flow-screen template-flow"><Templates game={game} onSelect={selectTemplate} onBack={() => setScreen('profile')} /><div className="template-error" role="alert">{error}</div></main>}
    {screen === 'manage' && <main className="flow-screen manage-flow"><Manage onBack={goHome} onOpen={openGame} onEdit={editGame} refresh={refresh} /></main>}
    {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    <footer className="site-footer"><span>TIC TAC TOE game <span className="footer-divider">/</span> GAME WEBSITE</span><span>DESIGNED FOR FRIENDLY RIVALRIES <span className="footer-pixel">◆</span></span></footer>
  </div>;
}