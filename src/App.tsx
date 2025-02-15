import { useState, useEffect, useRef } from 'react'
import { load, Store } from '@tauri-apps/plugin-store'
import '@fontsource-variable/inter'
import './App.css'

import Header from './components/Header'
import GameList from './components/GameList'
import GameDetails from './components/GameDetails'
import IgdbModal from './components/IgdbModal'

interface ProcessInfo {
  id: number
  name: string
  path: string
  time: number
  releaseDate: number
  description: string
  screenshots: string[]
  genre_names: string[]
  running: boolean
  customName?: string
  coverUrl?: string
  addedDate: string
  lastPlayedDate?: string
  fileExists: boolean
}

interface SelectedGame extends ProcessInfo {
  fileExists: boolean
  id: number
}

function App() {
  const [trackedProcesses, setTrackedProcesses] = useState<ProcessInfo[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showIgdbModal, setShowIgdbModal] = useState<boolean>(false)
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeRef = useRef<Store | null>(null)

  useEffect(() => {
    const initializeStore = async () => {
      storeRef.current = await load('D:\\storageGames\\store.json', {
        autoSave: true,
      })

      const storedProcesses = (await storeRef.current.get('processes')) || []
      if (Array.isArray(storedProcesses)) {
        setTrackedProcesses(storedProcesses)
      } else {
        setTrackedProcesses([])
      }
    }

    initializeStore()
  }, [])

  const handleGameSelect = (name: string, id: number) => {
    setSelectedGame({
      name,
      id,
      fileExists: false,
      path: '',
      time: 0,
      releaseDate: 0,
      description: '',
      screenshots: [],
      genre_names: [],
      running: false,
      addedDate: '',
      customName: '',
      coverUrl: '',
    })
    setShowIgdbModal(false)
  }

  return (
    <main className="w-full min-h-screen bg-background p-4">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowIgdbModal={setShowIgdbModal}
      />

      <div className="flex gap-4">
        <GameList
          trackedProcesses={trackedProcesses}
          searchQuery={searchQuery}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
        />

        <div className="flex flex-col max-w-[900px] mx-auto z-10">
          {selectedGame ? (
            <GameDetails
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              trackedProcesses={trackedProcesses.map((process) => ({
                ...process,
                fileExists: process.fileExists ?? true,
              }))}
              setTrackedProcesses={setTrackedProcesses}
            />
          ) : (
            <span className="text-lg">Select a game from the list</span>
          )}
        </div>
      </div>

      {showIgdbModal && (
        <IgdbModal
          onSelectGame={handleGameSelect}
          storeRef={storeRef}
          onClose={() => setShowIgdbModal(false)}
          setTrackedProcesses={setTrackedProcesses}
          setSelectedGame={setSelectedGame}
          trackedProcesses={trackedProcesses}
        />
      )}
    </main>
  )
}

export default App
