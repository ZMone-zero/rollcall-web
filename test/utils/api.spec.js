import { describe, it, expect, vi } from 'vitest'
import api from '../../src/utils/api.js'

// Mock fetch
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('获取所有学生', async () => {
    const mockStudents = [{ name: '测试学生', student_id: '123' }]
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ students: mockStudents })
    })

    const result = await api.getAllStudents()
    
    expect(fetch).toHaveBeenCalledWith('https://recall-backend-tau.vercel.app/students')
    expect(result.students).toEqual(mockStudents)
  })

  it('随机点名', async () => {
    const mockResponse = { success: true, student: { name: '测试' } }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const result = await api.randomRollcall()
    
    expect(fetch).toHaveBeenCalledWith(
      'https://recall-backend-tau.vercel.app/rollcall/random',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result).toEqual(mockResponse)
  })

  it('处理API错误', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    await expect(api.getAllStudents()).rejects.toThrow('请求失败: 500')
  })
})