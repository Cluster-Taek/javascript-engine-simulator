export const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-800/50 py-4">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
        <span>&copy; 2026 JavaScript Engine Simulator</span>
        <span>·</span>
        <a
          href="https://github.com/Cluster-Taek/javascript-engine-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
};
