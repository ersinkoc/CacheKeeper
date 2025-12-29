import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Settings,
  Layers,
  Database,
  FolderTree,
  Tags,
  Radio,
  BarChart3,
  Puzzle,
  Component,
  FileCode
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Introduction',
    items: [
      { label: 'Getting Started', href: '/docs/getting-started', icon: BookOpen },
      { label: 'Configuration', href: '/docs/configuration', icon: Settings },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { label: 'Strategies', href: '/docs/strategies', icon: Layers },
      { label: 'Storage Adapters', href: '/docs/storage', icon: Database },
      { label: 'Namespaces', href: '/docs/namespaces', icon: FolderTree },
      { label: 'Tags', href: '/docs/tags', icon: Tags },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'Events', href: '/docs/events', icon: Radio },
      { label: 'Statistics', href: '/docs/statistics', icon: BarChart3 },
      { label: 'Plugins', href: '/docs/plugins', icon: Puzzle },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'React Adapter', href: '/docs/react', icon: Component },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'API Reference', href: '/docs/api', icon: FileCode },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-900 border-r border-slate-700 p-4">
      {sidebarItems.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
