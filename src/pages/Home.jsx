import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollExpandHero from '@/components/ScrollExpandHero';

const MEDIA_SRC = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1280&auto=format&fit=crop';
const BG_SRC = 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop';

export default function Home() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const goToForm = () => {
    setLeaving(true);
    setTimeout(() => navigate('/new-plan'), 500);
  };

  return (
    <>
      <AnimatePresence>
        {leaving && (
          <motion.div
            className="fixed inset-0 bg-black z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>

      <ScrollExpandHero
        mediaSrc={MEDIA_SRC}
        bgImageSrc={BG_SRC}
        title="Safe Return"
        subtitle="ready"
        scrollToExpand="Scroll to explore"
      >
        <div className="flex flex-col items-center justify-center text-center gap-6 py-8 px-4">
          <motion.h2
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Are you ready to file your trip plan?
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Let your loved ones know where you are going — takes just 2 minutes.
          </motion.p>

          <motion.button
            onClick={goToForm}
            className="relative px-8 py-4 text-lg font-bold text-white rounded-2xl bg-primary overflow-hidden w-full max-w-xs"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            style={{ boxShadow: '0 0 30px rgba(91,164,245,0.6), 0 0 60px rgba(91,164,245,0.3), 0 4px 20px rgba(0,0,0,0.2)' }}
          >
            <motion.span
              className="absolute inset-0 rounded-2xl bg-primary"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            <span className="relative z-10">Yes, let's go!</span>
          </motion.button>

          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            Already have plans?{' '}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-primary font-medium hover:underline"
            >
              View my trips
            </button>
          </motion.p>
        </div>
      </ScrollExpandHero>
    </>
  );
}