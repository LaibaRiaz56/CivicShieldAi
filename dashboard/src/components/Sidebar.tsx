'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',          icon: '🛡️', label: 'Dashboard'    },
  { href: '/incidents', icon: '🚨', label: 'Incidents'    },
  { href: '/chat',      icon: '💬', label: 'AI Assistant' },
  { href: '/simulate',  icon: '🔮', label: 'What-If Sim'  },
  { href: '/resources', icon: '🚑', label: 'Resources'    },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'rgba(8,12,20,0.95)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(20px)', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #00a8ff, #0044cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 20px rgba(0,168,255,0.4)',
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#e8f0fe', letterSpacing: '-0.3px' }}>CivicShield</div>
            <div style={{ fontSize: 10, color: '#00a8ff', fontWeight: 600, letterSpacing: '1px' }}>AI PLATFORM</div>
          </div>
        </div>
        {/* Live indicator */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'blink 2s infinite' }} />
          <span style={{ fontSize: 10, color: '#8899b4', fontWeight: 500 }}>LIVE · ISLAMABAD</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ href, icon, label }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              background: active ? 'rgba(0,168,255,0.12)' : 'transparent',
              border: active ? '1px solid rgba(0,168,255,0.25)' : '1px solid transparent',
              color: active ? '#00a8ff' : '#8899b4',
              textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 500,
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Emergency Numbers */}
      <div style={{
        margin: '0 10px 16px', padding: '12px', borderRadius: 10,
        background: 'rgba(255,61,61,0.08)', border: '1px solid rgba(255,61,61,0.2)',
      }}>
        <div style={{ fontSize: 10, color: '#ff3d3d', fontWeight: 700, marginBottom: 8, letterSpacing: '0.5px' }}>EMERGENCY LINES</div>
        {[['🆘 Rescue', '1122'], ['🚒 Fire', '16'], ['👮 Police', '15'], ['🚑 Edhi', '115']].map(([label, num]) => (
          <div key={num} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#8899b4' }}>{label}</span>
            <span style={{ fontSize: 11, color: '#ffd700', fontWeight: 700 }}>{num}</span>
          </div>
        ))}
      </div>

      {/* CIRO Badge */}
      <div style={{ padding: '0 10px 20px' }}>
        <div style={{
          padding: '8px 12px', borderRadius: 8, textAlign: 'center',
          background: 'rgba(176,64,251,0.08)', border: '1px solid rgba(176,64,251,0.2)',
        }}>
          <div style={{ fontSize: 9, color: '#b040fb', fontWeight: 700, letterSpacing: '0.5px' }}>POWERED BY</div>
          <div style={{ fontSize: 11, color: '#e8f0fe', fontWeight: 600, marginTop: 2 }}>Google Antigravity</div>
          <div style={{ fontSize: 9, color: '#4a5568', marginTop: 1 }}>CIRO Challenge</div>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </aside>
  );
}
