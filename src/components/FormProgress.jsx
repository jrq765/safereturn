import { Check } from "lucide-react";

const steps = [
  { label: "Who", short: "WHO" },
  { label: "Where", short: "WHERE" },
  { label: "When", short: "WHEN" },
  { label: "What", short: "WHAT" },
  { label: "Equipment", short: "EQUIP" },
  { label: "Contacts", short: "SOS" },
];

export default function FormProgress({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                i < currentStep
                  ? "bg-accent text-accent-foreground"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`mt-1.5 text-xs font-medium hidden sm:block ${
              i === currentStep ? "text-foreground" : "text-muted-foreground"
            }`}>
              {step.label}
            </span>
            <span className={`mt-1.5 text-xs font-medium sm:hidden ${
              i === currentStep ? "text-foreground" : "text-muted-foreground"
            }`}>
              {step.short}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-12 md:w-16 h-0.5 mx-1 sm:mx-2 transition-colors ${
              i < currentStep ? "bg-accent" : "bg-border"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}