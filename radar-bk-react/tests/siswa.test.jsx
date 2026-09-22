import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Siswa from '../src/pages/Siswa.jsx'

test('profil seed id slash-spasi render', () => {
  const to = '/siswa/' + encodeURIComponent('0145358555 / 2122005001020')
  render(
    <MemoryRouter initialEntries={[to]}>
      <Routes><Route path="/siswa/:id" element={<Siswa />} /></Routes>
    </MemoryRouter>
  )
  expect(screen.queryByText(/tidak ditemukan/i)).toBeNull()
})
