import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text, Button } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  kind?: 'signup' | 'product'
  username?: string
  email?: string
  productTitle?: string
}

const AdminAlert = ({ kind = 'signup', username, email, productTitle }: Props) => {
  const isProduct = kind === 'product'
  return (
    <Html lang="pl" dir="ltr">
      <Head />
      <Preview>{isProduct ? 'Nowy produkt czeka na akceptację' : 'Nowy użytkownik w vlnd'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>vlnd</Text>
          <Heading style={h1}>
            {isProduct ? 'Nowy produkt czeka na akceptację' : 'Zarejestrował się nowy użytkownik'}
          </Heading>
          {isProduct && <Text style={text}>Produkt: <b>{productTitle || '—'}</b></Text>}
          <Text style={text}>{isProduct ? 'Twórca' : 'Nazwa'}: <b>{username || '—'}</b></Text>
          {email && <Text style={text}>E-mail: {email}</Text>}
          <Button style={button} href="https://vlnd.pl/admin">Otwórz panel admina</Button>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminAlert,
  subject: (d: Record<string, any>) =>
    d.kind === 'product'
      ? `Nowy produkt do akceptacji: ${d.productTitle ?? ''}`
      : `Nowy użytkownik: ${d.username ?? ''}`,
  displayName: 'Powiadomienie admina',
  to: 'wojciechjudek04@gmail.com',
  previewData: { kind: 'product', username: 'jan', productTitle: 'Przewodnik' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px' }
const brand = { fontSize: '26px', fontWeight: 700, color: '#000000', margin: '0 0 12px' }
const h1 = { fontSize: '20px', color: '#000000', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#333333', margin: '0 0 8px' }
const button = { backgroundColor: '#C5A059', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '14px', marginTop: '16px' }
