import { Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="CacheKeeper" className="w-8 h-8" />
              <span className="font-bold text-xl text-white">CacheKeeper</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              A zero-dependency, type-safe caching toolkit for TypeScript and JavaScript applications.
              Built for performance and developer experience.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs/getting-started" className="text-slate-400 hover:text-white transition-colors">
                  Getting Started
                </a>
              </li>
              <li>
                <a href="/docs/api" className="text-slate-400 hover:text-white transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/examples" className="text-slate-400 hover:text-white transition-colors">
                  Examples
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/oxog/cachekeeper"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/oxog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} CacheKeeper. Released under the MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}
