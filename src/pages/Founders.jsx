import { Linkedin } from "lucide-react";

const bgImage = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&auto=format&fit=crop";

const FOUNDERS = [
  {
    name: "JR Quint",
    linkedin: "https://www.linkedin.com/in/jrquint/",
    image: "https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/b7f610b14_ChatGPTImageMay27202603_26_03PM.png",
    objectPosition: "center top",
    placeholder: "JQ",
  },
  {
    name: "Sebastian Morse",
    linkedin: "https://www.linkedin.com/in/sebastian-morse/",
    image: "https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/b62879853_image.png",
    objectPosition: "center top",
    placeholder: "SM",
  },
  {
    name: "Craig Chisholm",
    linkedin: "https://www.linkedin.com/in/craig-chisholm03/",
    image: "https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/e44e3318b_image.png",
    objectPosition: "center top",
    placeholder: "CC",
  },
];

export default function Founders() {
  return (
    <div className="relative min-h-screen font-inter">
      <div className="fixed inset-0 z-0">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Meet the Founders</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            The team behind SafeReturn — building tools that bring adventurers home safely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FOUNDERS.map((founder) => (
            <div
              key={founder.name}
              className="bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center text-center hover:border-white/40 transition-all"
            >
              <div className="w-28 h-28 rounded-full border-2 border-white/30 overflow-hidden mb-5 flex items-center justify-center bg-white/10">
                {founder.image ? (
                  <img src={founder.image} alt={founder.name} className={`w-full h-full object-cover ${founder.objectScale || ""}`} style={{ objectPosition: founder.objectPosition || "center center" }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <span className="text-3xl font-bold text-white/70">{founder.placeholder}</span>
                )}
              </div>

              <h2 className="text-xl font-bold text-white mb-4">{founder.name}</h2>

              <a
                href={founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0077B5]/80 hover:bg-[#0077B5] border border-[#0077B5]/50 text-white text-sm font-semibold transition-all hover:scale-105"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}