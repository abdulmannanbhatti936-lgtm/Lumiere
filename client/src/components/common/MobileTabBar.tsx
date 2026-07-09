import { Link, useLocation } from 'wouter';

const TABS = [
  { label: 'Home', href: '/', activeOn: ['/'] },
  { label: 'Search', href: '/hotels', activeOn: ['/hotels', '/hotel', '/booking'] },
  { label: 'Tours', href: '/tours', activeOn: ['/tours', '/destinations'] },
  { label: 'Trips', href: '/my-bookings', activeOn: ['/my-bookings'] },
];

export default function MobileTabBar() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="flex items-center justify-around pt-2.5">
        {TABS.map((tab) => {
          const active = tab.activeOn.some((href) => (href === '/' ? location === '/' : location.startsWith(href)));
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1.5 px-4 py-1">
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-transparent'}`} />
              <span className={`text-[11px] transition-colors ${active ? 'text-primary font-bold' : 'text-faint font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
