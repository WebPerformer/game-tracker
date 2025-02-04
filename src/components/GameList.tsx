import React from 'react'

interface ProcessInfo {
  id: number // id field is required
  name: string
  path: string
  time: number
  running: boolean
  customName?: string
  coverUrl?: string
  addedDate: string
  lastPlayedDate?: string
  fileExists: boolean
}

interface GameListProps {
  processesToShow: ProcessInfo[]
  selectedGame: ProcessInfo | null
  handleGameClick: (process: ProcessInfo) => void
}

const GameList: React.FC<GameListProps> = ({
  processesToShow,
  selectedGame,
  handleGameClick,
}) => {
  return (
    <div className="max-w-[287px] min-w-[287px] flex-1">
      <div className="flex flex-col gap-2">
        <div className="collapse collapse-arrow rounded-md">
          <input type="checkbox" defaultChecked />
          <div className="flex items-center gap-4 collapse-title bg-secondary rounded-md">
            All Games{' '}
            <span className="text-sm bg-foreground px-2 py-1 rounded-md">
              {processesToShow.length}
            </span>
          </div>
          <div className="collapse-content p-0 mt-2">
            <ul className="list-disc">
              {processesToShow
                .sort((a, b) => {
                  const dateA = new Date(a.addedDate).getTime() // Get timestamp for dateA
                  const dateB = new Date(b.addedDate).getTime() // Get timestamp for dateB
                  return dateB - dateA // Compare the timestamps
                })
                .map((process) => (
                  <div
                    key={process.name}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md hover:bg-[#343437] transition cursor-pointer ${
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
                      className="w-8 h-8 object-cover rounded"
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
