import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'

test('sidebar tampil 7 nav + footer formal', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
  expect(screen.getAllByText(/RADAR BK/).length).toBeGreaterThanOrEqual(1)
  expect(screen.getByText(/Pandu/)).toBeTruthy()
  const nav = screen.getByLabelText(/Navigasi utama/)
  expect(nav.children.length).toBe(7)
})
