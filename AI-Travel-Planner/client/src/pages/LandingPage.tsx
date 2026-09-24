import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Map,
  Sparkles,
  Star,
  CalendarDays,
  IndianRupee,
  ListChecks,
  Sun,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SeoHead } from '../components/SeoHead';

type Destination = {
  name: string;
  slug: string;
  state: string;
  tagline: string;
  image: string;
  rating: string;
};

const destinations: Destination[] = [
  { name: 'Kerala Backwaters', slug: 'kerala-backwaters', state: 'Kerala', tagline: 'Drift through emerald canals', image: 'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.9' },
  { name: 'Taj Mahal', slug: 'agra', state: 'Agra', tagline: 'A wonder carved in marble', image: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '5.0' },
  { name: 'Goa Beaches', slug: 'goa', state: 'Goa', tagline: 'Sun, sand and golden sunsets', image: 'https://images.pexels.com/photos/28368719/pexels-photo-28368719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.7' },
  { name: 'Manali Hills', slug: 'manali', state: 'Himachal', tagline: 'Mist over snow-capped peaks', image: 'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.8' },
  { name: 'Jaipur Palaces', slug: 'jaipur', state: 'Rajasthan', tagline: 'The pink city of forts', image: 'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.8' },
  { name: 'Varanasi Ghats', slug: 'varanasi', state: 'Uttar Pradesh', tagline: 'Ancient soul of the Ganges', image: 'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.6' },
  { name: 'Munnar Tea Gardens', slug: 'munnar', state: 'Kerala', tagline: 'Rolling green carpet hills', image: 'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.9' },
  { name: 'Hawa Mahal', slug: 'jaipur', state: 'Jaipur', tagline: 'Winds through pink windows', image: 'https://images.pexels.com/photos/12323903/pexels-photo-12323903.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', rating: '4.7' },
];

const features = [
  { icon: Sparkles, title: 'AI Itineraries', desc: 'Gemini-powered day-by-day plans tailored to your pace and interests across India.' },
  { icon: IndianRupee, title: 'Budget in ₹ (INR)', desc: 'Track every rupee with smart expense logging that keeps your Indian trip on budget.' },
  { icon: ListChecks, title: 'Packing Lists', desc: 'Never forget a thing with interactive checklists tailored to your Indian destination.' },
  { icon: Sun, title: 'Weather Forecast', desc: 'Real-time forecasts so you pack right and plan the perfect day out.' },
  { icon: Map, title: 'Interactive Maps', desc: 'Explore spots and navigate every Indian destination with built-in maps.' },
  { icon: CalendarDays, title: 'Trip History', desc: 'Save and revisit every journey. Your travel story, all in one place.' },
];

const stats = [
  { value: '28+', label: 'Destinations across India' },
  { value: '50K+', label: 'Trips planned and counting' },
  { value: '4.9', label: 'Average traveller rating' },
  { value: '₹0', label: 'To start planning today' },
];

export function LandingPage() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const ctaTo = user ? '/dashboard' : '/signup';
  const ctaLabel = user ? 'Go to Dashboard' : 'Start Planning';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const carouselA = [...destinations, ...destinations];
  const carouselB = [...destinations.slice().reverse(), ...destinations.slice().reverse()];

  return (
    <div className="landing">
      <SeoHead
        title="TripSync — AI Travel Planner for Incredible India"
        description="Plan extraordinary trips across Incredible India with TripSync. Day-by-day AI itineraries, smart ₹ (INR) budget tracking, packing lists, and curated guides for 300+ destinations."
        canonicalPath="/"
        type="website"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "TripSync",
            "alternateName": "TripSync AI Travel Planner",
            "url": "https://tripsync.app",
            "description": "Plan extraordinary trips across Incredible India with TripSync. AI itineraries, ₹ budget tracking, packing lists, and curated destination guides."
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TripSync",
            "url": "https://tripsync.app",
            "logo": "https://tripsync.app/favicon.svg"
          }
        ]}
      />

      {/* NAVBAR */}
      <header className={`nav-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link className="nav-brand" to="/">
            <span className="brand-mark">
              <Compass size={18} strokeWidth={2.4} />
            </span>
            <span>tripsync</span>
          </Link>
          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#destinations" onClick={() => setMobileMenuOpen(false)}>Destinations</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)}>Why TripSync</a>
            {user ? (
              <div className="nav-actions">
                <Link to="/dashboard" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="nav-btn-logout"
                  title="Sign out"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            ) : (
              <div className="nav-actions">
                <Link to="/signin" className="nav-btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </nav>
          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg">
          <img src={destinations[0].image} alt="Incredible India - Scenic Kerala Backwaters" className="hero-bg-img" loading="eager" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title fade-up">
            Plan extraordinary trips<br />across <span className="accent">Incredible India</span>
          </h1>
          <p className="hero-subtitle fade-up" style={{ animationDelay: '.2s' }}>
            From the backwaters of Kerala to the peaks of Manali — TripSync brings AI itineraries,
            budget tracking in ₹, packing lists and spot exploration into one seamless workspace.
          </p>
          <div className="hero-actions fade-up" style={{ animationDelay: '.3s' }}>
            <Link to={ctaTo} className="btn-primary large">
              {ctaLabel} <ArrowRight size={18} />
            </Link>
            <button
              className="btn-ghost large"
              onClick={() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore destinations <ChevronDown size={16} />
            </button>
          </div>
          <div className="hero-trust fade-up" style={{ animationDelay: '.4s' }}>
            <div className="trust-avatars">
              <span>AS</span>
              <span className="overlap">RM</span>
              <span className="overlap">KP</span>
              <span className="overlap">+</span>
            </div>
            <p>Joined by <strong>50,000+</strong> happy travellers</p>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span />
          Scroll to explore
        </div>
      </section>

      {/* CAROUSEL ROW A — left to right */}
      <section className="carousel-section" id="destinations">
        <div className="section-head">
          <p className="eyebrow">Discover India</p>
          <h2>Places waiting to be explored</h2>
        </div>
        <div className="carousel-track">
          <div className="carousel-row animate-left">
            {carouselA.map((d, i) => (
              <Link to={`/destination/${d.slug}`} className="dest-card" key={`a-${i}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="dest-img">
                  <img src={d.image} alt={`${d.name}, ${d.state} - Travel destination in India`} loading="lazy" />
                  <span className="dest-rating">
                    <Star size={11} fill="currentColor" /> {d.rating}
                  </span>
                </div>
                <div className="dest-body">
                  <h3>{d.name}</h3>
                  <p className="dest-tag">{d.tagline}</p>
                  <div className="dest-loc">
                    <Map size={12} /> {d.state}, India
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-head center">
          <p className="eyebrow">Everything in one place</p>
          <h2>Your complete travel companion</h2>
          <p className="section-desc">
            No more juggling multiple apps. TripSync unifies every part of your trip — from the first idea to the final memory.
          </p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <article className="feature-card reveal" style={{ transitionDelay: `${i * 60}ms` }} key={f.title}>
              <div className="feature-icon">
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CAROUSEL ROW B — right to left */}
      <section className="carousel-section alt">
        <div className="section-head">
          <p className="eyebrow">Trending now</p>
          <h2>Where travellers are heading</h2>
        </div>
        <div className="carousel-track">
          <div className="carousel-row animate-right">
            {carouselB.map((d, i) => (
              <Link to={`/destination/${d.slug}`} className="dest-card compact" key={`b-${i}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="dest-img">
                  <img src={d.image} alt={`${d.name}, ${d.state} - Popular travel spot`} loading="lazy" />
                  <span className="dest-rating">
                    <Star size={11} fill="currentColor" /> {d.rating}
                  </span>
                </div>
                <div className="dest-body">
                  <h3>{d.name}</h3>
                  <div className="dest-loc">
                    <Map size={12} /> {d.state}, India
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="section-head center">
          <p className="eyebrow">How it works</p>
          <h2>From idea to itinerary in minutes</h2>
        </div>
        <div className="steps-grid">
          <div className="step-card reveal">
            <div className="step-num">01</div>
            <h3>Pick a destination</h3>
            <p>Search any place across India with autocomplete — from hidden Himalayan villages to iconic coastal towns.</p>
          </div>
          <div className="step-connector">
            <ArrowRight size={20} />
          </div>
          <div className="step-card reveal" style={{ transitionDelay: '120ms' }}>
            <div className="step-num">02</div>
            <h3>Let AI plan it</h3>
            <p>Our Gemini engine builds a day-by-day itinerary tuned to your dates, budget in ₹, and travel vibe.</p>
          </div>
          <div className="step-connector">
            <ArrowRight size={20} />
          </div>
          <div className="step-card reveal" style={{ transitionDelay: '240ms' }}>
            <div className="step-num">03</div>
            <h3>Track & explore</h3>
            <p>Manage expenses in ₹, tick off your packing list, check the weather and explore spots — all in one place.</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-item reveal" style={{ transitionDelay: `${i * 80}ms` }} key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-glow" />
          <h2>Ready to plan your next adventure?</h2>
          <p>Join thousands of travellers using TripSync to explore Incredible India effortlessly.</p>
          <div className="cta-actions">
            <Link to={ctaTo} className="btn-primary large">
              Start planning free <ArrowRight size={18} />
            </Link>
            <button
              className="btn-ghost large"
              onClick={() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See destinations
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-mark">
              <Compass size={18} />
            </span>
            <span>tripsync</span>
          </div>
          <p className="footer-tag">Intelligent travel planning for Incredible India.</p>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#destinations">Destinations</a>
            <a href="#how">How it works</a>
            <a href="#stats">Why TripSync</a>
            <Link to="/signin">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
          <div className="footer-copy">© 2026 TripSync · Made for explorers · All prices in ₹ (INR)</div>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
