import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { OPERATOR_CONTACT } from '@/lib/operator'

interface Props { productTitle?: string; downloadUrl?: string; isFree?: boolean }

const PurchaseDownload = ({ productTitle, downloadUrl = 'https://vlnd.pl/dashboard', isFree = false }: Props) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Twój plik jest gotowy do pobrania</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>vlnd</Text>
        <Heading style={h1}>{isFree ? 'Twój plik jest gotowy!' : 'Dziękujemy za zakup!'}</Heading>
        <Text style={text}>{isFree ? <>Materiał <b>{productTitle || 'Twój plik'}</b> jest gotowy. Kliknij przycisk, żeby od razu pobrać plik — bez logowania i bez zakładania hasła.</> : <>Płatność za <b>{productTitle || 'Twój materiał'}</b> została potwierdzona. Kliknij przycisk, żeby od razu pobrać plik — bez logowania i bez zakładania hasła.</>}</Text>
        <Button style={button} href={downloadUrl}>Pobierz plik</Button>
        <Text style={small}>Link jest przypisany do Twojego zakupu — zachowaj tę wiadomość, możesz z niej pobrać plik ponownie. Nie przekazuj go innym osobom.</Text>
        <Text style={small}>Pytania? Napisz na {OPERATOR_CONTACT}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PurchaseDownload,
  subject: (d: Record<string, any>) => `Twój plik: ${d.productTitle || 'zakup w vlnd'}`,
  displayName: 'Pobieranie zakupionego pliku',
  previewData: { productTitle: 'ARSENAŁ RIPOSTY', downloadUrl: 'https://vlnd.pl/api/public/download?t=demo' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '520px' }
const brand = { fontSize: '20px', fontWeight: 700, color: '#6d4aa8', margin: '0 0 16px' }
const h1 = { fontSize: '22px', color: '#2a2233', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#3d3546' }
const small = { fontSize: '13px', lineHeight: '20px', color: '#7a7184' }
const button = { backgroundColor: '#6d4aa8', color: '#ffffff', padding: '14px 26px', borderRadius: '10px', fontWeight: 700, fontSize: '16px', textDecoration: 'none', margin: '12px 0 20px' }
