import { Link } from 'wouter';
import { Leaf, Hammer, HeartHandshake, Lock, Mail, Newspaper } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import BackButton from '@/components/common/BackButton';
import { trpc } from '@/lib/trpc';
import { useScrollToHash } from '@/hooks/useScrollToHash';

const VALUES = [
  {
    icon: Leaf,
    title: 'Sustainability',
    copy: 'We partner with properties that invest in their communities and their environment — not ones that merely advertise it.',
  },
  {
    icon: Hammer,
    title: 'Craftsmanship',
    copy: 'From the way a room is dressed to the way a booking flow feels, we sweat details most platforms skip.',
  },
  {
    icon: HeartHandshake,
    title: 'Hospitality',
    copy: 'Every stay is backed by a concierge who treats your trip like it’s the only one they’re working on.',
  },
  {
    icon: Lock,
    title: 'Discretion',
    copy: 'Your data, your dates, your details — handled with the same care we ask our partner hotels to show guests.',
  },
];

const PRESS = ['Condé Nast Traveler', 'Monocle', 'AFAR', 'Travel + Leisure', 'Kinfolk'];

function useStats() {
  const { data: destinations } = trpc.destinations.list.useQuery();
  const { data: hotelsPage } = trpc.hotels.list.useQuery({ page: 1, limit: 1 });
  const { data: tours } = trpc.tours.list.useQuery();

  const stats: { label: string; value: number | string | undefined; isText?: boolean }[] = [
    { label: 'Destinations', value: destinations?.length },
    { label: 'Curated stays', value: hotelsPage?.pagination.total },
    { label: 'Guided tours', value: tours?.length },
    { label: 'Concierge coverage', value: '24/7', isText: true },
  ];
  return stats;
}

export default function About() {
  const stats = useStats();
  useScrollToHash();

  return (
    <div className="bg-background pb-section-gap">
      {/* Hero / story */}
      <section className="container pt-16 md:pt-24 mb-20 md:mb-28">
        <div className="mb-10 max-w-3xl mx-auto">
          <BackButton fallbackHref="/" />
        </div>
        <Reveal className="max-w-3xl mx-auto text-center mb-16">
          <p className="label-caps mb-4">Our story</p>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-6">
            Founded on the belief that a great trip starts with knowing exactly where you’ll sleep.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Lumière started as a frustration: booking a beautiful-looking hotel online and arriving to a room nothing
            like the photos. We built a platform where you can walk through the actual room in 3D, book it with a
            real person backing you up, and trust that what you see is what you get.
          </p>
        </Reveal>

        <div id="story" className="scroll-mt-32">
          <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden h-72 md:h-[420px]">
              <img
                src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1000&q=80"
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden h-72 md:h-[420px]">
              <img
                src="https://images.unsplash.com/photo-1521783988139-89397d761dce?w=1000&q=80"
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="container">
        {/* Stats */}
        <Reveal className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {stats.map((stat) => (
            <div key={stat.label} className="card-luxury text-center py-8">
              <p className="font-serif text-3xl md:text-4xl text-primary mb-2">
                {stat.isText ? stat.value : (stat.value ?? '—')}
              </p>
              <p className="label-caps !text-[10px]">{stat.label}</p>
            </div>
          ))}
        </Reveal>

        {/* Values */}
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">What we hold ourselves to</h2>
          <p className="text-muted-foreground text-lg">Four things every partner property and every booking is measured against.</p>
        </Reveal>

        <div id="sustainability" className="grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-24 scroll-mt-32">
          {VALUES.map((value, i) => (
            <Reveal key={value.title} delay={Math.min(i * 0.06, 0.3)}>
              <div className="glass-panel p-8 h-full flex gap-5">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <value.icon size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.copy}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Careers */}
        <div id="careers" className="scroll-mt-32">
          <Reveal className="card-elevated p-10 md:p-14 mb-16 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="label-caps mb-3">Careers</p>
              <h2 className="font-serif text-2xl md:text-3xl mb-3">We're a small team, and every hire matters.</h2>
              <p className="text-muted-foreground leading-relaxed max-w-xl">
                We're not running a standard careers pipeline yet — reach out directly and tell us what you'd want to
                work on.
              </p>
            </div>
            <Link href="/contact" className="btn-primary flex items-center gap-2 justify-center shrink-0">
              <Mail size={16} /> Get in touch
            </Link>
          </Reveal>
        </div>

        {/* Press */}
        <div id="press" className="scroll-mt-32">
          <Reveal className="text-center pb-8">
            <p className="label-caps mb-6 flex items-center justify-center gap-2">
              <Newspaper size={13} /> As featured in
            </p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
              {PRESS.map((name) => (
                <span key={name} className="font-serif text-lg md:text-xl text-muted-foreground">
                  {name}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
