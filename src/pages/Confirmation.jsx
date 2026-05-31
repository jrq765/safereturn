import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Shield } from "lucide-react";

const bgImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&auto=format&fit=crop";

export default function Confirmation() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  return (
    <div className="relative min-h-screen font-inter">
      <div className="fixed inset-0 z-0">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-3">You're all set!</h1>
        <p className="text-white/70 text-center max-w-sm mb-8 leading-relaxed">
          Your trip plan has been filed and your emergency contacts have been notified with your full details and a PDF copy of your plan.
        </p>

        {/* What happens next */}
        <div className="w-full bg-black/55 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-white/70" /> What Happens Next
          </h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold shrink-0">1.</span>
              Your emergency contacts received an email with your trip details and a PDF they can print or share with authorities.
            </li>
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold shrink-0">2.</span>
              If you do not return by your expected time, your contacts know to alert the local Search and Rescue agency.
            </li>
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold shrink-0">3.</span>
              When you are safely home, mark your trip complete from your dashboard.
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
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
              File Another Plan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}