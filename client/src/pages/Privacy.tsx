import Reveal from '@/components/motion/Reveal';

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'Account details you give us directly (name, email, password), booking details (dates, guests, payment confirmation from Stripe — we never see or store your card number), and basic usage data (pages visited, device type) to keep the site working and secure.',
  },
  {
    title: 'How we use it',
    body: 'To create and manage your bookings, send booking confirmations and concierge messages, respond to enquiries submitted through Contact, and improve the site. We do not sell your data to third parties.',
  },
  {
    title: 'Payments',
    body: 'Card payments are processed entirely by Stripe. Lumière never receives or stores your full card number — only a confirmation that a charge succeeded.',
  },
  {
    title: 'Cookies',
    body: 'We use a minimal set of cookies required to keep you signed in and to remember booking-flow state. We do not use third-party advertising trackers.',
  },
  {
    title: 'Your rights',
    body: 'You can request a copy of your data, ask us to correct it, or request deletion of your account at any time by reaching out through the Contact page.',
  },
];

export default function Privacy() {
  return (
    <div className="bg-background pb-section-gap">
      <div className="container max-w-3xl">
        <Reveal className="mb-12">
          <p className="label-caps mb-3">Legal</p>
          <h1 className="font-serif text-3xl md:text-4xl mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">Last updated 12 July 2026.</p>
        </Reveal>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <Reveal key={section.title}>
              <h2 className="font-serif text-xl mb-3">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
