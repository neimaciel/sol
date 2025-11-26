import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112233',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233'
    },
    subtitle: {
        fontSize: 12,
        color: '#666666'
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        padding: 5
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5
    },
    label: {
        width: 100,
        fontSize: 10,
        fontWeight: 'bold'
    },
    value: {
        flex: 1,
        fontSize: 10
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#999999'
    },
    signatures: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    signatureBox: {
        borderTopWidth: 1,
        width: '40%',
        textAlign: 'center',
        paddingTop: 5,
        fontSize: 10
    }
})

interface ContractData {
    contractId: string
    date: string
    driverName: string
    driverDoc: string
    vehiclePlate: string
    origin: string
    destination: string
    value: string
}

interface ContractTemplateProps {
    data: ContractData
}

export function ContractTemplate({ data }: ContractTemplateProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>CONTRATO DE FRETE</Text>
                        <Text style={styles.subtitle}>Nº {data.contractId}</Text>
                    </View>
                    <View>
                        <Text style={styles.subtitle}>{data.date}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. PARTES</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>CONTRATANTE:</Text>
                        <Text style={styles.value}>SOL - Super Operador Logístico LTDA</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>CONTRATADO:</Text>
                        <Text style={styles.value}>{data.driverName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>CPF/CNPJ:</Text>
                        <Text style={styles.value}>{data.driverDoc}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. OBJETO</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>VEÍCULO:</Text>
                        <Text style={styles.value}>{data.vehiclePlate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>ORIGEM:</Text>
                        <Text style={styles.value}>{data.origin}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>DESTINO:</Text>
                        <Text style={styles.value}>{data.destination}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. VALORES</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>VALOR TOTAL:</Text>
                        <Text style={styles.value}>{data.value}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>FORMA PAGTO:</Text>
                        <Text style={styles.value}>50% Adiantamento / 50% Entrega</Text>
                    </View>
                </View>

                <View style={styles.signatures}>
                    <View style={styles.signatureBox}>
                        <Text>SOL Logística</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>{data.driverName}</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Este documento foi gerado eletronicamente pelo sistema SOL TMS em {new Date().toLocaleString()}
                </Text>
            </Page>
        </Document>
    )
}
