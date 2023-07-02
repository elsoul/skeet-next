export const fileToBlob: (file: File) => Promise<Blob> = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(new Blob([reader.result!]))
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
