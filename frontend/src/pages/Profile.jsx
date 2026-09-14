import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, ExternalLink, Wallet, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import PixelSprite from '../components/PixelSprite';
import WalletGate from '../components/WalletGate';
import { NftBonusCard, StatPills, TraitChip } from '../components/NftBonus';
import { OPENSEA_URL } from '../components/NftGate';
import { useAuth } from '../context/AuthContext';
import { api, errMsg } from '../lib/api';
import { STAT_INFO, sortedStats } from '../lib/nftBonus';
import { getCharacter } from '../mock';

const Record = ({ user }) => (
  <div className="grid grid-cols-4 border border-[var(--line)] bg-[var(--paper-2)]" data-testid="profile-record">
    {[[user.matches, 'PLAYED'], [user.wins, 'WON'], [user.draws, 'DRAWN'], [user.points, 'POINTS']].map(([v, l]) => (
      <div key={l} className="stat-cell px-3 py-4 text-center">
        <div className="font-pixel text-[15px] md:text-[18px]">{v}</div>
        <div className="label mt-2 text-[9px]">{l}</div>
      </div>
    ))}
  </div>
);

const ActiveNft = ({ bonus }) => (
  <div className="frame-card p-6" data-testid="profile-active-nft">
    <div className="label mb-3 flex items-center gap-2"><Sparkles size={11} /> Active GoalHoodz &middot; Trait Bonuses</div>
    {!bonus ? (
      <p className="text-[14px] leading-6 text-[var(--ink-soft)]" data-testid="profile-no-active-nft">No active NFT yet. Pick one below — its traits become your in-game bonuses.</p>
    ) : (
      <>
        <div className="font-pixel text-[14px]" data-testid="profile-active-nft-name">{bonus.name}</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{bonus.traits.map((t) => <TraitChip key={t.category} t={t} />)}</div>
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <StatPills stats={bonus.stats} />
          <ul className="mt-4 space-y-1.5">
            {sortedStats(bonus.stats).map(([s, v]) => (
              <li key={s} className="font-mono flex justify-between gap-4 text-[11px] tracking-wider text-[var(--ink-soft)]">
                <span>{s.toUpperCase()} +{v}%</span><span className="text-right">{STAT_INFO[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </>
    )}
  </div>
);

const Profile = () => {
  const { ready, user, setUser, loading, highestToken } = useAuth();
  const [mine, setMine] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const formatToken = (t) => {
    if (!t) return null;
    const decimals = parseInt(t.token?.decimals) || 18;
    const amt = parseFloat(t.value) / (10 ** decimals);
    const symbol = t.token?.symbol || 'Token';
    const formatted = amt > 100 ? amt.toFixed(2) : amt.toFixed(4);
    return `${formatted} ${symbol}`;
  };

  const load = async () => {
    setErr('');
    setMine(null);
    try {
      const { data } = await api.get('/nft/mine');
      setMine(data);
      if (data.active_token_id !== user.nft_token_id) {
        const me = await api.get('/me');
        setUser(me.data);
      }
    } catch (e) {
      setErr(errMsg(e, 'Could not load your NFTs.'));
      setMine({ tokens: [], active_token_id: null });
    }
  };

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const select = async (token_id) => {
    setBusy(true);
    try {
      const { data } = await api.post('/nft/active', { token_id });
      setUser(data);
      setMine((m) => ({ ...m, active_token_id: token_id }));
      toast(`Goalhoodz #${token_id} is now your active striker`, { icon: <Sparkles size={12} /> });
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="paper-grid flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin" /></main>;
  if (!ready) {
    return (
      <main className="paper-grid min-h-screen">
        <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10">
          <WalletGate title="Connect to see your profile." subtitle="Your GoalHoodz NFTs, their traits and the bonuses they give you on the pitch live here." />
        </div>
      </main>
    );
  }

  const char = getCharacter(user.character_id);
  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-10 md:py-16">
        <div className="label mb-4">Profile</div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="frame-card p-6" data-testid="profile-card">
              <div className="flex items-center gap-5">
                <div className="flex h-[92px] w-[80px] items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper-2)]">
                  <PixelSprite bitmap={char.bitmap} scale={5} ink="var(--ink)" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-pixel truncate text-[16px] md:text-[20px]" data-testid="profile-username">@{user.username}</h1>
                  <div className="font-mono mt-2 flex items-center gap-2 text-[11px] tracking-widest text-[var(--ink-soft)]" data-testid="profile-address">
                    <Wallet size={11} /> {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    {highestToken && <span className="ml-2 border-l border-[var(--ink-soft)] pl-2">💎 {formatToken(highestToken)}</span>}
                  </div>
                  <div className="font-mono mt-1 text-[11px] tracking-widest text-[var(--ink-soft)]">STRIKER: {char.name.toUpperCase()} &middot; <Link to="/#characters" className="underline">change</Link></div>
                </div>
              </div>
              <div className="mt-6"><Record user={user} /></div>
            </div>
            <ActiveNft bonus={user.nft_bonus} />
          </div>

          <div className="frame-card p-6" data-testid="profile-nft-list">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="label">Your GoalHoodz</div>
                <p className="mt-2 text-[14px] leading-6 text-[var(--ink-soft)]">Every NFT in this wallet on Robinhood Chain. Choose the one you take onto the pitch.</p>
              </div>
              <button onClick={load} className="btn-outline !px-3 !py-2 !text-[9px]" data-testid="profile-refresh-nfts" disabled={!mine}>
                {mine ? <RefreshCw size={11} /> : <Loader2 size={11} className="animate-spin" />} REFRESH
              </button>
            </div>
            {err && <div className="font-mono mt-4 text-[12px] text-red-700" data-testid="profile-nft-error">{err}</div>}
            {!mine && <div className="font-mono mt-8 flex items-center gap-2 text-[11px] tracking-widest text-[var(--ink-soft)]"><Loader2 size={12} className="animate-spin" /> SCANNING WALLET ON-CHAIN</div>}
            {mine && mine.tokens.length === 0 && !err && (
              <div className="mt-8 border-2 border-dashed border-[var(--line)] p-6 text-center" data-testid="profile-no-nfts">
                <p className="text-[14px] leading-6 text-[var(--ink-soft)]">No GoalHoodz found in this wallet yet.</p>
                <a href={OPENSEA_URL} target="_blank" rel="noreferrer" className="btn-ink mt-5">GET ONE ON OPENSEA <ExternalLink size={12} /></a>
              </div>
            )}
            {mine && mine.tokens.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {mine.tokens.map((b) => <NftBonusCard key={b.token_id} bonus={b} active={b.token_id === user.nft_token_id} onSelect={select} busy={busy} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;
