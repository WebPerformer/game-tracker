import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { load, Store } from '@tauri-apps/plugin-store'
import GameEditModal from './GameEditModal'
import ConfirmationModal from './ConfirmationModal'
import { PlayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid'

interface ProcessInfo {
  name: string
  path: string
}

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

interface GameDetailsProps {
  selectedGame: GameInfo | null
  setSelectedGame: (game: GameInfo | null) => void
  trackedProcesses: GameInfo[]
  setTrackedProcesses: React.Dispatch<React.SetStateAction<GameInfo[]>>
}

const GameDetails: React.FC<GameDetailsProps> = ({
  selectedGame,
  setSelectedGame,
  trackedProcesses,
  setTrackedProcesses,
}) => {
  const storeRef = useRef<Store | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [gameToDelete, setGameToDelete] = useState<GameInfo | null>(null)
  const [currentProcess, setCurrentProcess] = useState<ProcessInfo | null>(null)

  useEffect(() => {
    const initializeStore = async () => {
      const store = await load('D:\\storageGames\\store.json', {
        autoSave: true,
      })
      storeRef.current = store // Set the store reference here
    }

    initializeStore()
  }, [])

  const updateProcessTime = async (
    name: string,
    newTime: number,
    isRunning: boolean,
  ) => {
    setTrackedProcesses((prevProcesses) =>
      prevProcesses.map((process) =>
        process.name === name
          ? {
              ...process,
              time: newTime,
              running: isRunning,
              lastPlayedDate: !isRunning
                ? new Date().toISOString()
                : process.lastPlayedDate,
            }
          : process,
      ),
    )

    const updatedProcesses = trackedProcesses.map((process) =>
      process.name === name
        ? {
            ...process,
            time: newTime,
            running: isRunning,
            lastPlayedDate: !isRunning
              ? new Date().toISOString()
              : process.lastPlayedDate,
          }
        : process,
    )

    setTrackedProcesses(updatedProcesses)

    if (storeRef.current) {
      await storeRef.current.set('processes', updatedProcesses)
      await storeRef.current.save()
    } else {
      console.error('Store não inicializado.')
    }

    if (selectedGame && selectedGame.name === name) {
      setSelectedGame({
        ...selectedGame,
        running: isRunning,
        time: newTime,
        lastPlayedDate: !isRunning
          ? new Date().toISOString()
          : selectedGame.lastPlayedDate,
      })
    }
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const activeProcesses: { name: string; running: boolean }[] =
          await invoke('list_app_processes')

        trackedProcesses.forEach((process) => {
          const isRunning = activeProcesses.some(
            (active) => active.name === process.name,
          )

          if (isRunning) {
            const updatedTime = process.time + 1
            updateProcessTime(process.name, updatedTime, true)
          } else if (process.running) {
            updateProcessTime(process.name, process.time, false)
          }
        })
      } catch (error) {
        console.error('Error fetching active processes:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [trackedProcesses])

  const handlePlayProcess = async (processPath: string) => {
    try {
      const result = await invoke('execute_process', { processPath })
      console.log('Processo iniciado com sucesso:', result)
    } catch (error) {
      console.error('Erro ao tentar executar o processo:', error)
    }
  }

  const getLastPlayedTime = (lastPlayedDate: Date | string) => {
    const now = new Date()

    const lastPlayed = new Date(lastPlayedDate)

    const diffInSeconds = Math.floor(
      (now.getTime() - lastPlayed.getTime()) / 1000,
    )

    const days = Math.floor(diffInSeconds / (3600 * 24))
    const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((diffInSeconds % 3600) / 60)

    if (days > 0) {
      return `${days} days(s) ago`
    } else if (hours > 0) {
      return `${hours} hours(s) ago`
    } else if (minutes > 0) {
      return `${minutes} minute(s) ago`
    } else {
      return 'recently'
    }
  }

  const handleOpenModal = (process: ProcessInfo) => {
    setCurrentProcess(process)
    setShowModal(true)
  }

  const handleSaveChanges = async (customName: string, coverUrl: string) => {
    if (!storeRef.current || !selectedGame) return

    const updatedGame: GameInfo = {
      ...selectedGame,
      customName,
      coverUrl,
    }

    // Update the game info in the tracked processes
    const updatedProcesses = trackedProcesses.map((game) =>
      game.id === updatedGame.id ? updatedGame : game,
    )
    setTrackedProcesses(updatedProcesses)

    // Save the updated processes to the store
    await storeRef.current.set('processes', updatedProcesses)
    await storeRef.current.save()

    // Update the selected game
    setSelectedGame(updatedGame)

    // Close the modal after saving
    setShowModal(false)
  }

  const removeGame = async () => {
    if (!gameToDelete || !storeRef.current) return

    const updatedProcesses = trackedProcesses.filter(
      (p) => p.name !== gameToDelete.name,
    )
    setTrackedProcesses(updatedProcesses)

    await storeRef.current.set('processes', updatedProcesses)
    await storeRef.current.save()

    setGameToDelete(null)
    setSelectedGame(null)
  }

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
            onClick={() => setGameToDelete(selectedGame)}
          >
            <TrashIcon className="size-4 text-textGray" />
          </button>
        </div>
      </div>

      {showModal && currentProcess && selectedGame && (
        <GameEditModal
          currentProcess={currentProcess}
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          storeRef={storeRef}
          onSave={handleSaveChanges}
          onClose={() => setShowModal(false)}
        />
      )}

      {gameToDelete && (
        <ConfirmationModal
          title="Confirm Deletion"
          message={`Are you sure you want to remove ${gameToDelete.customName || gameToDelete.name}?`}
          onConfirm={removeGame}
          onCancel={() => setGameToDelete(null)}
        />
      )}
    </div>
  )
}

export default GameDetails
