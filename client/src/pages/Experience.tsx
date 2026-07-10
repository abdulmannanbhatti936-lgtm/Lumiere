import { Link } from 'wouter';
import { Move3d, Sparkles, Headset, ArrowRight, Compass, ShieldCheck, Gem } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { trpc } from '@/lib/trpc';
import { useScrollToHash } from '@/hooks/useScrollToHash';

const PILLARS = [
  {
    id: 'tours',
    icon: Move3d,
    title: '3D Room Tours',
    copy: 'Walk every room before you book. Rotate, zoom, and get a real sense of scale, light, and layout — no surprises at check-in.',
    cta: 'Try a live preview',
  },
  {
    id: 'stays',
    icon: Sparkles,
    title: 'Curated Stays',
    copy: 'Every property on Lumière is scouted and vetted by our team — boutique hotels and villas chosen for character, not just star ratings.',
    cta: 'Browse the collection',
    href: '/hotels',
  },
  {
    id: 'concierge',
    icon: Headset,
    title: 'Private Concierge',
    copy: 'From late checkouts to dinner reservations, a real person is one message away for every booking, around the clock.',
    cta: 'Reach the concierge',
    href: '/contact',
  },
];

const STEPS = [
  { icon: Compass, title: 'Discover', copy: 'Filter by destination, category, or the tours our guides run on the ground.' },
  { icon: Move3d, title: 'Preview in 3D', copy: 'Step inside the exact room you’ll stay in before you commit to a date.' },
  { icon: ShieldCheck, title: 'Reserve with confidence', copy: 'Secure checkout, instant confirmation, and a concierge who already knows your trip.' },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
];

export default function Experience() {
  const { data } = trpc.hotels.list.useQuery({ sortBy: 'rating', page: 1, limit: 1 });
  const sampleHotel = data?.items?.[0];
  useScrollToHash();

  return (
    <div className="bg-background pb-section-gap">
      {/* Hero */}
      <section className="relative h-[320px] md:h-[440px] w-full overflow-hidden mb-16 md:mb-24">
        <img
          src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1800&q=80"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-vignette" />
        <div className="relative z-10 h-full container flex flex-col justify-center max-w-2xl">
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-4 text-white text-glow">
            An experience, not just a stay.
          </h1>
          <p className="text-white/85 text-lg leading-relaxed">
            Every Lumière booking comes with more than a room key — a live 3D preview, a hand-picked property, and a
            concierge who picks up the phone.
          </p>
        </div>
      </section>

      <div className="container">
        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-24">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.id} delay={Math.min(i * 0.08, 0.3)}>
              <div id={pillar.id} className="card-elevated p-8 h-full flex flex-col scroll-mt-32">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <pillar.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">{pillar.copy}</p>
                <Link
                  href={pillar.href ?? (sampleHotel ? `/hotel/${sampleHotel.id}` : '/hotels')}
                  className="text-sm font-semibold text-primary flex items-center gap-1.5"
                >
                  {pillar.cta} <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* How it works */}
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">How it works</h2>
          <p className="text-muted-foreground text-lg">Three steps between browsing and boarding.</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-24">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={Math.min(i * 0.08, 0.3)}>
              <div className="text-center px-4">
                <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center bg-primary text-primary-foreground">
                  <step.icon size={22} />
                </div>
                <p className="label-caps !text-[10px] mb-2">Step {i + 1}</p>
                <h3 className="font-serif text-xl mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Gallery */}
        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-24">
          {GALLERY.map((src, i) => (
            <div key={src} className={`rounded-2xl overflow-hidden ${i === 0 ? 'md:col-span-2 h-64 md:h-96' : 'h-64'}`}>
              <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          ))}
        </Reveal>

        {/* CTA */}
        <Reveal className="card-elevated p-10 md:p-16 text-center flex flex-col items-center">
          <Gem size={28} className="text-accent mb-5" />
          <h2 className="font-serif text-3xl md:text-4xl mb-4 max-w-lg">Ready to see it for yourself?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            Open any stay and step into a room before you ever pack a bag.
          </p>
          <Magnetic>
            <Link href="/hotels" className="btn-primary">
              Browse stays
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </div>
  );
}
