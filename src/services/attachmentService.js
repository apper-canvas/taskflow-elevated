const { ApperClient } = window.ApperSDK

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
})

const TABLE_NAME = 'Attachment3'

// All fields for fetch operations
const ALL_FIELDS = [
  'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
  'size', 'type', 'url', 'uploadedAt', 'task'
]

// Only updateable fields for create/update operations
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'size', 'type', 'url', 'uploadedAt', 'task'
]

export const attachmentService = {
  // Fetch all attachments for a task
  async fetchAttachmentsByTask(taskId) {
    try {
      const params = {
        fields: ALL_FIELDS,
        where: [
          {
            fieldName: 'task',
            operator: 'EqualTo',
            values: [taskId]
          }
        ]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)
      return response?.data || []
    } catch (error) {
      console.error(`Error fetching attachments for task ${taskId}:`, error)
      throw error
    }
  },

  // Get attachment by ID
  async getAttachmentById(attachmentId) {
    try {
      const params = {
        fields: ALL_FIELDS
      }

      const response = await apperClient.getRecordById(TABLE_NAME, attachmentId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching attachment with ID ${attachmentId}:`, error)
      throw error
    }
  },

  // Create new attachment
  async createAttachment(attachmentData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      UPDATEABLE_FIELDS.forEach(field => {
        if (attachmentData.hasOwnProperty(field) && attachmentData[field] !== undefined) {
          filteredData[field] = attachmentData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create attachment')
      }
    } catch (error) {
      console.error('Error creating attachment:', error)
      throw error
    }
  },

  // Update existing attachment
  async updateAttachment(attachmentId, attachmentData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: attachmentId }
      UPDATEABLE_FIELDS.forEach(field => {
        if (attachmentData.hasOwnProperty(field) && attachmentData[field] !== undefined) {
          filteredData[field] = attachmentData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update attachment')
      }
    } catch (error) {
      console.error('Error updating attachment:', error)
      throw error
    }
  },

  // Delete attachment
  async deleteAttachment(attachmentId) {
    try {
      const params = {
        RecordIds: [attachmentId]
      }

      const response = await apperClient.deleteRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return true
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to delete attachment')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      throw error
    }
  }
}