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

interface Game {
  id: number
  cover: {
    image_id: string
  }
  name: string
  first_release_date: number
  summary: string
  screenshots: {
    image_id: string
  }[]
  genres: number[]
  genre_names: string[]
}

interface IgdbModalProps {
  onClose: () => void
  onSelectGame: (name: string, id: number, cover: string) => void
  storeRef: React.MutableRefObject<Store | null>
  setTrackedProcesses: React.Dispatch<React.SetStateAction<ProcessInfo[]>>
  setSelectedGame: React.Dispatch<React.SetStateAction<ProcessInfo | null>>
  trackedProcesses: ProcessInfo[] // Add this prop to access the state
}

const IgdbModal: React.FC<IgdbModalProps> = ({
  onClose,
  setTrackedProcesses,
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
      console.log(response)
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

        const alreadyTracked = trackedProcesses.some(
          (p) => p.name === processName,
        )

        if (!alreadyTracked) {
          const newProcess: ProcessInfo = {
            id: selectedGame.id,
            name: processName,
            customName: selectedGame.name || 'Unknown Game',
            path: processPath,
            time: 0,
            releaseDate: selectedGame.first_release_date,
            description: selectedGame.summary,
            screenshots: selectedGame.screenshots
              .slice(0, 3)
              .map(
                (s) =>
                  `https://images.igdb.com/igdb/image/upload/t_original/${s.image_id}.jpg`,
              ),
            genre_names: selectedGame.genre_names || [],
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
      <div
        onClick={onClose}
        className="w-full h-screen fixed top-0 left-0 z-40 bg-black opacity-50"
      />
      <div className="fixed top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[500px]  flex flex-col gap-4 bg-background p-[20px] rounded-[8px] [box-shadow:0_4px_10px_rgba(0,_0,_0,_0.1)] text-center z-50 overflow-y-auto">
        <div className="modal-content">
          <h2 className="text-xl mb-4">Search Games</h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="relative w-fit">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a game..."
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid"
                  width="32"
                  height="32"
                  style={{
                    shapeRendering: 'auto',
                    display: 'block',
                    background: 'transparent',
                  }}
                >
                  <g>
                    <circle fill="#969698" r="10" cy="50" cx="84">
                      <animate
                        begin="0s"
                        keySplines="0 0.5 0.5 1"
                        values="10;0"
                        keyTimes="0;1"
                        calcMode="spline"
                        dur="0.25s"
                        repeatCount="indefinite"
                        attributeName="r"
                      />
                      <animate
                        begin="0s"
                        values="#969698;#969698;#969698;#969698;#969698"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="discrete"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="fill"
                      />
                    </circle>
                    <circle fill="#969698" r="10" cy="50" cx="16">
                      <animate
                        begin="0s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="0;0;10;10;10"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="r"
                      />
                      <animate
                        begin="0s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="16;16;16;50;84"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="cx"
                      />
                    </circle>
                    <circle fill="#969698" r="10" cy="50" cx="50">
                      <animate
                        begin="-0.25s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="0;0;10;10;10"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="r"
                      />
                      <animate
                        begin="-0.25s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="16;16;16;50;84"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="cx"
                      />
                    </circle>
                    <circle fill="#969698" r="10" cy="50" cx="84">
                      <animate
                        begin="-0.5s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="0;0;10;10;10"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="r"
                      />
                      <animate
                        begin="-0.5s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="16;16;16;50;84"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="cx"
                      />
                    </circle>
                    <circle fill="#969698" r="10" cy="50" cx="16">
                      <animate
                        begin="-0.75s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="0;0;10;10;10"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="r"
                      />
                      <animate
                        begin="-0.75s"
                        keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                        values="16;16;16;50;84"
                        keyTimes="0;0.25;0.5;0.75;1"
                        calcMode="spline"
                        dur="1s"
                        repeatCount="indefinite"
                        attributeName="cx"
                      />
                    </circle>
                    <g />
                  </g>
                </svg>
              ) : (
                <div className="bg-secondary hover:bg-foreground p-2 rounded-md">
                  <ArrowTurnRightUpIcon className="size-4 text-textGray" />
                </div>
              )}
            </button>
          </div>

          <div className="mt-4">
            {games.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2">
                {games.map((game: Game) => (
                  <li
                    key={game.id}
                    onClick={() => handleSaveProcess(game)}
                    className="p-3 cursor-pointer hover:bg-secondary rounded-md"
                  >
                    {game.cover?.image_id && (
                      <img
                        src={`https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`}
                        alt={game.name}
                        className="rounded-md"
                      />
                    )}
                    <h3 className="text-lg text-start mt-3 line-clamp-2">
                      {game.name}
                    </h3>
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
