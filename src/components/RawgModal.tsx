import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  ArrowTurnRightUpIcon,
} from '@heroicons/react/24/solid'

interface RawgModalProps {
  onClose: () => void
  onSelectGame: (name: string, id: number) => void
}

const RawgModal: React.FC<RawgModalProps> = ({ onClose, onSelectGame }) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${import.meta.env.VITE_RAWG_API_KEY}&search=${searchQuery}`,
      )
      const data = await response.json()
      setGames(data.results || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGameSelect = (name: string, id: number) => {
    onSelectGame(name, id)
    const igdbUrl = `https://www.igdb.com/search?utf8=%E2%9C%93&q=${encodeURIComponent(name)}`
    window.open(igdbUrl, '_blank')
    onClose()
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
                {games.map((game: any) => (
                  <li
                    key={game.id}
                    onClick={() => handleGameSelect(game.name, game.id)}
                    className="flex gap-4 items-center bg-secondary p-3 rounded-md cursor-pointer hover:bg-hoverBackground"
                  >
                    {game.background_image && (
                      <img
                        src={game.background_image}
                        alt={game.name}
                        className="w-32 h-20 object-cover rounded-md"
                      />
                    )}
                    <h3 className="text-lg text-start">{game.name}</h3>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum jogo encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default RawgModal
