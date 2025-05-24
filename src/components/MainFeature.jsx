import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { useDropzone } from 'react-dropzone'
import { saveAs } from 'file-saver'
import { 
  format, isToday, isTomorrow, isPast, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, subDays, parseISO,
  differenceInDays, startOfDay, endOfDay, isAfter, isBefore, startOfWeek as startOfWeekFn,
  endOfWeek as endOfWeekFn
} from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import ApperIcon from './ApperIcon'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

function MainFeature() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban', 'calendar', or 'dashboard'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  const [activeTab, setActiveTab] = useState('details')
  // Dashboard state
  const [dashboardDateRange, setDashboardDateRange] = useState('30') // days

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    status: 'todo',
    attachments: [],
    comments: []
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
      updatedAt: new Date().toISOString(),
      attachments: editingTask ? editingTask.attachments || [] : [],
      comments: editingTask ? editingTask.comments || [] : []
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
      status: 'todo',
      attachments: [],
      comments: []
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
      status: task.status,
      attachments: task.attachments || [],
      comments: task.comments || []
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

  // File attachment functions
  const handleFileUpload = async (acceptedFiles) => {
    const newAttachments = await Promise.all(
      acceptedFiles.map(async (file) => {
        const fileUrl = await convertFileToBase64(file)
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          uploadedAt: new Date().toISOString()
        }
      })
    )

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }))

    toast.success(`${newAttachments.length} file(s) uploaded successfully!`)
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleFileDelete = (attachmentId) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter(att => att.id !== attachmentId)
      }))
      toast.success('Attachment deleted successfully!')
    }
  }

  const handleFileDownload = (attachment) => {
    try {
      // Convert base64 to blob and download
      const base64Data = attachment.url.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: attachment.type })
      saveAs(blob, attachment.name)
      
      toast.success('File downloaded successfully!')
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return 'Image'
    if (fileType.includes('pdf')) return 'FileText'
    if (fileType.includes('word') || fileType.includes('document')) return 'FileText'
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'FileSpreadsheet'
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation'
    return 'File'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Comment functions
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    const comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: newComment,
      author: 'Current User', // In a real app, this would come from authentication
      createdAt: new Date().toISOString(),
      replies: []
    }

    setFormData(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }))

    setNewComment('')
    toast.success('Comment added successfully!')
  }

  const handleAddReply = (parentCommentId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply')
      return
    }

    const reply = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: replyText,
      author: 'Current User',
      createdAt: new Date().toISOString()
    }

    setFormData(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === parentCommentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    }))

    setReplyText('')
    setReplyingTo(null)
    toast.success('Reply added successfully!')
  }

  const handleDeleteComment = (commentId, isReply = false, parentCommentId = null) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      if (isReply && parentCommentId) {
        setFormData(prev => ({
          ...prev,
          comments: prev.comments.map(comment =>
            comment.id === parentCommentId
              ? { ...comment, replies: comment.replies.filter(reply => reply.id !== commentId) }
              : comment
          )
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== commentId)
        }))
      }
      toast.success('Comment deleted successfully!')
    }
  }

  // File upload dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejectedFiles) => {
      toast.error(`Some files were rejected. Please check file size (max 10MB) and type.`)
    }
  })

  // Dashboard Analytics Functions
  // Dashboard Analytics Functions
  const getDashboardData = () => {
    const today = new Date()
    let startDate
    
    switch (dashboardDateRange) {
      case '7':
        startDate = subDays(today, 7)
        break
      case '30':
        startDate = subDays(today, 30)
        break
      case '90':
        startDate = subDays(today, 90)
        break
      default:
        startDate = new Date(0) // All time
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      return isAfter(taskDate, startDate) || dashboardDateRange === 'all'
    })
  }

  const getCompletionMetrics = () => {
    const dashboardTasks = getDashboardData()
    const totalTasks = dashboardTasks.length
    const completedTasks = dashboardTasks.filter(task => task.status === 'completed').length
    const inProgressTasks = dashboardTasks.filter(task => task.status === 'in-progress').length
    const todoTasks = dashboardTasks.filter(task => task.status === 'todo').length
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: completionRate.toFixed(1)
    }
  }

  const getAverageCompletionTime = () => {
    const completedTasks = getDashboardData().filter(task => 
      task.status === 'completed' && task.createdAt && task.updatedAt
    )
    
    if (completedTasks.length === 0) return 0
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt)
      const completed = new Date(task.updatedAt)
      return sum + differenceInDays(completed, created)
    }, 0)
    
    return (totalDays / completedTasks.length).toFixed(1)
  }

  const getPriorityDistribution = () => {
    const dashboardTasks = getDashboardData()
    const distribution = {
      low: dashboardTasks.filter(task => task.priority === 'low').length,
      medium: dashboardTasks.filter(task => task.priority === 'medium').length,
      high: dashboardTasks.filter(task => task.priority === 'high').length,
      urgent: dashboardTasks.filter(task => task.priority === 'urgent').length
    }
    return distribution
  }

  const getWeeklyProgress = () => {
    const weeks = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = startOfWeekFn(subDays(today, i * 7))
      const weekEnd = endOfWeekFn(weekStart)
      
      const weekTasks = tasks.filter(task => {
        if (!task.updatedAt) return false
        const taskDate = new Date(task.updatedAt)
        return isAfter(taskDate, weekStart) && isBefore(taskDate, weekEnd)
      })
      
      const completed = weekTasks.filter(task => task.status === 'completed').length
      
      weeks.push({
        week: format(weekStart, 'MMM dd'),
        completed,
        total: weekTasks.length
      })
    }
    
    return weeks
  }

  const getOverdueTasks = () => {
    const today = new Date()
    return getDashboardData().filter(task => 
      task.dueDate && 
      task.status !== 'completed' && 
      isBefore(new Date(task.dueDate), today)
    ).length
  }

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#64748b',
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8
      }
    }
  }

  const DashboardView = () => {
    const metrics = getCompletionMetrics()
    const avgCompletionTime = getAverageCompletionTime()
    const priorityDist = getPriorityDistribution()
    const weeklyData = getWeeklyProgress()
    const overdueTasks = getOverdueTasks()

    // Status distribution chart data
    const statusChartData = {
      labels: ['Completed', 'In Progress', 'To Do'],
      datasets: [{
        data: [metrics.completedTasks, metrics.inProgressTasks, metrics.todoTasks],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    }

    // Priority distribution chart data
    const priorityChartData = {
      labels: ['Low', 'Medium', 'High', 'Urgent'],
      datasets: [{
        data: [priorityDist.low, priorityDist.medium, priorityDist.high, priorityDist.urgent],
        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    }

    // Weekly progress chart data
    const weeklyChartData = {
      labels: weeklyData.map(week => week.week),
      datasets: [
        {
          label: 'Completed Tasks',
          data: weeklyData.map(week => week.completed),
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: '#6366f1',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }
      ]
    }

    // Completion rate bar chart
    const completionBarData = {
      labels: ['This Period'],
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: [metrics.completionRate],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Dashboard Header */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
                Progress Dashboard
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                Analytics and insights for your tasks and productivity
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={dashboardDateRange}
                onChange={(e) => setDashboardDateRange(e.target.value)}
                className="input-field w-auto text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card p-4 sm:p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <ApperIcon name="CheckCircle" className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
              {metrics.completionRate}%
            </div>
            <div className="text-sm text-surface-600 dark:text-surface-400">
              Completion Rate
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card p-4 sm:p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <ApperIcon name="Clock" className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
              {avgCompletionTime}
            </div>
            <div className="text-sm text-surface-600 dark:text-surface-400">
              Avg. Days to Complete
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card p-4 sm:p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <ApperIcon name="BarChart3" className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
              {metrics.totalTasks}
            </div>
            <div className="text-sm text-surface-600 dark:text-surface-400">
              Total Tasks
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card p-4 sm:p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <ApperIcon name="AlertTriangle" className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
              {overdueTasks}
            </div>
            <div className="text-sm text-surface-600 dark:text-surface-400">
              Overdue Tasks
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress Line Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4 sm:p-6"
          >
            <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Weekly Progress Trend
            </h4>
            <div className="h-64">
              <Line data={weeklyChartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Completion Rate Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4 sm:p-6"
          >
            <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Completion Rate
            </h4>
            <div className="h-64">
              <Bar data={completionBarData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Task Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-4 sm:p-6"
          >
            <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Task Status Distribution
            </h4>
            <div className="h-64">
              <Doughnut data={statusChartData} options={pieChartOptions} />
            </div>
          </motion.div>

          {/* Priority Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-4 sm:p-6"
          >
            <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Priority Distribution
            </h4>
            <div className="h-64">
              <Pie data={priorityChartData} options={pieChartOptions} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const TaskCard = ({ task }) => (
    <motion.div
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
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const dayTasks = tasks.slice(0, 3) // Show max 3 tasks per cell
    const hasMoreTasks = tasks.length > 3

    return (
      <motion.div
        className={`min-h-24 sm:min-h-32 p-1 sm:p-2 border border-surface-200 dark:border-surface-700 transition-all duration-200 ${
          isCurrentMonth 
            ? draggedTask 
              ? 'bg-white dark:bg-surface-800 hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-primary/30 cursor-pointer' 
              : 'bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700' 
            : 'bg-surface-50 dark:bg-surface-900'
        } ${isTodayDate ? 'ring-2 ring-primary bg-primary/5' : ''} ${
          isSelected ? 'ring-2 ring-secondary bg-secondary/10' : ''
        } ${draggedTask ? 'hover:shadow-lg hover:scale-[1.02]' : ''}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleCalendarDrop(e, date)}
        onClick={() => tasks.length > 0 && setSelectedDate(date)}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className={`flex items-center justify-between mb-1 ${
          isCurrentMonth 
            ? isTodayDate 
              ? 'text-primary font-bold' 
              : 'text-surface-900 dark:text-surface-100'
            : 'text-surface-400 dark:text-surface-600'
        } text-xs sm:text-sm`}>
          {format(date, 'd')}
          {tasks.length > 0 && (
            <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
              {tasks.length > 9 ? '9+' : tasks.length}
            </div>
          )}
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
    const tasksForDate = getTasksForDate(selectedDate)
    const dateString = format(selectedDate, 'EEEE, MMMM d, yyyy')
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-4 sm:p-6"
      >
        {/* Date Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-2"
            >
              <ApperIcon name="ArrowLeft" className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Calendar</span>
            </button>
            <h3 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
              Tasks for {dateString}
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              {tasksForDate.length} {tasksForDate.length === 1 ? 'task' : 'tasks'} scheduled
            </p>
          </div>
        </div>

        {/* Tasks List */}
        {tasksForDate.length > 0 ? (
          <div className="space-y-4">
            {/* Group tasks by status */}
            {Object.entries(statusColumns).map(([status, config]) => {
              const statusTasks = tasksForDate.filter(task => task.status === status)
              
              if (statusTasks.length === 0) return null
              
              return (
                <div key={status} className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                      <ApperIcon name={config.icon} className="w-3 h-3 text-white" />
                    </div>
                    <h4 className="font-semibold text-surface-900 dark:text-surface-100">
                      {config.title} ({statusTasks.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {statusTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
              <ApperIcon name="Calendar" className="w-8 h-8 text-surface-400" />
            </div>
            <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
              No tasks scheduled
            </h4>
            <p className="text-surface-500 dark:text-surface-400">
              No tasks are scheduled for this date.
            </p>
          </motion.div>
        )}
      </motion.div>
    )
  }

  const TaskDateView = () => {
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
          <div className="flex items-center gap-2 sm:gap-4">
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
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'dashboard' 
                    ? 'bg-white dark:bg-surface-700 text-primary shadow-sm' 
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                }`}
              >
                <ApperIcon name="BarChart3" className="w-4 h-4" />
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
      {selectedDate ? (
        <TaskDateView />
      ) : viewMode === 'dashboard' ? (
        <DashboardView />
      ) : viewMode === 'calendar' ? (
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
              className="card p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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

              {/* Tab Navigation */}
              <div className="tab-nav">
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <ApperIcon name="FileText" className="w-4 h-4 mr-2 inline" />
                  Details
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attachments')}
                >
                  <ApperIcon name="Paperclip" className="w-4 h-4 mr-2 inline" />
                  Attachments ({formData.attachments.length})
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  <ApperIcon name="MessageSquare" className="w-4 h-4 mr-2 inline" />
                  Comments ({formData.comments.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'details' && (
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
              )}

              {/* Attachments Tab */}
              {activeTab === 'attachments' && (
                <div className="space-y-6">
                  {/* File Upload Zone */}
                  <div
                    {...getRootProps()}
                    className={`upload-zone ${isDragActive ? 'dragover' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center">
                      <ApperIcon name="Upload" className="w-12 h-12 mx-auto mb-4 text-surface-400" />
                      <p className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                        {isDragActive ? 'Drop files here' : 'Upload files'}
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        Drag and drop files here, or click to select files
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-500">
                        Supports: Images, PDFs, Documents, Spreadsheets (Max 10MB each)
                      </p>
                    </div>
                  </div>

                  {/* Attachments List */}
                  {formData.attachments.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                        Attachments ({formData.attachments.length})
                      </h4>
                      <div className="attachment-grid">
                        {formData.attachments.map((attachment) => (
                          <motion.div
                            key={attachment.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="attachment-item"
                          >
                            {/* File Preview */}
                            <div className="mb-3">
                              {attachment.type.startsWith('image/') ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="file-preview"
                                />
                              ) : (
                                <div className="file-icon">
                                  <ApperIcon 
                                    name={getFileIcon(attachment.type)} 
                                    className="w-8 h-8 text-white" 
                                  />
                                </div>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="mb-3">
                              <h5 className="font-medium text-surface-900 dark:text-surface-100 text-sm truncate" title={attachment.name}>
                                {attachment.name}
                              </h5>
                              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
                                {formatFileSize(attachment.size)}
                              </p>
                              <p className="text-xs text-surface-500 dark:text-surface-500">
                                {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
                              </p>
                            </div>

                            {/* File Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleFileDownload(attachment)}
                                className="flex-1 px-3 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                              >
                                <ApperIcon name="Download" className="w-3 h-3 mr-1 inline" />
                                Download
                              </button>
                              <button
                                onClick={() => handleFileDelete(attachment.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <ApperIcon name="Trash2" className="w-3 h-3" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.attachments.length === 0 && (
                    <div className="text-center py-8">
                      <ApperIcon name="Paperclip" className="w-12 h-12 mx-auto mb-4 text-surface-400" />
                      <p className="text-surface-600 dark:text-surface-400">No attachments yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Add Comment */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                      Add a comment
                    </label>
                    <div className="flex gap-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="input-field resize-none flex-1"
                        rows={3}
                        placeholder="Write your comment here..."
                      />
                      <button
                        onClick={handleAddComment}
                        className="btn-primary h-fit px-4 py-2"
                      >
                        <ApperIcon name="Send" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {formData.comments.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                        Comments ({formData.comments.length})
                      </h4>
                      <div className="comment-thread">
                        {formData.comments.map((comment) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="comment-item"
                          >
                            {/* Comment Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {comment.author.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">
                                    {comment.author}
                                  </p>
                                  <p className="text-xs text-surface-500 dark:text-surface-500">
                                    {format(new Date(comment.createdAt), 'MMM dd, yyyy • HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                              >
                                <ApperIcon name="Trash2" className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Comment Text */}
                            <p className="text-surface-700 dark:text-surface-300 mb-3">
                              {comment.text}
                            </p>

                            {/* Comment Actions */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-sm text-primary hover:text-primary-dark transition-colors"
                              >
                                <ApperIcon name="Reply" className="w-4 h-4 mr-1 inline" />
                                Reply
                              </button>
                            </div>

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                              <div className="mt-4 pl-4 border-l-2 border-surface-300 dark:border-surface-600">
                                <div className="flex gap-3">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="input-field resize-none flex-1"
                                    rows={2}
                                    placeholder="Write your reply..."
                                  />
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => handleAddReply(comment.id)}
                                      className="btn-primary px-3 py-1 text-sm"
                                    >
                                      Reply
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                      }}
                                      className="btn-secondary px-3 py-1 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="comment-reply">
                                {comment.replies.map((reply) => (
                                  <motion.div
                                    key={reply.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="comment-item"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs font-medium">
                                            {reply.author.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">
                                            {reply.author}
                                          </p>
                                          <p className="text-xs text-surface-500 dark:text-surface-500">
                                            {format(new Date(reply.createdAt), 'MMM dd, yyyy • HH:mm')}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                        className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                                      >
                                        <ApperIcon name="Trash2" className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-surface-700 dark:text-surface-300">
                                      {reply.text}
                                    </p>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.comments.length === 0 && (
                    <div className="text-center py-8">
                      <ApperIcon name="MessageSquare" className="w-12 h-12 mx-auto mb-4 text-surface-400" />
                      <p className="text-surface-600 dark:text-surface-400">No comments yet</p>
                      <p className="text-sm text-surface-500 dark:text-surface-500">Be the first to add a comment!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainFeature