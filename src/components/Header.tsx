import { FC } from 'react'
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedYear: string
  setSelectedYear: (year: string) => void
  availableYears: string[]
  setShowIgdbModal: React.Dispatch<React.SetStateAction<boolean>>
}

const Header: FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedYear,
  setSelectedYear,
  availableYears,
  setShowIgdbModal,
}) => {
  return (
    <div>
      <h1 className="text-xl font-medium mt-2 mb-6">
        My Library{' '}
        <span className="text-xs text-textGray">Beta Version 2.1</span>
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
          <button className="px-1 py-1 bg-secondary border-2 border-secondary rounded-md">
            <AdjustmentsHorizontalIcon className="size-6 text-textGray" />
          </button>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="hidden"
        >
          <option value="">Todos os anos</option>
          {availableYears.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
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
