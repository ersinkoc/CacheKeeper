import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { GettingStarted } from './pages/docs/GettingStarted'
import { Configuration } from './pages/docs/Configuration'
import { Strategies } from './pages/docs/Strategies'
import { Storage } from './pages/docs/Storage'
import { Namespaces } from './pages/docs/Namespaces'
import { Tags } from './pages/docs/Tags'
import { Events } from './pages/docs/Events'
import { Statistics } from './pages/docs/Statistics'
import { Plugins } from './pages/docs/Plugins'
import { ReactAdapter } from './pages/docs/ReactAdapter'
import { APIReference } from './pages/docs/APIReference'
import { Examples } from './pages/Examples'
import { Playground } from './pages/Playground'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="docs">
          <Route path="getting-started" element={<GettingStarted />} />
          <Route path="configuration" element={<Configuration />} />
          <Route path="strategies" element={<Strategies />} />
          <Route path="storage" element={<Storage />} />
          <Route path="namespaces" element={<Namespaces />} />
          <Route path="tags" element={<Tags />} />
          <Route path="events" element={<Events />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="react" element={<ReactAdapter />} />
          <Route path="api" element={<APIReference />} />
        </Route>
        <Route path="examples" element={<Examples />} />
        <Route path="playground" element={<Playground />} />
      </Route>
    </Routes>
  )
}
