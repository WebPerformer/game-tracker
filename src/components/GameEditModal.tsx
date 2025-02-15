import React, { useState } from 'react'
import { Store } from '@tauri-apps/plugin-store'

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

interface GameEditModalProps {
  currentProcess: ProcessInfo
  gameId: number
  gameName: string
  storeRef: React.RefObject<Store | null>
  onSave: (customName: string, coverUrl: string) => void
  onClose: () => void
}

const GameEditModal: React.FC<GameEditModalProps> = ({
  currentProcess,
  storeRef,
  onSave,
  onClose,
}) => {
  const [customName, setCustomName] = useState(currentProcess.customName || '')
  const [coverUrl, setCoverUrl] = useState(currentProcess.coverUrl || '')

  const handleSave = async () => {
    if (!storeRef.current) return

    // Construct updated game object
    const updatedGame = {
      ...currentProcess, // Keep original properties
      customName, // Update custom name
      coverUrl, // Update cover URL
    }

    // Save to store
    const storedProcesses: ProcessInfo[] =
      (await storeRef.current.get('processes')) || []

    const updatedProcesses = storedProcesses.map((game) =>
      game.name === currentProcess.name ? updatedGame : game,
    )

    await storeRef.current.set('processes', updatedProcesses)
    await storeRef.current.save()

    // Ensure UI updates immediately
    onSave(customName, coverUrl)

    // Close modal
    onClose()
  }

  return (
    <>
      <div
        onClick={onClose}
        className="w-full h-screen fixed top-0 left-0 z-40 bg-black opacity-50"
      />
      <div className="fixed top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 bg-background p-[20px] rounded-[8px] [box-shadow:0_4px_10px_rgba(0,_0,_0,_0.1)] w-[400px] text-center z-50">
        <h2 className="text-[18px] font-medium">Edit Game</h2>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Nome Personalizado"
          className="py-2 px-3 bg-transparent border-2 border-secondary rounded-md"
        />
        <input
          type="text"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="URL da Capa"
          className="py-2 px-3 bg-transparent border-2 border-secondary rounded-md"
        />
        <button
          className="px-1 py-3 bg-secondary rounded-md hover:bg-foreground"
          onClick={handleSave}
        >
          Salvar
        </button>
      </div>
    </>
  )
}

export default GameEditModal
