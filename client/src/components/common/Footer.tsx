import { Link } from 'wouter';
import { Globe2, Camera, PlayCircle } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-background mt-20">
      <div className="container py-24">
        <Reveal>
          <div className="text-center font-serif text-5xl md:text-6xl tracking-tight text-primary mb-16">
            Lumière
          </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 text-center md:text-left mb-16">
          <div className="flex flex-col gap-4">
            <h6 className="label-caps">Explore</h6>
            <Link href="/hotels" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Hotels
            </Link>
            <Link href="/destinations" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Destinations
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <Link href="/experience" className="label-caps hover:!text-accent transition-colors">
              Experience
            </Link>
            <Link href="/experience#tours" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              3D Room Tours
            </Link>
            <Link href="/experience#stays" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Curated Stays
            </Link>
            <Link href="/experience#concierge" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Private Concierge
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <Link href="/about" className="label-caps hover:!text-accent transition-colors">
              About
            </Link>
            <Link href="/about#sustainability" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Sustainability
            </Link>
            <Link href="/about#careers" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Careers
            </Link>
            <Link href="/about#press" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Press
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h6 className="label-caps">Support</h6>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Concierge 24/7
            </Link>
            <span className="text-sm text-muted-foreground">FAQ</span>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
            <h6 className="label-caps">Follow</h6>
            <div className="flex justify-center md:justify-start gap-4">
              <Globe2 size={18} className="text-muted-foreground hover:text-accent transition-colors cursor-pointer" />
              <Camera size={18} className="text-muted-foreground hover:text-accent transition-colors cursor-pointer" />
              <PlayCircle size={18} className="text-muted-foreground hover:text-accent transition-colors cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="gold-divider mb-8" />

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 label-caps !text-muted-foreground !text-[10px]">
          <span>© 2026 LUMIÈRE STAYS. ALL RIGHTS RESERVED.</span>
          <a href="#" className="hover:!text-accent transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:!text-accent transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
