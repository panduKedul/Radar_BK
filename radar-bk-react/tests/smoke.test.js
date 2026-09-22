import { routes } from '../src/App.jsx'

test('8 route terdaftar', () => {
  expect(routes.length).toBeGreaterThanOrEqual(8)
})
