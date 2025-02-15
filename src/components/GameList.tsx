import React from 'react'
import { invoke } from '@tauri-apps/api/core'

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

interface GameListProps {
  trackedProcesses: ProcessInfo[] | null
  searchQuery: string
  selectedGame: ProcessInfo | null
  setSelectedGame: (game: ProcessInfo | null) => void
}

const GameList: React.FC<GameListProps> = ({
  trackedProcesses,
  searchQuery,
  selectedGame,
  setSelectedGame,
}) => {
  const handleGameClick = async (process: ProcessInfo) => {
    try {
      const fileExists = await invoke('check_if_file_exists', {
        path: process.path,
      })

      setSelectedGame({
        ...process,
        fileExists: fileExists as boolean,
      })
    } catch (error) {
      console.error('Error checking file existence:', error)
    }
  }

  return (
    <div className="max-w-[287px] min-w-[287px] flex-1">
      <div className="flex flex-col gap-2">
        <div className="collapse collapse-arrow rounded-md">
          <input type="checkbox" defaultChecked />
          <div className="flex items-center gap-4 collapse-title bg-secondary rounded-md">
            All Games{' '}
            <span className="text-sm bg-foreground px-2 py-1 rounded-md">
              {trackedProcesses?.length}
            </span>
          </div>
          <div className="collapse-content p-0 mt-2">
            <ul className="list-disc">
              {(trackedProcesses || [])
                .filter(
                  (process) =>
                    process.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    (process.customName &&
                      process.customName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())),
                )
                .sort((a, b) => {
                  const dateA = new Date(a.addedDate).getTime()
                  const dateB = new Date(b.addedDate).getTime()
                  return dateB - dateA
                })
                .map((process) => (
                  <div
                    key={process.name}
                    className={`flex items-center gap-2 px-4 py-3 rounded-md hover:bg-[#343437] transition cursor-pointer ${
                      selectedGame?.name === process.name ? 'bg-secondary' : ''
                    }`}
                    onClick={() => handleGameClick(process)}
                  >
                    <img
                      src={
                        process.coverUrl ||
                        'https://i.pinimg.com/736x/34/8d/53/348d53c456c2826821d17f421996031b.jpg'
                      }
                      alt={process.customName || process.name}
                      className="w-7 h-7 object-cover rounded aspect-square"
                    />
                    <span
                      className="text-sm truncate"
                      style={{
                        maxWidth: '245px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {process.customName || process.name}
                    </span>
                  </div>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameList
