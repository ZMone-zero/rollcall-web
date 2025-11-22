import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Ranking from '../../src/components/Ranking.vue'

vi.mock('../../src/utils/api.js', () => ({
  default: {
    getScoreRanking: vi.fn()
  }
}))

import api from '../../src/utils/api.js'

describe('Ranking.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Ranking)
    vi.clearAllMocks()
  })

  it('渲染排名控制元素', () => {
    expect(wrapper.find('.control-label').text()).toContain('显示人数')
    expect(wrapper.find('.btn-secondary').text()).toContain('隐藏图表')
  })

  it('加载并显示排名数据', async () => {
    const mockRanking = [
      {
        student_id: '2024001',
        name: '冠军',
        total_score: 20,
        random_count: 10
      },
      {
        student_id: '2024002',
        name: '亚军', 
        total_score: 18,
        random_count: 9
      }
    ]

    api.getScoreRanking.mockResolvedValue({
      students: mockRanking
    })

    await wrapper.vm.loadRanking()
    await wrapper.vm.$nextTick()

    const rankingItems = wrapper.findAll('.ranking-item')
    expect(rankingItems).toHaveLength(2)
    
    // 验证排名显示
    expect(rankingItems[0].find('.rank-number').text()).toBe('1')
    expect(rankingItems[0].find('.student-name').text()).toBe('冠军')
    expect(rankingItems[0].find('.total-score').text()).toContain('20')
  })

  it('显示前三名奖牌', async () => {
    const mockRanking = [
      { student_id: '1', name: '第一名', total_score: 20, random_count: 10 },
      { student_id: '2', name: '第二名', total_score: 18, random_count: 9 },
      { student_id: '3', name: '第三名', total_score: 15, random_count: 8 }
    ]

    api.getScoreRanking.mockResolvedValue({ students: mockRanking })
    await wrapper.vm.loadRanking()
    await wrapper.vm.$nextTick()

    const rankingItems = wrapper.findAll('.ranking-item')
    
    expect(rankingItems[0].find('.rank-medal').text()).toBe('🥇')
    expect(rankingItems[1].find('.rank-medal').text()).toBe('🥈')
    expect(rankingItems[2].find('.rank-medal').text()).toBe('🥉')
  })

  it('切换图表显示', async () => {
    // 初始应该显示图表
    expect(wrapper.vm.showChart).toBe(true)
    expect(wrapper.find('.bar-chart').exists()).toBe(true)

    // 点击隐藏图表
    const toggleButton = wrapper.find('.btn-secondary')
    await toggleButton.trigger('click')

    expect(wrapper.vm.showChart).toBe(false)
    expect(wrapper.find('.bar-chart').exists()).toBe(false)
    expect(toggleButton.text()).toContain('显示图表')
  })

  it('更改显示人数', async () => {
    const select = wrapper.find('select')
    await select.setValue('5')

    expect(wrapper.vm.limit).toBe(5)
    expect(api.getScoreRanking).toHaveBeenCalledWith(5)
  })
})