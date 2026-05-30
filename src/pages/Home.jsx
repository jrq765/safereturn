import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Mail, Users } from "lucide-react";

const HERO_IMAGE = "https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/c3b3ead26_generated_image.png";

const features = [
  { icon: Clock, title: "Quick to Fill Out", desc: "A guided step-by-step form takes just a few minutes — no paperwork needed." },
  { icon: Mail, title: "Auto-Notify Loved Ones", desc: "Your trip plan is instantly emailed to your chosen family & friends." },
  { icon: Users, title: "Faster Response", desc: "If something goes wrong, your contacts already have every detail authorities need." },
  { icon: Shield, title: "Peace of Mind", desc: "Know that the people who matter most are informed and ready to help." },
];

export default function Home() {
  return (
    <div className="font-inter">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/90 via-accent/70 to-accent/40" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white/90">Outdoor Safety Made Simple</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Come Home<br />Safe. Every Time.
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-md leading-relaxed">
              File a trip plan before you head out. Your loved ones get notified automatically — so if something goes wrong, help comes faster.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/new-plan">
                <Button size="lg" className="text-base px-8 py-6 font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg">
                  File a Trip Plan
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 font-semibold border-white/30 text-white hover:bg-white/10">
                  View My Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground">How SafeReturn Works</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">A simple process that could save a life.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent text-accent-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Every Minute Counts</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            The faster authorities know someone is missing, the higher the chance of a safe return. File your trip plan now.
          </p>
          <Link to="/new-plan">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-base px-10 py-6 font-semibold shadow-lg">
              Get Started — It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="font-semibold text-foreground">SafeReturn</span>
          </div>
          <p className="text-sm text-muted-foreground">Helping people come home safe since 2024.</p>
        </div>
      </footer>
    </div>
  );
}