import toast from 'react-hot-toast'

// Simple toast wrapper
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  info: (message: string) => toast(message, { icon: 'ℹ️' }),
  dismiss: (id: string) => toast.dismiss(id)
}
