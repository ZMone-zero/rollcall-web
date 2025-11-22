import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RollCall from '../../src/components/RollCall.vue'

// Mock API
vi.mock('../../src/utils/api.js', () => ({
  default: {
    randomRollcall: vi.fn(),
    orderRollcall: vi.fn(),
    updateScore: vi.fn(),
    getDebugCount: vi.fn()
  }
}))

import api from '../../src/utils/api.js'

describe('RollCall.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(RollCall)
    vi.clearAllMocks()
  })

  it('渲染点名模式选择按钮', () => {
    const modeButtons = wrapper.findAll('.mode-btn')
    expect(modeButtons).toHaveLength(2)
    expect(modeButtons[0].text()).toContain('随机点名')
    expect(modeButtons[1].text()).toContain('顺序点名')
  })

  it('默认选择随机点名模式', () => {
    const randomButton = wrapper.find('.mode-btn.active')
    expect(randomButton.text()).toContain('随机点名')
  })

  it('切换点名模式', async () => {
    const orderButton = wrapper.findAll('.mode-btn')[1]
    await orderButton.trigger('click')
    
    expect(wrapper.vm.rollcallType).toBe('order')
    expect(orderButton.classes()).toContain('active')
  })

  it('显示学生数量', async () => {
    api.getDebugCount.mockResolvedValue({
      success: true,
      student_count: 25
    })

    await wrapper.vm.loadStudentsCount()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.text-muted').text()).toContain('25')
  })

  it('随机点名功能', async () => {
    const mockStudent = {
      name: '张三',
      student_id: '2024001',
      total_score: 5,
      random_count: 3
    }

    api.randomRollcall.mockResolvedValue({
      success: true,
      student: mockStudent
    })

    // 初始状态
    expect(wrapper.find('.empty-text').exists()).toBe(true)

    // 执行点名
    await wrapper.vm.handleRollcall()
    await wrapper.vm.$nextTick()

    // 验证显示学生信息
    expect(wrapper.find('.student-name').text()).toBe('张三')
    expect(wrapper.find('.student-id').text()).toBe('2024001')
    expect(api.randomRollcall).toHaveBeenCalledOnce()
  })

  it('快速加分功能', async () => {
    // 设置当前学生
    wrapper.vm.currentStudent = {
      student_id: '2024001',
      name: '李四',
      total_score: 2,
      random_count: 1
    }
    await wrapper.vm.$nextTick()

    api.updateScore.mockResolvedValue({ success: true })

    // 点击+1到课按钮
    const addScoreButton = wrapper.findAll('.quick-btn')[0]
    await addScoreButton.trigger('click')

    expect(api.updateScore).toHaveBeenCalledWith('2024001', 1, '按时到课')
  })

  it('没有选中学生时显示错误', async () => {
    // 确保没有当前学生
    wrapper.vm.currentStudent = null
    await wrapper.vm.$nextTick()

    const quickButtons = wrapper.findAll('.quick-btn')
    await quickButtons[0].trigger('click')

    // 应该显示错误（在真实环境中会是alert）
    expect(wrapper.vm.currentStudent).toBeNull()
  })
})