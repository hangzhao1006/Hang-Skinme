interface AnimatedGradientBackgroundProps {
  className?: string;
}

export function AnimatedGradientBackground({ className = '' }: AnimatedGradientBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Multiple gradient layers for depth */}
      <div className="absolute inset-0 animate-gradient-flow-1">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-300/40 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="absolute inset-0 animate-gradient-flow-2">
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-300/40 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="absolute inset-0 animate-gradient-flow-3">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/30 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="absolute inset-0 animate-gradient-flow-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/40 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="absolute inset-0 animate-gradient-flow-5">
        <div className="absolute inset-0 bg-gradient-to-bl from-rose-300/30 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="absolute inset-0 animate-gradient-flow-6">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-500/25 via-transparent to-transparent blur-3xl" />
      </div>

      <style>{`
        @keyframes gradientFlow1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(20%, 15%) scale(1.1); }
          66% { transform: translate(-15%, 20%) scale(0.9); }
        }

        @keyframes gradientFlow2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(-25%, 10%) scale(1.15); }
          66% { transform: translate(15%, -20%) scale(0.95); }
        }

        @keyframes gradientFlow3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(10%, -20%) scale(0.9); }
          66% { transform: translate(-20%, 15%) scale(1.1); }
        }

        @keyframes gradientFlow4 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(-15%, -15%) scale(1.2); }
          66% { transform: translate(25%, 10%) scale(0.85); }
        }

        @keyframes gradientFlow5 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(15%, 25%) scale(0.95); }
          66% { transform: translate(-10%, -15%) scale(1.05); }
        }

        @keyframes gradientFlow6 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(-20%, -10%) scale(1.1); }
          66% { transform: translate(20%, 20%) scale(0.9); }
        }

        .animate-gradient-flow-1 {
          animation: gradientFlow1 25s ease-in-out infinite;
        }

        .animate-gradient-flow-2 {
          animation: gradientFlow2 30s ease-in-out infinite;
        }

        .animate-gradient-flow-3 {
          animation: gradientFlow3 28s ease-in-out infinite;
        }

        .animate-gradient-flow-4 {
          animation: gradientFlow4 32s ease-in-out infinite;
        }

        .animate-gradient-flow-5 {
          animation: gradientFlow5 27s ease-in-out infinite;
        }

        .animate-gradient-flow-6 {
          animation: gradientFlow6 35s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
