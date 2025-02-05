interface ConfirmationModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <>
      <div
        onClick={onCancel}
        className="w-full h-screen fixed top-0 left-0 z-40 bg-black opacity-50"
      />
      <div className="fixed top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 max-w-[400px] flex flex-col gap-4 bg-background p-[20px] rounded-[8px] [box-shadow:0_4px_10px_rgba(0,_0,_0,_0.1)] text-center z-50">
        <div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="mb-6">{message}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onCancel}
              className="text-secondary bg-white font-semibold px-3 py-1 border-2 border-white rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-600 font-semibold px-3 py-1 border-2 border-red-600 rounded-md"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmationModal
