const API_URL = import.meta.env.VITE_EVOLUTION_API_URL
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY
const INSTANCE_NAME = import.meta.env.VITE_INSTANCE_NAME || 'sol_logistica'

interface SendMessageParams {
    number: string
    text: string
    isGroup?: boolean
}

/**
 * WhatsApp service using Evolution API
 * Requires environment variables:
 * - VITE_EVOLUTION_API_URL
 * - VITE_EVOLUTION_API_KEY
 * - VITE_INSTANCE_NAME (optional, defaults to 'sol_logistica')
 */
export const whatsappService = {
    /**
     * Check if WhatsApp API is configured
     */
    isConfigured(): boolean {
        return !!(API_URL && API_KEY)
    },

    /**
     * Send text message to individual or group
     * @param number - Phone number or group ID
     * @param text - Message text
     * @param isGroup - Whether this is a group message (adds @g.us suffix)
     */
    async sendMessage({ number, text, isGroup = false }: SendMessageParams) {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp API not configured. Set VITE_EVOLUTION_API_URL and VITE_EVOLUTION_API_KEY')
        }

        try {
            // Format number for groups (add @g.us suffix if needed)
            let formattedNumber = number.replace(/\D/g, '') // Remove non-digits

            if (isGroup && !number.includes('@g.us')) {
                formattedNumber = `${formattedNumber}@g.us`
            } else if (!isGroup && !number.includes('@c.us')) {
                formattedNumber = `${formattedNumber}@c.us`
            } else {
                formattedNumber = number
            }

            const response = await fetch(`${API_URL}/message/sendText/${INSTANCE_NAME}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY
                },
                body: JSON.stringify({
                    number: formattedNumber,
                    text
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`WhatsApp API error: ${response.status} ${response.statusText} - ${errorText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error sending WhatsApp message:', error)
            throw error
        }
    },

    /**
     * Check Evolution API connection status
     */
    async checkConnection() {
        if (!this.isConfigured()) {
            return { state: 'not_configured', error: 'API not configured' }
        }

        try {
            const response = await fetch(`${API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
                method: 'GET',
                headers: {
                    'apikey': API_KEY
                }
            })

            if (!response.ok) {
                return { state: 'error', status: response.status }
            }

            return await response.json()
        } catch (error) {
            console.error('Error checking connection:', error)
            return { state: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }
}
