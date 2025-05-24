const { ApperClient } = window.ApperSDK

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
})

const TABLE_NAME = 'Comment2'

// All fields for fetch operations
const ALL_FIELDS = [
  'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
  'text', 'author', 'createdAt', 'task', 'parentComment'
]

// Only updateable fields for create/update operations
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'text', 'author', 'createdAt', 'task', 'parentComment'
]

export const commentService = {
  // Fetch all comments for a task
  async fetchCommentsByTask(taskId) {
    try {
      const params = {
        fields: ALL_FIELDS,
        where: [
          {
            fieldName: 'task',
            operator: 'EqualTo',
            values: [taskId]
          }
        ],
        orderBy: [
          {
            fieldName: 'createdAt',
            SortType: 'ASC'
          }
        ]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)
      return response?.data || []
    } catch (error) {
      console.error(`Error fetching comments for task ${taskId}:`, error)
      throw error
    }
  },

  // Get comment by ID
  async getCommentById(commentId) {
    try {
      const params = {
        fields: ALL_FIELDS
      }

      const response = await apperClient.getRecordById(TABLE_NAME, commentId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching comment with ID ${commentId}:`, error)
      throw error
    }
  },

  // Create new comment
  async createComment(commentData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      UPDATEABLE_FIELDS.forEach(field => {
        if (commentData.hasOwnProperty(field) && commentData[field] !== undefined) {
          filteredData[field] = commentData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create comment')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  },

  // Update existing comment
  async updateComment(commentId, commentData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: commentId }
      UPDATEABLE_FIELDS.forEach(field => {
        if (commentData.hasOwnProperty(field) && commentData[field] !== undefined) {
          filteredData[field] = commentData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  },

  // Delete comment
  async deleteComment(commentId) {
    try {
      const params = {
        RecordIds: [commentId]
      }

      const response = await apperClient.deleteRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return true
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }
}