import { saveState, loadState } from '../src/lib/store.js'

beforeEach(() => {
  localStorage.clear()
})

test('status roundtrip', () => {
  saveState({ S1: 'rujuk' }, {}, 'seed.xlsx')
  expect(loadState().status.S1).toBe('rujuk')
})

test('sosio roundtrip + default kosong', () => {
  expect(loadState()).toEqual({ status: {}, sosio: {}, active: null })
  saveState({ S1: 'observasi' }, { S1: ['S2', 'S3', 'S4'] })
  const st = loadState()
  expect(st.sosio.S1).toEqual(['S2', 'S3', 'S4'])
  expect(st.status.S1).toBe('observasi')
})
