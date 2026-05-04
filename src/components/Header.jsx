import { VERSION } from '../version'

export default function Header() {
  return (
    <header
      className="bg-blue-600 text-white px-5 pb-4"
      style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Finance Perso</h1>
          <p className="text-blue-200 text-xs mt-0.5">Gérez vos finances simplement</p>
        </div>
        <span className="text-blue-200 text-xs bg-blue-700/60 px-2.5 py-1 rounded-full font-mono">
          v{VERSION}
        </span>
      </div>
    </header>
  )
}
