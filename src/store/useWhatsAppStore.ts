import { create } from 'zustand'

interface WhatsAppState {
    isConnected: boolean
    instanceName: string
    qrCode: string | null
    status: 'connecting' | 'connected' | 'disconnected'
    setConnected: (status: boolean) => void
    setQrCode: (qr: string | null) => void
    setStatus: (status: 'connecting' | 'connected' | 'disconnected') => void
}

export const useWhatsAppStore = create<WhatsAppState>((set) => ({
    isConnected: false,
    instanceName: 'sol-tms',
    qrCode: null,
    status: 'disconnected',
    setConnected: (isConnected) => set({ isConnected }),
    setQrCode: (qrCode) => set({ qrCode }),
    setStatus: (status) => set({ status }),
}))
