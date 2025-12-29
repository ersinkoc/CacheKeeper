import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

export function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const showSidebar = location.pathname.startsWith('/docs')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
      {isHome && <Footer />}
    </div>
  )
}
