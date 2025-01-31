import React, { useState, useEffect } from 'react'
import { Store } from '@tauri-apps/plugin-store'

interface ProcessInfo {
  name: string
  path: string
  customName?: string
  coverUrl?: string
  addedDate: string
}

interface GameEditModalProps {
  gameId: number
  gameName: string
  storeRef: React.MutableRefObject<Store | null>
  onSave: (customName: string, coverUrl: string) => Promise<void>
  onClose: () => void
}

const GameEditModal: React.FC<GameEditModalProps> = ({
  gameId,
  gameName,
  storeRef,
  onSave,
  onClose,
}) => {
  const [customName, setCustomName] = useState(gameName)
  const [coverUrl, setCoverUrl] = useState<string>('')

  // Effect to reset the customName if the gameName changes
  useEffect(() => {
    setCustomName(gameName)
  }, [gameName])

  const handleSave = () => {
    if (storeRef.current) {
      onSave(customName, coverUrl)
    } else {
      console.error('Store is not available.')
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className="w-full h-screen fixed top-0 left-0 z-40 bg-black opacity-50"
      />
      <div className="fixed top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 bg-[#1a1c2c] p-[20px] rounded-[8px] [box-shadow:0_4px_10px_rgba(0,_0,_0,_0.1)] w-[400px] text-center z-50">
        <h2 className="text-[18px] font-medium">Editar Jogo</h2>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Nome Personalizado"
          className="w-[287px] bg-secondary border-2 border-secondary px-3 py-1 rounded-md pl-9 pr-9 placeholder:text-textGray"
        />
        <input
          type="text"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="URL da Capa"
          className="py-2 px-3 bg-transparent border-2 border-secondary rounded-md"
        />
        <button onClick={handleSave}>Salvar</button>
      </div>
    </>
  )
}

export default GameEditModal
