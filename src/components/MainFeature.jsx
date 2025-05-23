import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, isToday, isTomorrow, isPast, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
         eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import ApperIcon from './ApperIcon'

function MainFeature() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    status: 'todo'
  })

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('taskflow-tasks')
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks))
  }, [tasks])

  const priorityColors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    urgent: 'text-red-600 bg-red-50 border-red-200'
  }

  const statusColumns = {
    todo: { title: 'To Do', color: 'border-surface-300', icon: 'Clock' },
    'in-progress': { title: 'In Progress', color: 'border-blue-300', icon: 'Play' },
    completed: { title: 'Completed', color: 'border-green-300', icon: 'CheckCircle' }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Task title is required!')
      return
    }

    const taskData = {
      ...formData,
      id: editingTask ? editingTask.id : Date.now().toString(),
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (editingTask) {
      setTasks(prev => prev.map(task => task.id === editingTask.id ? taskData : task))
      toast.success('Task updated successfully!')
    } else {
      setTasks(prev => [...prev, taskData])
      toast.success('Task created successfully!')
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      status: 'todo'
    })
    setIsFormOpen(false)
    setEditingTask(null)
  }

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status
    })
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
    toast.success('Task deleted successfully!')
  }

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ))
    
    if (newStatus === 'completed') {
      toast.success('Task completed! 🎉')
    }
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.status === filter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getTasksByStatus = (status) => {
    return getFilteredTasks().filter(task => task.status === status)
  }

  const formatDueDate = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM dd')
  }

  const isDueDateOverdue = (dateString, status) => {
    if (!dateString || status === 'completed') return false
    return isPast(new Date(dateString)) && !isToday(new Date(dateString))
  }

  const isDeadlineApproaching = (dateString, status) => {
    if (!dateString || status === 'completed') return false
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  const getTasksForDate = (date) => {
    return getFilteredTasks().filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    )
  }

  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, newStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      handleStatusChange(draggedTask.id, newStatus)
    }
    setDraggedTask(null)
  }

  const handleCalendarDrop = (e, date) => {
    e.preventDefault()
    if (draggedTask) {
      const newDueDate = format(date, 'yyyy-MM-dd')
      setTasks(prev => prev.map(task => 
        task.id === draggedTask.id 
          ? { ...task, dueDate: newDueDate, updatedAt: new Date().toISOString() }
          : task
      ))
      toast.success(`Task rescheduled to ${format(date, 'MMM dd, yyyy')}`)
    }
    setDraggedTask(null)
  }

  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    )
  }

  const TaskCard = ({ task }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      draggable
      onDragStart={() => handleDragStart(task)}
      className="card p-4 sm:p-5 hover:shadow-soft cursor-move group"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm sm:text-base line-clamp-2 flex-1">
          {task.title}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(task)}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <ApperIcon name="Edit2" className="w-4 h-4 text-surface-600 dark:text-surface-400" />
          </button>
          <button
            onClick={() => handleDelete(task.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <ApperIcon name="Trash2" className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-surface-600 dark:text-surface-400 text-xs sm:text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>

        {task.dueDate && (
          <span className={`text-xs px-2 py-1 rounded-lg ${
            isDueDateOverdue(task.dueDate, task.status)
              ? 'text-red-600 bg-red-50 border border-red-200'
              : 'text-surface-600 bg-surface-50 border border-surface-200'
          }`}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </motion.div>
  )

  const TaskCalendarCell = ({ date, tasks }) => {
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isTodayDate = isToday(date)
    const dayTasks = tasks.slice(0, 3) // Show max 3 tasks per cell
    const hasMoreTasks = tasks.length > 3

    return (
      <motion.div
        className={`min-h-24 sm:min-h-32 p-1 sm:p-2 border border-surface-200 dark:border-surface-700 transition-colors ${
          isCurrentMonth 
            ? 'bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700' 
            : 'bg-surface-50 dark:bg-surface-900'
        } ${isTodayDate ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleCalendarDrop(e, date)}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className={`text-right mb-1 ${
          isCurrentMonth 
            ? isTodayDate 
              ? 'text-primary font-bold' 
              : 'text-surface-900 dark:text-surface-100'
            : 'text-surface-400 dark:text-surface-600'
        } text-xs sm:text-sm`}>
          {format(date, 'd')}
        </div>
        
        <div className="space-y-1">
          {dayTasks.map(task => {
            const isHighPriority = task.priority === 'high' || task.priority === 'urgent'
            const isOverdue = isDueDateOverdue(task.dueDate, task.status)
            const isApproaching = isDeadlineApproaching(task.dueDate, task.status)
            
            return (
              <motion.div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                className={`text-xs p-1 rounded cursor-move truncate transition-colors ${
                  isOverdue
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300'
                    : isHighPriority
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-300'
                    : isApproaching
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300'
                    : 'bg-primary/10 text-primary-dark border border-primary/20'
                }`}
                title={task.title}
                onClick={() => handleEdit(task)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {task.title}
              </motion.div>
            )
          })}
          
          {hasMoreTasks && (
            <div className="text-xs text-surface-500 dark:text-surface-400 font-medium">
              +{tasks.length - 3} more
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const CalendarView = () => {
    const calendarDays = generateCalendarDays()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-4 sm:p-6"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <ApperIcon name="ChevronLeft" className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <ApperIcon name="ChevronRight" className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            </button>
          </div>
        </div>

        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-surface-600 dark:text-surface-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
          {calendarDays.map(date => (
            <TaskCalendarCell
              key={date.toISOString()}
              date={date}
              tasks={getTasksForDate(date)}
            />
          ))}
        </div>

        {/* Calendar Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-surface-600 dark:text-surface-400">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-surface-600 dark:text-surface-400">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-surface-600 dark:text-surface-400">Due Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary/10 border border-primary/20 rounded"></div>
            <span className="text-surface-600 dark:text-surface-400">Normal</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center lg:justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <ApperIcon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 text-sm sm:text-base"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-full sm:w-auto text-sm sm:text-base"
            >
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* View Toggle and Add Task */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-white dark:bg-surface-700 text-primary shadow-sm' 
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                }`}
              >
                <ApperIcon name="Columns" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-white dark:bg-surface-700 text-primary shadow-sm' 
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                }`}
              >
                <ApperIcon name="Calendar" className="w-4 h-4" />
              </button>
            </div>

            <motion.button
              onClick={() => setIsFormOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
            >
              <ApperIcon name="Plus" className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Task
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {Object.entries(statusColumns).map(([status, config]) => {
            const count = getTasksByStatus(status).length
            return (
              <div key={status} className="text-center p-3 sm:p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center`}>
                  <ApperIcon name={config.icon} className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-100">{count}</div>
                <div className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">{config.title}</div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        >
          {Object.entries(statusColumns).map(([status, config]) => {
            const statusTasks = getTasksByStatus(status)
            
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`card p-4 sm:p-6 min-h-96 border-t-4 ${config.color}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <ApperIcon name={config.icon} className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm sm:text-base">
                      {config.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                      {statusTasks.length} tasks
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <AnimatePresence>
                    {statusTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </AnimatePresence>

                  {statusTasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 sm:py-12"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                        <ApperIcon name="FileX" className="w-6 h-6 sm:w-8 sm:h-8 text-surface-400" />
                      </div>
                      <p className="text-surface-500 dark:text-surface-400 text-sm sm:text-base">No tasks here</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Task Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="card p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <ApperIcon name="X" className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Task description..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="input-field"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <ApperIcon name={editingTask ? "Save" : "Plus"} className="w-4 h-4" />
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainFeature