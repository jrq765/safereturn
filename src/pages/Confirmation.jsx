import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Shield } from "lucide-react";

const CONFIRM_IMAGE = "https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/89b660b3f_generated_image.png";

export default function Confirmation() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center font-inter">
      <div className="mb-8">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{"You're All Set!"}</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your trip plan has been filed and your emergency contacts have been notified via email.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden mb-8 max-w-sm mx-auto">
        <img src={CONFIRM_IMAGE} alt="Safety network" className="w-full h-48 object-cover" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-8 text-left space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          What Happens Next
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5">1.</span>
            Your contacts received a detailed email with your full trip plan.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5">2.</span>
            {"If you don't return by your expected time, they have everything needed to alert authorities."}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5">3.</span>
            {"When you're back safe, mark your trip as completed from your dashboard."}
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/dashboard">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
            View My Plans <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link to="/new-plan">
          <Button variant="outline" className="gap-2">
            File Another Plan
          </Button>
        </Link>
      </div>
    </div>
  );
}