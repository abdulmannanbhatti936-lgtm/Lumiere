import Reveal from '@/components/motion/Reveal';
import BackButton from '@/components/common/BackButton';

const SECTIONS = [
  {
    title: 'Bookings',
    body: 'When you reserve a room through Lumière, you\'re entering an agreement with that property, facilitated by us. Confirmation is sent once payment succeeds; availability is not guaranteed until then.',
  },
  {
    title: 'Cancellations & refunds',
    body: 'Cancelling a confirmed booking through My Trips triggers a refund of the original payment via Stripe. Refund timing depends on your card issuer, typically 5–10 business days.',
  },
  {
    title: 'Reviews',
    body: 'Reviews may only be left by guests with a confirmed or completed booking at that property, and should reflect a genuine stay. We reserve the right to remove reviews that violate this.',
  },
  {
    title: 'Account use',
    body: 'You\'re responsible for keeping your account credentials secure. Let us know immediately if you believe your account has been compromised.',
  },
  {
    title: 'Changes to these terms',
    body: 'We may update these terms as the platform evolves. Continued use of Lumière after a change means you accept the updated terms.',
  },
];

export default function Terms() {
  return (
    <div className="bg-background pb-section-gap">
      <div className="container max-w-3xl">
        <div className="pt-6 pb-4">
          <BackButton fallbackHref="/" />
        </div>
        <Reveal className="mb-12">
          <p className="label-caps mb-3">Legal</p>
          <h1 className="font-serif text-3xl md:text-4xl mb-3">Terms of Service</h1>
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
