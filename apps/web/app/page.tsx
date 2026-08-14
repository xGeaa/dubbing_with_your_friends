export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        🎙️ Dubbing With Your Friends
      </h1>
      <p className="text-zinc-400 text-center max-w-md">
        Watch a clip. Dub it. Vote for the best one.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors">
          Create Room
        </button>
        <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-colors">
          Join Room
        </button>
      </div>
    </main>
  )
}
