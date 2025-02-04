import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { load, Store } from '@tauri-apps/plugin-store'
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  ArrowTurnRightUpIcon,
} from '@heroicons/react/24/solid'

interface ProcessInfo {
  id: number
  name: string
  path: string
  time: number
  running: boolean
  addedDate: string
  fileExists: boolean
  coverUrl?: string
}

interface IgdbModalProps {
  onClose: () => void
  onSelectGame: (name: string, id: number, cover: string) => void
  storeRef: React.MutableRefObject<Store | null>
  setTrackedProcesses: React.Dispatch<React.SetStateAction<ProcessInfo[]>>
  setCurrentProcess: React.Dispatch<React.SetStateAction<ProcessInfo | null>>
  setSelectedGame: React.Dispatch<React.SetStateAction<ProcessInfo | null>>
  trackedProcesses: ProcessInfo[] // Add this prop to access the state
}

interface Game {
  id: number
  cover: {
    image_id: string
  }
  name: string
}

const IgdbModal: React.FC<IgdbModalProps> = ({
  onClose,
  setTrackedProcesses,
  setCurrentProcess,
  setSelectedGame,
  trackedProcesses,
  storeRef,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return

    setLoading(true)
    try {
      const response = await invoke('search_games', { query: searchQuery })
      const games = Array.isArray(response) ? response : []
      setGames(games)
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProcess = async (selectedGame: Game) => {
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: 'Executables', extensions: ['exe'] }],
      })

      if (file && typeof file === 'string') {
        const processPath = file
        const processName = file.split('\\').pop() || file

        // Check if the process is already being tracked
        const alreadyTracked = trackedProcesses.some(
          (p) => p.name === processName,
        )

        if (!alreadyTracked) {
          const newProcess: ProcessInfo = {
            id: selectedGame.id, // Use API ID
            name: selectedGame.name,
            path: processPath,
            time: 0,
            running: false,
            addedDate: new Date().toISOString(),
            fileExists: true,
            coverUrl: `https://images.igdb.com/igdb/image/upload/t_1080p/${selectedGame.cover.image_id}.jpg`,
          }

          // Update state with the new process
          setTrackedProcesses((prev) => [...prev, newProcess])

          // Save to localStorage as a fallback (optional)
          localStorage.setItem(processName, JSON.stringify(newProcess))

          // Update selected process states
          setCurrentProcess(newProcess)
          setSelectedGame(newProcess)

          try {
            // Ensure storeRef.current is initialized before using it
            if (!storeRef.current) {
              const store = await load('D:\\storageGames\\store.json', {
                autoSave: true,
              })
              storeRef.current = store
            }

            // Retrieve existing processes (if any), fallback to empty array if not found
            const existingProcesses =
              (await storeRef.current.get('processes')) || []

            // Ensure existingProcesses is always an array
            if (!Array.isArray(existingProcesses)) {
              throw new Error('Stored processes data is not an array')
            }

            // Save the process info in the store
            await storeRef.current.set('processes', [
              ...existingProcesses,
              newProcess,
            ])
            await storeRef.current.save()
            console.log('Process saved to store:', newProcess)
          } catch (error) {
            console.error('Failed to save process to store:', error)
          }

          // Close modal after saving
          onClose()
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error)
    }
  }

  return (
    <>
      <div className="w-full h-screen fixed top-0 left-0 z-40 bg-black opacity-50" />
      <div className="fixed top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 w-2/3 max-w-[800px] h-2/3 flex flex-col gap-4 bg-background p-[20px] rounded-[8px] [box-shadow:0_4px_10px_rgba(0,_0,_0,_0.1)] text-center z-50 overflow-y-scroll">
        <div className="modal-content">
          <h2 className="text-xl mb-4">Search Games</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="relative w-fit">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquise por um jogo..."
                className="w-[287px] bg-secondary border-2 border-secondary px-3 py-1 rounded-md pl-9 pr-9 placeholder:text-textGray"
              />
              <MagnifyingGlassIcon className="absolute top-[10px] left-3 size-4 text-textGray" />
              {searchQuery && (
                <XCircleIcon
                  className="absolute top-[10px] right-3 size-4 text-textGray cursor-pointer hover:text-white transition"
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>
            <button onClick={handleSearch} disabled={loading}>
              {loading ? (
                'Buscando...'
              ) : (
                <div className="bg-secondary p-2 rounded-md">
                  <ArrowTurnRightUpIcon className="size-4 text-textGray" />
                </div>
              )}
            </button>
          </div>

          <div className="mt-4">
            {games.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4">
                {games.map((game: Game) => (
                  <li
                    key={game.id}
                    onClick={() => handleSaveProcess(game)}
                    className="flex gap-4 items-center bg-secondary p-3 rounded-md cursor-pointer hover:bg-hoverBackground"
                  >
                    {game.cover?.image_id && (
                      <img
                        src={`https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`}
                        alt={game.name}
                        className="rounded-md"
                      />
                    )}
                    <h3 className="text-lg text-start">{game.name}</h3>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No games found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default IgdbModal
