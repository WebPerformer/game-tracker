import { FC } from 'react'
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  setShowIgdbModal: React.Dispatch<React.SetStateAction<boolean>>
}

const Header: FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  setShowIgdbModal,
}) => {
  return (
    <div>
      <h1 className="text-xl font-medium mt-2 mb-6">
        My Library{' '}
        <span className="text-xs text-textGray">Beta Version 2.4</span>
      </h1>
      <div className="flex justify-between my-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search Games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[243px] bg-secondary border-2 border-secondary px-3 py-1 rounded-md pl-9 pr-9 placeholder:text-textGray"
            />
            <MagnifyingGlassIcon className="absolute top-[10px] left-3 size-4 text-textGray" />
            {searchQuery && (
              <XCircleIcon
                className="absolute top-[10px] right-3 size-4 text-textGray cursor-pointer hover:text-white transition"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>
          <button className="px-1 py-1 bg-secondary border-2 border-secondary rounded-md hover:bg-foreground hover:border-foreground">
            <AdjustmentsHorizontalIcon className="size-6 text-textGray" />
          </button>
        </div>
        <button
          onClick={() => setShowIgdbModal(true)}
          className="text-secondary bg-white font-semibold px-3 py-1 border-2 border-secondary rounded-md"
        >
          Add Game
        </button>
      </div>
    </div>
  )
}

export default Header
