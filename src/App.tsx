import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { load, Store } from '@tauri-apps/plugin-store'
import '@fontsource-variable/inter'
import './App.css'

interface ProcessInfo {
  name: string
  path: string // Caminho completo do executável
  time: number // Tempo total acumulado (em segundos)
  running: boolean // Indica se o processo está rodando
  customName?: string // Nome personalizado
  coverUrl?: string // URL da capa
  addedDate: string // Data de adição
}

function App() {
  const [trackedProcesses, setTrackedProcesses] = useState<ProcessInfo[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('') // Estado para o filtro de ano
  const [showModal, setShowModal] = useState<boolean>(false)
  const [currentProcess, setCurrentProcess] = useState<ProcessInfo | null>(null)
  const [visibleProcesses, setVisibleProcesses] = useState<number>(15)

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setVisibleProcesses((prev) => prev + 15) // Carrega mais 15 itens
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeRef = useRef<Store | null>(null) // Referência para o Store

  useEffect(() => {
    const initializeStore = async () => {
      storeRef.current = await load('D:\\storageGames\\store.json', {
        autoSave: true,
      })

      // Carregue os processos armazenados
      const storedProcesses = (await storeRef.current.get('processes')) || []
      // Garante que o tipo de storedProcesses é ProcessInfo[]
      if (Array.isArray(storedProcesses)) {
        setTrackedProcesses(storedProcesses)
      } else {
        setTrackedProcesses([]) // Caso o valor não seja um array, substitua por um array vazio
      }
    }

    initializeStore()
  }, [])

  // Obter os anos únicos dos processos
  const availableYears = Array.from(
    new Set(trackedProcesses.map((p) => new Date(p.addedDate).getFullYear())),
  )

  // Filtrar com base na busca e no ano selecionado
  const filteredProcesses = trackedProcesses.filter((process) => {
    const matchesSearch =
      process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (process.customName?.toLowerCase() || '').includes(
        searchQuery.toLowerCase(),
      )
    const matchesYear =
      !selectedYear ||
      new Date(process.addedDate).getFullYear().toString() === selectedYear
    return matchesSearch && matchesYear
  })

  const processesToShow = filteredProcesses.slice(0, visibleProcesses)

  const handleAddProcess = async () => {
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: 'Executables', extensions: ['exe'] }],
      })

      if (file && typeof file === 'string') {
        const processPath = file // Aqui já temos o caminho completo
        const processName = file.split('\\').pop() || file
        const alreadyTracked = trackedProcesses.some(
          (p) => p.name === processName,
        )

        if (!alreadyTracked) {
          const newProcess = {
            name: processName,
            path: processPath, // Salve o caminho completo
            time: 0,
            running: false,
            addedDate: new Date().toISOString(),
          }
          setTrackedProcesses((prev) => [...prev, newProcess])
          localStorage.setItem(processName, JSON.stringify(newProcess))
          setCurrentProcess(newProcess)
          setShowModal(true)
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error)
    }
  }

  const handleRemoveProcess = async (processName: string) => {
    const updatedProcesses = trackedProcesses.filter(
      (p) => p.name !== processName,
    )
    setTrackedProcesses(updatedProcesses)

    if (storeRef.current) {
      // Atualiza o Store
      await storeRef.current.set('processes', updatedProcesses)
      await storeRef.current.save() // Salva manualmente se necessário
    } else {
      console.error('Store não inicializado.')
    }
  }

  const updateProcessTime = async (name: string, newTime: number) => {
    const updatedProcesses = trackedProcesses.map((p) =>
      p.name === name ? { ...p, time: newTime } : p,
    )

    setTrackedProcesses(updatedProcesses)

    if (storeRef.current) {
      // Atualiza no Store
      await storeRef.current.set('processes', updatedProcesses)
      await storeRef.current.save()
    } else {
      console.error('Store não inicializado.')
    }
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const activeProcesses: { name: string; running: boolean }[] =
          await invoke('list_app_processes')

        setTrackedProcesses((prev) =>
          prev.map((process) => {
            const isRunning = activeProcesses.some(
              (activeProcess) => activeProcess.name === process.name,
            )

            if (isRunning) {
              const updatedTime = process.time + 1
              updateProcessTime(process.name, updatedTime)
              return { ...process, time: updatedTime, running: true }
            } else {
              return { ...process, running: false }
            }
          }),
        )
      } catch (error) {
        console.error('Error fetching active processes:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [trackedProcesses])

  const handleOpenModal = (process: ProcessInfo) => {
    setCurrentProcess(process)
    setShowModal(true)
  }

  const handleSaveChanges = async (customName: string, coverUrl: string) => {
    if (!storeRef.current) {
      console.error('Store não inicializado.')
      return
    }

    if (currentProcess) {
      const updatedProcesses = trackedProcesses.map((p) =>
        p.name === currentProcess.name ? { ...p, customName, coverUrl } : p,
      )

      setTrackedProcesses(updatedProcesses)

      // Atualiza e salva no Store
      await storeRef.current.set('processes', updatedProcesses)
      await storeRef.current.save()

      setShowModal(false)
    }
  }

  const handlePlayProcess = async (processPath: string) => {
    try {
      const result = await invoke('execute_process', { processPath })
      console.log('Processo iniciado com sucesso:', result)
      alert(result)
    } catch (error) {
      console.error('Erro ao tentar executar o processo:', error)
    }
  }

  return (
    <main className="app">
      <div className="header">
        <h1 className="header-title">Minha Biblioteca</h1>
        <button onClick={handleAddProcess} className="add-button">
          Adicionar
        </button>
      </div>
      <div className="container">
        <input
          type="text"
          placeholder="Pesquisar jogos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar"
        />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="year-filter"
        >
          <option value="">Todos os anos</option>
          {availableYears.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="grid container">
        {processesToShow.map((process) => (
          <div key={process.name} className="card">
            <img
              src={process.coverUrl || 'https://via.placeholder.com/300'}
              alt={process.customName || process.name}
              className="card-image"
            />
            <div className="card-info">
              <h3>{process.customName || process.name}</h3>
              <p className="timer-track">
                Tempo: {Math.floor(process.time / 3600)}h{' '}
                {Math.floor((process.time % 3600) / 60)}m {process.time % 60}s
              </p>
              <p className="added-date">
                Adicionado em:{' '}
                {new Date(process.addedDate).toLocaleDateString()}
              </p>
              <div className="card-buttons">
                <button onClick={() => handlePlayProcess(process.path)}>
                  Play
                </button>
                <button onClick={() => handleOpenModal(process)}>Editar</button>
                <button onClick={() => handleRemoveProcess(process.name)}>
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && currentProcess && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="modal">
            <h2>Editar Jogo</h2>
            <input
              type="text"
              defaultValue={currentProcess.customName}
              placeholder="Nome Personalizado"
              onChange={(e) => (currentProcess.customName = e.target.value)}
            />
            <input
              type="text"
              defaultValue={currentProcess.coverUrl}
              placeholder="URL da Capa"
              onChange={(e) => (currentProcess.coverUrl = e.target.value)}
            />
            <button
              onClick={() =>
                storeRef.current
                  ? handleSaveChanges(
                      currentProcess.customName!,
                      currentProcess.coverUrl!,
                    )
                  : console.error('Store ainda não está disponível.')
              }
            >
              Salvar
            </button>
          </div>
        </>
      )}
    </main>
  )
}

export default App
