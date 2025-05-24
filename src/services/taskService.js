const { ApperClient } = window.ApperSDK

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
})

const TABLE_NAME = 'task2'

// All fields for fetch operations (includes system fields)
const ALL_FIELDS = [
  'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
  'title', 'description', 'priority', 'status', 'dueDate', 'createdAt', 'updatedAt'
]

// Only updateable fields for create/update operations
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'title', 'description', 'priority', 'status', 'dueDate', 'createdAt', 'updatedAt'
]

export const taskService = {
  // Fetch all tasks with optional filtering
  async fetchTasks(params = {}) {
    try {
      const queryParams = {
        fields: ALL_FIELDS,
        ...params
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, queryParams)
      
      if (!response || !response.data) {
        return []
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  // Fetch tasks by status
  async fetchTasksByStatus(status) {
    try {
      const params = {
        fields: ALL_FIELDS,
        where: [
          {
            fieldName: 'status',
            operator: 'ExactMatch',
            values: [status]
          }
        ]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)
      return response?.data || []
    } catch (error) {
      console.error(`Error fetching tasks by status ${status}:`, error)
      throw error
    }
  },

  // Fetch tasks by priority
  async fetchTasksByPriority(priority) {
    try {
      const params = {
        fields: ALL_FIELDS,
        where: [
          {
            fieldName: 'priority',
            operator: 'ExactMatch',
            values: [priority]
          }
        ]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)
      return response?.data || []
    } catch (error) {
      console.error(`Error fetching tasks by priority ${priority}:`, error)
      throw error
    }
  },

  // Get task by ID
  async getTaskById(taskId) {
    try {
      const params = {
        fields: ALL_FIELDS
      }

      const response = await apperClient.getRecordById(TABLE_NAME, taskId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching task with ID ${taskId}:`, error)
      throw error
    }
  },

  // Create new task
  async createTask(taskData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      UPDATEABLE_FIELDS.forEach(field => {
        if (taskData.hasOwnProperty(field) && taskData[field] !== undefined) {
          filteredData[field] = taskData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Update existing task
  async updateTask(taskId, taskData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: taskId }
      UPDATEABLE_FIELDS.forEach(field => {
        if (taskData.hasOwnProperty(field) && taskData[field] !== undefined) {
          filteredData[field] = taskData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Delete task
  async deleteTask(taskId) {
    try {
      const params = {
        RecordIds: [taskId]
      }

      const response = await apperClient.deleteRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return true
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }
}