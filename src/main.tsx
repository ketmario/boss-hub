import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { PhoneHost } from '@/phone/PhoneHost'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PhoneHost>
            <App />
        </PhoneHost>
    </StrictMode>,
)
