const API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080'
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'global-api-key'

interface SendMessageParams {
    number: string
    text: string
}

export const whatsappService = {
    async sendMessage({ number, text }: SendMessageParams) {
        try {
            const response = await fetch(`${API_URL}/message/sendText/sol-tms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY
                },
                body: JSON.stringify({
                    number,
                    options: {
                        delay: 1200,
                        presence: 'composing',
                        linkPreview: false
                    },
                    textMessage: {
                        text
                    }
                })
            })
            return await response.json()
        } catch (error) {
            console.error('Error sending WhatsApp message:', error)
            throw error
        }
    },

    async checkConnection() {
        try {
            const response = await fetch(`${API_URL}/instance/connectionState/sol-tms`, {
                method: 'GET',
                headers: {
                    'apikey': API_KEY
                }
            })
            return await response.json()
        } catch (error) {
            console.error('Error checking connection:', error)
            return { state: 'disconnected' }
        }
    }
}
