import React from 'react'
import { PlayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid'

// Define the type for the selected game
interface GameInfo {
  id: number
  name: string
  customName?: string
  coverUrl?: string
  time: number
  addedDate: string
  lastPlayedDate?: string
  path: string
  running: boolean
  fileExists: boolean
}

// Props interface
interface GameDetailsProps {
  selectedGame: GameInfo | null // Use GameInfo type for selectedGame
  handlePlayProcess: (processPath: string) => void
  handleOpenModal: (process: GameInfo) => void // Handle the GameInfo type here
  handleRemoveProcess: (processName: string) => void
  getLastPlayedTime: (lastPlayedDate: string) => string
}

const GameDetails: React.FC<GameDetailsProps> = ({
  selectedGame,
  handlePlayProcess,
  handleOpenModal,
  handleRemoveProcess,
  getLastPlayedTime,
}) => {
  // Return early if no game is selected
  if (!selectedGame) {
    return <span>Select a game to view details</span>
  }

  return (
    <div className="rounded-xl flex items-center">
      <img
        src={
          selectedGame.coverUrl ||
          'https://i.pinimg.com/736x/34/8d/53/348d53c456c2826821d17f421996031b.jpg'
        }
        alt={selectedGame.customName || selectedGame.name}
        className="w-[263px] h-[350px] object-cover rounded-xl"
      />
      <div className="p-10">
        <span className="text-4xl uppercase font-black">
          {selectedGame.customName || selectedGame.name}
        </span>
        <div className="w-fit pt-8 pb-10 flex flex-wrap flex-row gap-x-8 gap-y-2">
          <p>
            <span className="text-base text-textGray">Time played:</span>{' '}
            {Math.floor(selectedGame.time / 3600)}h{' '}
            {Math.floor((selectedGame.time % 3600) / 60)}m{' '}
            {selectedGame.time % 60}s
          </p>
          <p>
            <span className="text-base text-textGray">Last played:</span>{' '}
            {selectedGame.lastPlayedDate
              ? getLastPlayedTime(selectedGame.lastPlayedDate)
              : '-'}
          </p>
          <p>
            <span className="text-base text-textGray">Added on: </span>
            {new Date(selectedGame.addedDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedGame.fileExists ? (
            selectedGame.running ? (
              <button className="flex items-center gap-1 bg-foreground px-8 py-1 border-2 border-foreground text-textGray rounded-md cursor-default">
                Running
              </button>
            ) : (
              <button
                onClick={() => handlePlayProcess(selectedGame.path)}
                className="flex items-center gap-1 text-secondary font-semibold bg-white px-8 py-1 border-2 border-white rounded-md"
              >
                <PlayIcon className="size-4" /> Play
              </button>
            )
          ) : (
            <div className="px-8 py-1 bg-foreground border-2 border-foreground text-textGray font-medium rounded-md cursor-not-allowed">
              Uninstalled
            </div>
          )}

          <button
            className="px-2 py-2 bg-foreground rounded-md border-2 border-foreground"
            onClick={() => handleOpenModal(selectedGame)}
          >
            <PencilIcon className="size-4 text-textGray" />
          </button>
          <button
            className="px-2 py-2 bg-foreground rounded-md border-2 border-foreground"
            onClick={() => handleRemoveProcess(selectedGame.name)}
          >
            <TrashIcon className="size-4 text-textGray" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameDetails
