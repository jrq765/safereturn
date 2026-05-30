import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, UserPlus, ArrowRight } from "lucide-react";

export default function PostSubmitAuthPrompt({ tripId, primaryData, onSkip }) {
  const params = new URLSearchParams({
    prefill_name: primaryData.primary_name || "",
    prefill_phone: primaryData.primary_phone || "",
    prefill_age: primaryData.primary_age || "",
    prefill_blood: primaryData.primary_blood_type || "",
    trip_id: tripId,
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="relative z-10 w-full max-w-md bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Plan Filed! 🛡️</h2>
        <p className="text-white/60 text-sm mb-6">
          Your trip plan has been saved and your emergency contacts have been notified.
          <br /><br />
          Create a free account to access your plans anytime and pre-fill your info for future trips.
        </p>

        <div className="space-y-3">
          <Link
            to={`/register?${params.toString()}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Create Free Account
          </Link>
          <Link
            to={`/login?trip_id=${tripId}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors text-sm"
          >
            I already have an account — Sign In
          </Link>
          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-1 w-full py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            Skip — View Confirmation <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}