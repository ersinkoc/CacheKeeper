import { Link, useLocation } from 'react-router-dom'
import { Github, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Docs', href: '/docs/getting-started' },
  { label: 'Examples', href: '/examples' },
  { label: 'Playground', href: '/playground' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="CacheKeeper" className="w-8 h-8" />
            <span className="font-bold text-xl text-white">CacheKeeper</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith(item.href.split('/').slice(0, 2).join('/'))
                    ? 'text-sky-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://github.com/oxog/cachekeeper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://github.com/oxog/cachekeeper"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        )}
      </nav>
    </header>
  )
}
