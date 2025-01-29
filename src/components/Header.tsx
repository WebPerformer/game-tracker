import { FC } from 'react'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedYear: string
  setSelectedYear: (year: string) => void
  availableYears: string[]
  handleAddProcess: () => void
}

const Header: FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedYear,
  setSelectedYear,
  availableYears,
  handleAddProcess,
}) => {
  return (
    <div>
      <h1 className="text-xl font-medium mt-2 mb-6">
        My Library <span className="text-xs text-textGray">Version 1.2</span>
      </h1>
      <div className="flex justify-between my-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search Games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary border-2 border-secondary px-3 py-1 rounded-md placeholder:text-textGray"
          />
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
          onClick={handleAddProcess}
          className="text-secondary bg-white font-semibold px-3 py-1 border-2 border-secondary rounded-md"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}

export default Header
