const { ApperClient } = window.ApperSDK

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
})

const TABLE_NAME = 'Notification3'

// All fields for fetch operations
const ALL_FIELDS = [
  'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
  'title', 'body', 'type', 'read', 'createdAt', 'task'
]

// Only updateable fields for create/update operations
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'title', 'body', 'type', 'read', 'createdAt', 'task'
]

export const notificationService = {
  // Fetch all notifications for the current user
  async fetchNotifications(userId) {
    try {
      const params = {
        fields: ALL_FIELDS,
        where: [
          {
            fieldName: 'Owner',
            operator: 'EqualTo',
            values: [userId]
          }
        ],
        orderBy: [
          {
            fieldName: 'createdAt',
            SortType: 'DESC'
          }
        ]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)
      return response?.data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  },

  // Get notification by ID
  async getNotificationById(notificationId) {
    try {
      const params = {
        fields: ALL_FIELDS
      }

      const response = await apperClient.getRecordById(TABLE_NAME, notificationId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching notification with ID ${notificationId}:`, error)
      throw error
    }
  },

  // Create new notification
  async createNotification(notificationData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      UPDATEABLE_FIELDS.forEach(field => {
        if (notificationData.hasOwnProperty(field) && notificationData[field] !== undefined) {
          filteredData[field] = notificationData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create notification')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  },

  // Update existing notification (typically to mark as read)
  async updateNotification(notificationId, notificationData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: notificationId }
      UPDATEABLE_FIELDS.forEach(field => {
        if (notificationData.hasOwnProperty(field) && notificationData[field] !== undefined) {
          filteredData[field] = notificationData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update notification')
      }
    } catch (error) {
      console.error('Error updating notification:', error)
      throw error
    }
  },

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const params = {
        RecordIds: [notificationId]
      }

      const response = await apperClient.deleteRecord(TABLE_NAME, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return true
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to delete notification')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }
}