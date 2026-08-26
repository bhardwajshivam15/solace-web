import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Heart,
  Lock,
  ShieldCheck,
  BadgeCheck,
  Search,
  MessageCircle,
  Smile,
  ChevronDown,
} from "lucide-react";
import heroFamily from "../assets/hero-family.png";
import { useAuth, ROLE_HOME_PATH } from "../context/AuthContext";
import { apiRequest } from "../lib/apiClient";

const navLinks = [
  { label: "Home", id: null },
  { label: "How It Works", id: "how-it-works" },
  { label: "Become a Listener", id: "become-a-listener" },
  { label: "About Us", id: "about" },
  { label: "FAQ", id: "faq" },
];

const steps = [
  {
    icon: Search,
    title: "Find a Listener",
    description: "Browse verified listeners by topic, language, or rating.",
  },
  {
    icon: MessageCircle,
    title: "Start Talking",
    description: "Chat one-on-one, completely anonymously, at your own pace.",
  },
  {
    icon: Smile,
    title: "Feel Better",
    description: "Rate your session and come back whenever you need to talk.",
  },
];

const DEFAULT_ABOUT_TEXT =
  "Solace connects people who need to talk with trained, verified listeners — anonymously, securely, and on their own terms. We believe everyone deserves a safe space to be heard.";

const DEFAULT_FAQS = [
  {
    question: "Is my conversation really anonymous?",
    answer:
      "Yes. You never have to share your real name, and listeners only see what you choose to tell them.",
  },
  {
    question: "How much does a session cost?",
    answer: "Sessions are billed per minute, starting at ₹10/min, deducted from your wallet.",
  },
  {
    question: "Can I become a listener?",
    answer:
      "Absolutely — apply below and our team will review your application before you go live.",
  },
];

interface PublicCmsPage {
  title: string;
  slug: string;
  content: string;
}

interface Faq {
  question: string;
  answer: string;
}

async function fetchPublicPage(slug: string): Promise<PublicCmsPage | null> {
  try {
    const data = await apiRequest<{ page: PublicCmsPage }>(`/cms/pages/${slug}`);
    return data.page;
  } catch {
    return null;
  }
}

// The CMS stores FAQ content as one text blob — paragraphs separated by a
// blank line, each starting with "Question? Answer." Split it back into
// question/answer pairs so the accordion UI keeps working.
function parseFaqs(content: string): Faq[] {
  const parsed = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const splitIndex = paragraph.indexOf("?");
      if (splitIndex === -1) return null;
      return {
        question: paragraph.slice(0, splitIndex + 1).trim(),
        answer: paragraph.slice(splitIndex + 1).trim(),
      };
    })
    .filter((faq): faq is Faq => faq !== null && faq.answer.length > 0);

  return parsed.length > 0 ? parsed : DEFAULT_FAQS;
}

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [aboutText, setAboutText] = useState(DEFAULT_ABOUT_TEXT);
  const [faqs, setFaqs] = useState<Faq[]>(DEFAULT_FAQS);

  useEffect(() => {
    // Fall back to the hardcoded copy above if the backend is unreachable or
    // these pages aren't published — the marketing site should never go blank.
    fetchPublicPage("about-us").then((page) => {
      if (page) setAboutText(page.content);
    });
    fetchPublicPage("faq").then((page) => {
      if (page) setFaqs(parseFaqs(page.content));
    });
  }, []);

  // Logged-in users don't need the marketing page or its signup-flavored
  // CTAs — send them straight to whatever "home" means for their role.
  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  const scrollToSection = (id: string | null) => (event: MouseEvent) => {
    event.preventDefault();
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-8 py-5 lg:px-16">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-6 w-6 fill-brand-600 text-brand-600" />
          <span className="text-lg font-bold text-ink-900">Solace</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.id ? `#${link.id}` : "#"}
              onClick={scrollToSection(link.id)}
              className="text-sm font-medium text-gray-600 hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-ink-900"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Sign up
          </Link>
        </div>
      </header>

      <section className="grid items-center gap-12 px-8 py-10 lg:grid-cols-2 lg:px-16 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600">
            <Lock className="h-3.5 w-3.5" />
            A safe space to talk. We're here to listen.
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-tight text-ink-900 lg:text-6xl">
            Talk. Share. Heal.
            <br />
            We're here for <span className="text-brand-600">you.</span>
          </h1>

          <p className="mt-6 max-w-md text-base text-gray-500">
            Connect anonymously with trained listeners who understand and
            support you.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/app/find-listeners"
              className="rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
            >
              Talk to a Listener
            </Link>
            <Link
              to="/signup?as=listener"
              className="rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              Become a Listener
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              100% Anonymous
            </span>
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-600" />
              Secure &amp; Private
            </span>
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-brand-600" />
              Verified Listeners
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <img
            src={heroFamily}
            alt="A multi-generational family relaxing together, each with a speech bubble about feeling heard and supported"
            className="w-full max-w-xl rounded-3xl"
          />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-gray-50 px-8 py-16 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-ink-900">How It Works</h2>
          <p className="mt-2 text-gray-500">
            Getting support takes less than a minute.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <Icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="become-a-listener"
        className="scroll-mt-20 px-8 py-16 lg:px-16"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl bg-brand-600 p-10 text-center text-white lg:flex-row lg:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Become a Listener</h2>
            <p className="mt-2 text-brand-100">
              Share your time, earn per session, and help someone feel heard.
              Applications are reviewed by our team before you go live.
            </p>
          </div>
          <Link
            to="/signup?as=listener"
            className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Apply Now
          </Link>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 bg-gray-50 px-8 py-16 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-ink-900">About Us</h2>
          <p className="mt-4 whitespace-pre-line text-gray-500">{aboutText}</p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 px-8 py-16 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold text-ink-900">FAQ</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-gray-100 p-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink-900">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-gray-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-8 py-8 text-center text-sm text-gray-400 lg:px-16">
        <p>© 2026 Solace. All rights reserved.</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Link to="/legal/terms-of-service" className="hover:text-ink-900">
            Terms of Service
          </Link>
          <Link to="/legal/privacy-policy" className="hover:text-ink-900">
            Privacy Policy
          </Link>
          <Link to="/legal/community-guidelines" className="hover:text-ink-900">
            Community Guidelines
          </Link>
        </div>
      </footer>
    </div>
  );
}
