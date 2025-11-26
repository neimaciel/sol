import { PDFDownloadLink } from '@react-pdf/renderer'
import { ContractTemplate } from './ContractTemplate'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'

interface ContractGeneratorProps {
    data: {
        contractId: string
        date: string
        driverName: string
        driverDoc: string
        vehiclePlate: string
        origin: string
        destination: string
        value: string
    }
}

export function ContractGenerator({ data }: ContractGeneratorProps) {
    return (
        <PDFDownloadLink
            document={<ContractTemplate data={data} />}
            fileName={`contrato_${data.contractId}.pdf`}
        >
            {({ loading }) => (
                <Button disabled={loading} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando PDF...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Baixar Contrato PDF
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
